"""
SCM — Authorities Router
========================
CRUD for public.scraper_authorities

GET    /api/v1/admin/scm/authorities/             → list all (with URL counts)
GET    /api/v1/admin/scm/authorities/{code}       → single authority + its URLs
POST   /api/v1/admin/scm/authorities/             → create new authority
PUT    /api/v1/admin/scm/authorities/{code}       → update authority metadata
PATCH  /api/v1/admin/scm/authorities/{code}/toggle → enable / disable authority
DELETE /api/v1/admin/scm/authorities/{code}       → soft-delete (sets is_active=False)
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.routes.admin import get_current_admin   # reuse existing admin auth dep

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Pydantic models ────────────────────────────────────────────────────────────

class AuthorityCreate(BaseModel):
    authority_code:  str = Field(..., min_length=2, max_length=20,
                                 description="Short code e.g. LDA, YEIDA, DDA")
    authority_name:  str = Field(..., min_length=3, max_length=200)
    state:           str = Field(..., min_length=2, max_length=100)
    cities:          List[str] = Field(default_factory=list,
                                       description="List of city names served by this authority")
    scraper_class:   str = Field(..., description="Python class name e.g. LDAScraper")
    scraper_file:    str = Field(..., description="Module path e.g. scraper.cities.up")
    priority_rank:   int = Field(default=99, ge=1, le=999,
                                  description="1 = highest priority, 999 = lowest")
    notes:           Optional[str] = None


class AuthorityUpdate(BaseModel):
    authority_name:  Optional[str]       = None
    state:           Optional[str]       = None
    cities:          Optional[List[str]] = None
    scraper_class:   Optional[str]       = None
    scraper_file:    Optional[str]       = None
    priority_rank:   Optional[int]       = Field(None, ge=1, le=999)
    notes:           Optional[str]       = None


# ── Helper ────────────────────────────────────────────────────────────────────

def _get_authority_or_404(db: Session, code: str) -> dict:
    row = db.execute(
        text("SELECT * FROM public.scraper_authorities WHERE authority_code = :code"),
        {"code": code.upper()},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Authority '{code.upper()}' not found")
    return dict(row._mapping)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", summary="List all authorities with URL counts")
def list_authorities(
    state:       Optional[str]  = Query(None, description="Filter by state name"),
    is_active:   Optional[bool] = Query(None, description="Filter by active status"),
    db:          Session        = Depends(get_db),
    admin:       dict           = Depends(get_current_admin),
):
    """
    Returns all scraper authorities with:
    - total URL configs attached
    - count of enabled vs disabled URLs
    - last run timestamp (from run logs)
    """
    where_clauses = []
    params: dict = {}

    if state is not None:
        where_clauses.append("sa.state ILIKE :state")
        params["state"] = f"%{state}%"
    if is_active is not None:
        where_clauses.append("sa.is_active = :is_active")
        params["is_active"] = is_active

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    rows = db.execute(
        text(f"""
            SELECT
                sa.id,
                sa.authority_code,
                sa.authority_name,
                sa.state,
                sa.cities,
                sa.scraper_class,
                sa.scraper_file,
                sa.is_active,
                sa.priority_rank,
                sa.notes,
                sa.created_at,
                sa.updated_at,
                COUNT(uc.id)                                              AS total_url_configs,
                COUNT(uc.id) FILTER (WHERE uc.is_enabled = TRUE)          AS enabled_url_configs,
                COUNT(uc.id) FILTER (WHERE uc.is_enabled = FALSE)         AS disabled_url_configs,
                (
                    SELECT MAX(rl.run_at)
                    FROM public.scraper_run_logs rl
                    WHERE rl.authority_id = sa.id
                ) AS last_run_at,
                (
                    SELECT rl.status
                    FROM public.scraper_run_logs rl
                    WHERE rl.authority_id = sa.id
                    ORDER BY rl.run_at DESC
                    LIMIT 1
                ) AS last_run_status
            FROM public.scraper_authorities sa
            LEFT JOIN public.scraper_url_configs uc ON uc.authority_id = sa.id
            {where_sql}
            GROUP BY sa.id
            ORDER BY sa.priority_rank ASC, sa.authority_code ASC
        """),
        params,
    ).fetchall()

    return [dict(r._mapping) for r in rows]


@router.get("/{code}", summary="Get single authority with all URL configs")
def get_authority(
    code:  str,
    db:    Session = Depends(get_db),
    admin: dict    = Depends(get_current_admin),
):
    """Returns the authority record plus its full list of URL configs."""
    authority = _get_authority_or_404(db, code)

    urls = db.execute(
        text("""
            SELECT *
            FROM public.scraper_url_configs
            WHERE authority_id = :aid
            ORDER BY priority ASC, url_type ASC
        """),
        {"aid": authority["id"]},
    ).fetchall()

    authority["url_configs"] = [dict(r._mapping) for r in urls]
    return authority


@router.post("/", status_code=201, summary="Create a new authority")
def create_authority(
    payload: AuthorityCreate,
    db:      Session = Depends(get_db),
    admin:   dict    = Depends(get_current_admin),
):
    # Check for duplicate code
    existing = db.execute(
        text("SELECT id FROM public.scraper_authorities WHERE authority_code = :code"),
        {"code": payload.authority_code.upper()},
    ).fetchone()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Authority code '{payload.authority_code.upper()}' already exists",
        )

    row = db.execute(
        text("""
            INSERT INTO public.scraper_authorities
                (authority_code, authority_name, state, cities,
                 scraper_class, scraper_file, priority_rank, notes)
            VALUES
                (:code, :name, :state, :cities,
                 :scraper_class, :scraper_file, :priority_rank, :notes)
            RETURNING *
        """),
        {
            "code":          payload.authority_code.upper(),
            "name":          payload.authority_name,
            "state":         payload.state,
            "cities":        payload.cities,
            "scraper_class": payload.scraper_class,
            "scraper_file":  payload.scraper_file,
            "priority_rank": payload.priority_rank,
            "notes":         payload.notes,
        },
    ).fetchone()
    db.commit()

    logger.info("[SCM] Authority %s created by %s", payload.authority_code.upper(), admin["email"])
    return dict(row._mapping)


@router.put("/{code}", summary="Update authority metadata")
def update_authority(
    code:    str,
    payload: AuthorityUpdate,
    db:      Session = Depends(get_db),
    admin:   dict    = Depends(get_current_admin),
):
    authority = _get_authority_or_404(db, code)

    # Build dynamic SET clause from non-None fields only
    set_parts = []
    params: dict = {"id": authority["id"]}

    field_map = {
        "authority_name": payload.authority_name,
        "state":          payload.state,
        "cities":         payload.cities,
        "scraper_class":  payload.scraper_class,
        "scraper_file":   payload.scraper_file,
        "priority_rank":  payload.priority_rank,
        "notes":          payload.notes,
    }
    for col, val in field_map.items():
        if val is not None:
            set_parts.append(f"{col} = :{col}")
            params[col] = val

    if not set_parts:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    set_parts.append("updated_at = now()")
    set_sql = ", ".join(set_parts)

    row = db.execute(
        text(f"UPDATE public.scraper_authorities SET {set_sql} WHERE id = :id RETURNING *"),
        params,
    ).fetchone()
    db.commit()

    logger.info("[SCM] Authority %s updated by %s", code.upper(), admin["email"])
    return dict(row._mapping)


@router.patch("/{code}/toggle", summary="Enable or disable an authority")
def toggle_authority(
    code:  str,
    db:    Session = Depends(get_db),
    admin: dict    = Depends(get_current_admin),
):
    """Flips is_active. Disabled authorities are skipped by the scraper at runtime."""
    authority = _get_authority_or_404(db, code)
    new_state = not authority["is_active"]

    db.execute(
        text("""
            UPDATE public.scraper_authorities
            SET is_active = :state, updated_at = now()
            WHERE id = :id
        """),
        {"state": new_state, "id": authority["id"]},
    )
    db.commit()

    action = "enabled" if new_state else "disabled"
    logger.info("[SCM] Authority %s %s by %s", code.upper(), action, admin["email"])
    return {
        "authority_code": code.upper(),
        "is_active":      new_state,
        "message":        f"Authority '{code.upper()}' has been {action}",
    }


@router.delete("/{code}", summary="Soft-delete authority (sets is_active=False)")
def delete_authority(
    code:  str,
    db:    Session = Depends(get_db),
    admin: dict    = Depends(get_current_admin),
):
    """
    Soft-delete only — sets is_active=False and records who deleted it in notes.
    Hard delete is intentionally not exposed to protect scraper run history.
    """
    authority = _get_authority_or_404(db, code)

    db.execute(
        text("""
            UPDATE public.scraper_authorities
            SET is_active  = FALSE,
                notes      = COALESCE(notes, '') || ' [Disabled by ' || :email || ']',
                updated_at = now()
            WHERE id = :id
        """),
        {"id": authority["id"], "email": admin["email"]},
    )
    db.commit()

    logger.info("[SCM] Authority %s soft-deleted by %s", code.upper(), admin["email"])
    return {"authority_code": code.upper(), "deleted": True, "is_active": False}
