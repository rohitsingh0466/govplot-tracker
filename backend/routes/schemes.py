"""
GovPlot Tracker — Schemes API Routes
"""

import json
import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.db_models import Scheme, SchemeOut

logger = logging.getLogger(__name__)
router = APIRouter()

LATEST_JSON = Path("data/schemes/latest.json")


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
    """
    Seed DB from JSON only when needed:
    - SQLite (local dev): always check and seed missing records
    - Postgres: ONLY seed if table is completely empty (first run only)
    """
    if _is_postgres():
        count = db.query(Scheme).count()
        if count > 0:
            return  # Postgres has data — skip JSON seeding entirely
        logger.info("Postgres schemes table is empty — seeding from latest.json once...")

    schemes_data = _load_from_json()
    if not schemes_data:
        return

    inserted = 0
    for s in schemes_data:
        existing = db.query(Scheme).filter_by(scheme_id=s.get("scheme_id")).first()
        if not existing:
            try:
                db.add(Scheme(**{k: v for k, v in s.items() if hasattr(Scheme, k)}))
                inserted += 1
            except Exception as exc:
                logger.warning(f"Skipping scheme {s.get('scheme_id')}: {exc}")
    db.commit()
    if inserted:
        logger.info(f"Seeded {inserted} schemes from latest.json")


@router.get("/", response_model=list[SchemeOut])
def list_schemes(
    city: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    authority: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    _seed_db_from_json(db)
    q = db.query(Scheme).filter(Scheme.is_active == True)
    if city:
        q = q.filter(Scheme.city.ilike(f"%{city}%"))
    if status:
        q = q.filter(Scheme.status == status.upper())
    if authority:
        q = q.filter(Scheme.authority.ilike(f"%{authority}%"))
    return q.order_by(Scheme.last_updated.desc()).offset(offset).limit(limit).all()


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
def get_scheme(scheme_id: str, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme


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
