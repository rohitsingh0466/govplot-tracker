"""
SCM — Static Data Router
=========================
Manage fallback static scheme snapshots per authority.

GET  /api/v1/admin/scm/static-data/              → list latest snapshots for all authorities
GET  /api/v1/admin/scm/static-data/{code}        → current snapshot for one authority
GET  /api/v1/admin/scm/static-data/{code}/history → all historical snapshots
PUT  /api/v1/admin/scm/static-data/{code}        → replace current snapshot (archives old)
DELETE /api/v1/admin/scm/static-data/{code}      → clear static data (sets is_current=False on all)
"""

import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.routes.admin_auth import get_current_admin

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Pydantic models ────────────────────────────────────────────────────────────

class StaticDataUpdate(BaseModel):
    scheme_data:      List[Dict[str, Any]] = Field(
        ...,
        description="List of scheme dicts. Each should match the schemes table structure.",
    )
    snapshot_source:  Optional[str] = Field(
        None,
        description="Where this data came from e.g. 'manual_upload', 'last_good_scrape_2026-04-10'",
    )
    notes: Optional[str] = None


# ── Helper ────────────────────────────────────────────────────────────────────

def _get_authority_id(db: Session, code: str) -> str:
    row = db.execute(
        text("SELECT id FROM public.scraper_authorities WHERE authority_code = :code"),
        {"code": code.upper()},
    ).fetchone()
    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Authority '{code.upper()}' not found",
        )
    return str(row[0])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", summary="Latest static snapshot for every authority")
def list_static_data(
    has_data: Optional[bool] = Query(None, description="True = only authorities WITH data"),
    db:       Session        = Depends(get_db),
    admin:    dict           = Depends(get_current_admin),
):
    """
    Returns one row per authority with their current (is_current=TRUE) snapshot.
    Authorities with no snapshot are included with has_static_data=false.
    """
    rows = db.execute(
        text("""
            SELECT
                sa.authority_code,
                sa.authority_name,
                sa.state,
                sa.is_active,
                sd.id             AS snapshot_id,
                sd.snapshot_source,
                sd.snapshot_at,
                sd.notes          AS snapshot_notes,
                sd.is_current,
                jsonb_array_length(sd.scheme_data) AS scheme_count,
                CASE WHEN sd.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_static_data
            FROM public.scraper_authorities sa
            LEFT JOIN public.scraper_static_data sd
                ON sd.authority_id = sa.id AND sd.is_current = TRUE
            ORDER BY sa.priority_rank ASC, sa.authority_code ASC
        """),
    ).fetchall()

    result = [dict(r._mapping) for r in rows]

    if has_data is True:
        result = [r for r in result if r["has_static_data"]]
    elif has_data is False:
        result = [r for r in result if not r["has_static_data"]]

    return {
        "items":         result,
        "total":         len(result),
        "with_data":     sum(1 for r in result if r["has_static_data"]),
        "without_data":  sum(1 for r in result if not r["has_static_data"]),
    }


@router.get("/{code}", summary="Current static snapshot for one authority")
def get_static_data(
    code: str,
    db:   Session = Depends(get_db),
    admin: dict   = Depends(get_current_admin),
):
    """
    Returns the current (is_current=TRUE) static snapshot including full scheme_data.
    Use this to review what fallback data the scraper will use if the live site is down.
    """
    authority_id = _get_authority_id(db, code)

    row = db.execute(
        text("""
            SELECT
                sd.*,
                sa.authority_code,
                sa.authority_name
            FROM public.scraper_static_data sd
            JOIN public.scraper_authorities sa ON sa.id = sd.authority_id
            WHERE sd.authority_id = :aid AND sd.is_current = TRUE
            ORDER BY sd.snapshot_at DESC
            LIMIT 1
        """),
        {"aid": authority_id},
    ).fetchone()

    if not row:
        return {
            "authority_code":  code.upper(),
            "has_static_data": False,
            "message":         "No static fallback stored yet. "
                               "Run the scraper once or upload via PUT /scm/static-data/{code}.",
        }

    result = dict(row._mapping)
    result["authority_code"]  = code.upper()
    result["has_static_data"] = True
    result["scheme_count"]    = len(result.get("scheme_data") or [])
    return result


