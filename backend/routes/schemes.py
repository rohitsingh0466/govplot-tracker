"""
GovPlot Tracker — Schemes API Routes v3.0
Visibility rules:
  - Anonymous (no token): CLOSED + UPCOMING only, OPEN/ACTIVE cards blurred
  - Free signed-in:       ALL statuses visible (full detail)
  - Pro / Premium:        ALL statuses + alert subscriptions
"""

import json
import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from backend.models.database import get_db
from backend.models.db_models import Scheme, SchemeOut, User

logger = logging.getLogger(__name__)
router = APIRouter()

LATEST_JSON = Path("data/schemes/latest.json")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ALGORITHM = "HS256"

# ── Statuses visible to anonymous (not logged in) users ──────────────────────
ANON_VISIBLE_STATUSES = {"CLOSED", "UPCOMING"}
# OPEN and ACTIVE are blurred for anonymous users


def _is_postgres() -> bool:
    return "postgresql" in os.getenv("DATABASE_URL", "")


def _load_from_json() -> list[dict]:
    if LATEST_JSON.exists():
        try:
            with open(LATEST_JSON, encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception as exc:
            logger.warning(f"Could not read latest.json: {exc}")
    return []


def _seed_db_from_json(db: Session):
    """Seed DB from static_schemes.py if empty, falling back to latest.json."""
    if _is_postgres():
        count = db.query(Scheme).count()
        if count > 0:
            return
        logger.info("Postgres schemes table is empty — seeding once...")

    try:
        from scraper.cities.static_schemes import get_all_static_schemes
        schemes_data = get_all_static_schemes()
    except Exception as exc:
        logger.warning(f"Could not load static_schemes.py: {exc}")
        schemes_data = _load_from_json()

    if not schemes_data:
        return

    inserted = 0
    for s in schemes_data:
        existing = db.query(Scheme).filter_by(scheme_id=s.get("scheme_id")).first()
        if not existing:
            try:
                scheme_fields = {
                    k: v
                    for k, v in s.items()
                    if hasattr(Scheme, k) and k not in ("last_updated", "is_active")
                }
                db.add(Scheme(is_active=True, **scheme_fields))
                inserted += 1
            except Exception as exc:
                logger.warning(f"Skipping scheme {s.get('scheme_id')}: {exc}")
    db.commit()
    if inserted:
        logger.info(f"Seeded {inserted} schemes")


def _get_optional_user(request: Request, db: Session) -> Optional[User]:
    """Extract user from Bearer token if present; returns None for anonymous."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        subject = payload.get("sub")
        if not subject:
            return None
    except JWTError:
        return None

    user = None
    if subject and subject.isdigit():
        user = db.query(User).filter(User.id == int(subject), User.is_active == True).first()
    else:
        user = db.query(User).filter(User.email == subject, User.is_active == True).first()
    return user


def _apply_visibility(scheme: Scheme, user: Optional[User]) -> SchemeOut:
    """
    Apply visibility rules:
    - No user (anonymous): OPEN/ACTIVE schemes are returned but blurred=True
    - Signed-in (any tier): full detail, blurred=False
    """
    out = SchemeOut.model_validate(scheme)

    if user is None and scheme.status in ("OPEN", "ACTIVE"):
        # Return card but blur all sensitive details
        out.blurred = True
        out.apply_url = None
        out.source_url = None
        out.location_details = None
        out.price_min = None
        out.price_max = None
        out.area_sqft_min = None
        out.area_sqft_max = None
        out.total_plots = None

    return out


@router.get("/", response_model=list[SchemeOut])
def list_schemes(
    request: Request,
    city: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    authority: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    _seed_db_from_json(db)
    user = _get_optional_user(request, db)

    q = db.query(Scheme).filter(Scheme.is_active == True)
    if city:
        q = q.filter(Scheme.city.ilike(f"%{city}%"))
    if status:
        q = q.filter(Scheme.status == status.upper())
    if authority:
        q = q.filter(Scheme.authority.ilike(f"%{authority}%"))

    schemes = q.order_by(Scheme.last_updated.desc()).offset(offset).limit(limit).all()

    return [_apply_visibility(s, user) for s in schemes]


@router.get("/stats")
def scheme_stats(db: Session = Depends(get_db)):
    _seed_db_from_json(db)
    total      = db.query(Scheme).filter(Scheme.is_active == True).count()
    open_c     = db.query(Scheme).filter(Scheme.status == "OPEN",     Scheme.is_active == True).count()
    active_c   = db.query(Scheme).filter(Scheme.status == "ACTIVE",   Scheme.is_active == True).count()
    upcoming_c = db.query(Scheme).filter(Scheme.status == "UPCOMING", Scheme.is_active == True).count()
    cities     = db.query(Scheme.city).distinct().count()
    return {
        "total_schemes": total,
        "open": open_c,
        "active": active_c,
        "upcoming": upcoming_c,
        "closed": total - open_c - active_c - upcoming_c,
        "cities_tracked": cities,
        "data_source": "postgresql" if _is_postgres() else "sqlite",
    }


@router.get("/{scheme_id}", response_model=SchemeOut)
def get_scheme(scheme_id: str, request: Request, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    user = _get_optional_user(request, db)
    return _apply_visibility(scheme, user)


def _run_scraper_bg():
    try:
        from scraper.main import run_all
        run_all()
        logger.info("✅ Background scrape completed.")
    except Exception as exc:
        logger.error(f"❌ Background scrape failed: {exc}")


@router.post("/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_scraper_bg)
    return {"message": "Scraper started in background. Data will update in ~60 seconds."}
