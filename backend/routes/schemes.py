"""
GovPlot Tracker — Schemes API Routes
GET /api/v1/schemes           → list all schemes (filterable)
GET /api/v1/schemes/{id}      → single scheme
POST /api/v1/schemes/sync     → trigger scraper refresh
"""

import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.db_models import Scheme, SchemeOut

logger = logging.getLogger(__name__)
router = APIRouter()

LATEST_JSON = Path("data/schemes/latest.json")


# ── helpers ──────────────────────────────────────────────────────────────────

def _load_from_json() -> list[dict]:
    if LATEST_JSON.exists():
        with open(LATEST_JSON, encoding="utf-8") as f:
            return json.load(f)
    return []


def _seed_db_from_json(db: Session):
    """Seed the DB from the latest JSON snapshot (used on first run)."""
    schemes_data = _load_from_json()
    for s in schemes_data:
        existing = db.query(Scheme).filter_by(scheme_id=s["scheme_id"]).first()
        if existing:
            # Update status and last_updated
            existing.status = s.get("status", existing.status)
            existing.last_updated = None  # triggers onupdate
        else:
            db.add(Scheme(**{k: v for k, v in s.items() if hasattr(Scheme, k)}))
    db.commit()


# ── routes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[SchemeOut])
def list_schemes(
    city: Optional[str] = Query(None, description="Filter by city name"),
    status: Optional[str] = Query(None, description="OPEN | CLOSED | ACTIVE | UPCOMING"),
    authority: Optional[str] = Query(None, description="Filter by authority e.g. LDA, BDA"),
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List government plot schemes with optional filters."""
    _seed_db_from_json(db)

    q = db.query(Scheme).filter(Scheme.is_active == True)
    if city:
        q = q.filter(Scheme.city.ilike(f"%{city}%"))
    if status:
        q = q.filter(Scheme.status == status.upper())
    if authority:
        q = q.filter(Scheme.authority.ilike(f"%{authority}%"))

    schemes = q.order_by(Scheme.last_updated.desc()).offset(offset).limit(limit).all()
    return schemes


@router.get("/stats")
def scheme_stats(db: Session = Depends(get_db)):
    """Summary statistics for the dashboard header."""
    _seed_db_from_json(db)

    total = db.query(Scheme).filter(Scheme.is_active == True).count()
    open_count = db.query(Scheme).filter(Scheme.status == "OPEN", Scheme.is_active == True).count()
    active_count = db.query(Scheme).filter(Scheme.status == "ACTIVE", Scheme.is_active == True).count()
    upcoming_count = db.query(Scheme).filter(Scheme.status == "UPCOMING", Scheme.is_active == True).count()
    cities = db.query(Scheme.city).distinct().count()

    return {
        "total_schemes": total,
        "open": open_count,
        "active": active_count,
        "upcoming": upcoming_count,
        "closed": total - open_count - active_count - upcoming_count,
        "cities_tracked": cities,
    }


@router.get("/{scheme_id}", response_model=SchemeOut)
def get_scheme(scheme_id: str, db: Session = Depends(get_db)):
    """Get a single scheme by its ID."""
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme


def _run_scraper_bg():
    """Background task to refresh data from all scrapers."""
    try:
        from scraper.main import run_all
        run_all()
        logger.info("Background scrape completed.")
    except Exception as exc:
        logger.error(f"Background scrape failed: {exc}")


@router.post("/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    """Manually trigger a scraper run (admin use / cron webhook)."""
    background_tasks.add_task(_run_scraper_bg)
    return {"message": "Scraper started in background. Check /schemes in ~30 seconds."}