@router.get("/{code}/history", summary="All historical snapshots for one authority")
def get_static_data_history(
    code:   str,
    limit:  int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db:     Session = Depends(get_db),
    admin:  dict    = Depends(get_current_admin),
):
    """
    Lists all past snapshots (newest first). scheme_data is excluded from list view
    for performance — fetch a specific snapshot_id via GET /{code} or check is_current.
    """
    authority_id = _get_authority_id(db, code)

    rows = db.execute(
        text("""
            SELECT
                id,
                authority_id,
                snapshot_source,
                snapshot_at,
                is_current,
                notes,
                created_at,
                jsonb_array_length(scheme_data) AS scheme_count
            FROM public.scraper_static_data
            WHERE authority_id = :aid
            ORDER BY snapshot_at DESC
            LIMIT :limit OFFSET :offset
        """),
        {"aid": authority_id, "limit": limit, "offset": offset},
    ).fetchall()

    total = db.execute(
        text("SELECT COUNT(*) FROM public.scraper_static_data WHERE authority_id = :aid"),
        {"aid": authority_id},
    ).fetchone()[0]

    return {
        "authority_code": code.upper(),
        "items":  [dict(r._mapping) for r in rows],
        "total":  total,
        "limit":  limit,
        "offset": offset,
    }


@router.put("/{code}", status_code=200, summary="Replace static fallback data for an authority")
def update_static_data(
    code:    str,
    payload: StaticDataUpdate,
    db:      Session = Depends(get_db),
    admin:   dict    = Depends(get_current_admin),
):
    """
    Replace the current static fallback data for an authority.

    How it works:
    1. The previous current snapshot is archived (is_current → FALSE).
    2. A new snapshot is inserted with is_current=TRUE.
    3. All historical snapshots remain intact for audit purposes.

    When to use this:
    - After a successful manual scrape when live scraping is broken
    - To seed initial static data for a new authority before live scraping works
    - To correct incorrect fallback data
    """
    authority_id = _get_authority_id(db, code)

    # Validate scheme_data entries minimally
    required_fields = {"name", "authority"}
    for i, scheme in enumerate(payload.scheme_data):
        missing = required_fields - set(scheme.keys())
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"scheme_data[{i}] is missing required fields: {missing}",
            )

    # Archive previous current snapshot
    db.execute(
        text("""
            UPDATE public.scraper_static_data
            SET is_current = FALSE
            WHERE authority_id = :aid AND is_current = TRUE
        """),
        {"aid": authority_id},
    )

    # Insert new current snapshot
    row = db.execute(
        text("""
            INSERT INTO public.scraper_static_data
                (authority_id, scheme_data, snapshot_source, is_current, notes)
            VALUES
                (:aid, :data::JSONB, :source, TRUE, :notes)
            RETURNING id, snapshot_at
        """),
        {
            "aid":    authority_id,
            "data":   json.dumps(payload.scheme_data),
            "source": payload.snapshot_source or f"manual_upload_by_{admin['email']}",
            "notes":  payload.notes,
        },
    ).fetchone()
    db.commit()

    logger.info(
        "[SCM] Static data updated for %s by %s: %d schemes",
        code, admin["email"], len(payload.scheme_data),
    )
    return {
        "message":        "Static fallback data updated",
        "authority_code": code.upper(),
        "snapshot_id":    str(row[0]),
        "snapshot_at":    str(row[1]),
        "scheme_count":   len(payload.scheme_data),
    }


@router.delete("/{code}", summary="Clear all static fallback data for an authority")
def clear_static_data(
    code:  str,
    db:    Session = Depends(get_db),
    admin: dict    = Depends(get_current_admin),
):
    """
    Soft-clears all snapshots by setting is_current=FALSE.
    The authority will then have no static fallback until PUT is called again.
    Historical records are preserved.
    """
    authority_id = _get_authority_id(db, code)

    updated = db.execute(
        text("""
            UPDATE public.scraper_static_data
            SET is_current = FALSE
            WHERE authority_id = :aid AND is_current = TRUE
            RETURNING id
        """),
        {"aid": authority_id},
    ).fetchall()
    db.commit()

    logger.info(
        "[SCM] Static data cleared for %s by %s (%d snapshots archived)",
        code, admin["email"], len(updated),
    )
    return {
        "authority_code":    code.upper(),
        "cleared":           True,
        "snapshots_archived": len(updated),
        "message":           f"Static data cleared for '{code.upper()}'. "
                             f"The authority now has no fallback until new data is uploaded.",
    }
