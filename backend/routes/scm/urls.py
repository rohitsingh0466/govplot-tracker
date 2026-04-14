"""
SCM — URL Configs Router
========================
CRUD + health tracking for public.scraper_url_configs

GET    /api/v1/admin/scm/urls/                            → list all URL configs (filterable)
GET    /api/v1/admin/scm/urls/{url_id}                    → single URL config detail
GET    /api/v1/admin/scm/urls/by-authority/{code}         → all URLs for one authority
POST   /api/v1/admin/scm/urls/                            → add URL config to an authority
PUT    /api/v1/admin/scm/urls/{url_id}                    → update URL config
PATCH  /api/v1/admin/scm/urls/{url_id}/toggle             → enable / disable single URL
PATCH  /api/v1/admin/scm/urls/{url_id}/sub-pages          → update sub_pages JSONB array
PATCH  /api/v1/admin/scm/urls/{url_id}/report-failure     → record a failure + reason
PATCH  /api/v1/admin/scm/urls/{url_id}/report-success     → record a success
DELETE /api/v1/admin/scm/urls/{url_id}                    → hard delete URL config
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import text
from sqlalchemy.orm import Session
import json

from backend.models.database import get_db
from backend.routes.admin_auth import get_current_admin

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Valid URL types ────────────────────────────────────────────────────────────
VALID_URL_TYPES = {
    "primary",       # main government portal homepage / scheme listing page
    "scheme_list",   # dedicated scheme listing sub-page
    "notice_board",  # notice / circular board
    "pdf_portal",    # direct PDF download links
    "alternative",   # backup URL if primary fails
    "aggregator",    # 3rd-party aggregator (99acres, MagicBricks etc.)
}


# ── Pydantic models ────────────────────────────────────────────────────────────

class SubPage(BaseModel):
    url:         str
    label:       Optional[str]  = None
    selector:    Optional[str]  = None   # CSS selector hint for scraper
    is_enabled:  bool           = True

class UrlConfigCreate(BaseModel):
    authority_code:       str = Field(..., description="Parent authority code e.g. LDA")
    url_type:             str = Field(..., description="primary | scheme_list | notice_board | pdf_portal | alternative | aggregator")
    url:                  str = Field(..., description="Full URL including https://")
    label:                Optional[str]  = Field(None, max_length=120)
    sub_pages:            List[SubPage]  = Field(default_factory=list,
                                                  description="Optional sub-pages under this URL")
    priority:             int  = Field(default=1, ge=1, le=10,
                                       description="1=first tried, 10=last resort")
    is_enabled:           bool = True
    requires_proxy:       bool = False
    requires_playwright:  bool = False
    notes:                Optional[str] = None


class UrlConfigUpdate(BaseModel):
    url_type:             Optional[str]         = None
    url:                  Optional[str]         = None
    label:                Optional[str]         = None
    sub_pages:            Optional[List[SubPage]] = None
    priority:             Optional[int]         = Field(None, ge=1, le=10)
    is_enabled:           Optional[bool]        = None
    requires_proxy:       Optional[bool]        = None
    requires_playwright:  Optional[bool]        = None
    notes:                Optional[str]         = None


class SubPagesUpdate(BaseModel):
    sub_pages: List[SubPage] = Field(..., description="Complete replacement list of sub-pages")


class FailureReport(BaseModel):
    reason:       str  = Field(..., description="Short error description")
    error_detail: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_url_or_404(db: Session, url_id: str) -> dict:
    row = db.execute(
        text("""
            SELECT uc.*, sa.authority_code, sa.authority_name
            FROM public.scraper_url_configs uc
            JOIN public.scraper_authorities sa ON sa.id = uc.authority_id
            WHERE uc.id = :uid
        """),
        {"uid": url_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"URL config '{url_id}' not found")
    return dict(row._mapping)


def _get_authority_id(db: Session, code: str) -> str:
    row = db.execute(
        text("SELECT id FROM public.scraper_authorities WHERE authority_code = :code"),
        {"code": code.upper()},
    ).fetchone()
    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Authority '{code.upper()}' not found — create it first via POST /scm/authorities/",
        )
    return str(row[0])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", summary="List all URL configs with health status")
def list_url_configs(
    authority_code:      Optional[str]  = Query(None),
    url_type:            Optional[str]  = Query(None),
    is_enabled:          Optional[bool] = Query(None),
    requires_playwright: Optional[bool] = Query(None),
    db:                  Session        = Depends(get_db),
    admin:               dict           = Depends(get_current_admin),
):
    """
    Returns all URL configs with live health_status from scraper_url_health view.
    Supports filtering by authority, type, enabled state, and playwright requirement.
    """
    where_parts = []
    params: dict = {}

    if authority_code:
        where_parts.append("sa.authority_code = :code")
        params["code"] = authority_code.upper()
    if url_type:
        where_parts.append("uc.url_type = :url_type")
        params["url_type"] = url_type
    if is_enabled is not None:
        where_parts.append("uc.is_enabled = :is_enabled")
        params["is_enabled"] = is_enabled
    if requires_playwright is not None:
        where_parts.append("uc.requires_playwright = :rp")
        params["rp"] = requires_playwright

    where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    rows = db.execute(
        text(f"""
            SELECT
                uc.*,
                sa.authority_code,
                sa.authority_name,
                sa.state,
                uh.health_status,
                uh.hours_since_success
            FROM public.scraper_url_configs uc
            JOIN public.scraper_authorities sa ON sa.id = uc.authority_id
            LEFT JOIN public.scraper_url_health uh ON uh.url_config_id = uc.id
            {where_sql}
            ORDER BY sa.priority_rank ASC, sa.authority_code ASC, uc.priority ASC
        """),
        params,
    ).fetchall()

    return [dict(r._mapping) for r in rows]


@router.get("/by-authority/{code}", summary="All URL configs for one authority")
def get_urls_for_authority(
    code:  str,
    db:    Session = Depends(get_db),
    admin: dict    = Depends(get_current_admin),
):
    rows = db.execute(
        text("""
            SELECT
                uc.*,
                uh.health_status,
                uh.hours_since_success
            FROM public.scraper_url_configs uc
            LEFT JOIN public.scraper_url_health uh ON uh.url_config_id = uc.id
            WHERE uc.authority_id = (
                SELECT id FROM public.scraper_authorities WHERE authority_code = :code
            )
            ORDER BY uc.priority ASC, uc.url_type ASC
        """),
        {"code": code.upper()},
    ).fetchall()

    return {
        "authority_code": code.upper(),
        "url_configs":    [dict(r._mapping) for r in rows],
        "total":          len(rows),
        "enabled":        sum(1 for r in rows if r._mapping["is_enabled"]),
        "disabled":       sum(1 for r in rows if not r._mapping["is_enabled"]),
    }


@router.get("/{url_id}", summary="Get single URL config")
def get_url_config(
    url_id: str,
    db:     Session = Depends(get_db),
    admin:  dict    = Depends(get_current_admin),
):
    return _get_url_or_404(db, url_id)


@router.post("/", status_code=201, summary="Add a URL config to an authority")
def create_url_config(
    payload: UrlConfigCreate,
    db:      Session = Depends(get_db),
    admin:   dict    = Depends(get_current_admin),
):
    if payload.url_type not in VALID_URL_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid url_type '{payload.url_type}'. Must be one of: {sorted(VALID_URL_TYPES)}",
        )

    authority_id = _get_authority_id(db, payload.authority_code)

    # Enforce max 5 URLs per type per authority (as per architecture design)
    count_row = db.execute(
        text("""
            SELECT COUNT(*) FROM public.scraper_url_configs
            WHERE authority_id = :aid AND url_type = :utype
        """),
        {"aid": authority_id, "utype": payload.url_type},
    ).fetchone()
    if count_row[0] >= 5:
        raise HTTPException(
            status_code=422,
            detail=f"Max 5 URLs of type '{payload.url_type}' per authority. "
                   f"Disable or delete an existing one first.",
        )

    row = db.execute(
        text("""
            INSERT INTO public.scraper_url_configs
                (authority_id, url_type, url, label, sub_pages, priority,
                 is_enabled, requires_proxy, requires_playwright, notes)
            VALUES
                (:aid, :utype, :url, :label, :sub_pages::JSONB, :priority,
                 :is_enabled, :requires_proxy, :requires_playwright, :notes)
            RETURNING *
        """),
        {
            "aid":                 authority_id,
            "utype":               payload.url_type,
            "url":                 payload.url,
            "label":               payload.label,
            "sub_pages":           json.dumps([sp.dict() for sp in payload.sub_pages]),
            "priority":            payload.priority,
            "is_enabled":          payload.is_enabled,
            "requires_proxy":      payload.requires_proxy,
            "requires_playwright": payload.requires_playwright,
            "notes":               payload.notes,
        },
    ).fetchone()
    db.commit()

    logger.info(
        "[SCM] URL config added for %s (%s) by %s",
        payload.authority_code.upper(), payload.url_type, admin["email"],
    )
    return dict(row._mapping)


@router.put("/{url_id}", summary="Update a URL config")
def update_url_config(
    url_id:  str,
    payload: UrlConfigUpdate,
    db:      Session = Depends(get_db),
    admin:   dict    = Depends(get_current_admin),
):
    existing = _get_url_or_404(db, url_id)

    if payload.url_type and payload.url_type not in VALID_URL_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid url_type '{payload.url_type}'. Must be one of: {sorted(VALID_URL_TYPES)}",
        )

    set_parts = []
    params: dict = {"uid": url_id}

    field_map: Dict[str, Any] = {
        "url_type":             payload.url_type,
        "url":                  payload.url,
        "label":                payload.label,
        "priority":             payload.priority,
        "is_enabled":           payload.is_enabled,
        "requires_proxy":       payload.requires_proxy,
        "requires_playwright":  payload.requires_playwright,
        "notes":                payload.notes,
    }
    for col, val in field_map.items():
        if val is not None:
            set_parts.append(f"{col} = :{col}")
            params[col] = val

    if payload.sub_pages is not None:
        set_parts.append("sub_pages = :sub_pages::JSONB")
        params["sub_pages"] = json.dumps([sp.dict() for sp in payload.sub_pages])

    if not set_parts:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    set_parts.append("updated_at = now()")
    row = db.execute(
        text(f"UPDATE public.scraper_url_configs SET {', '.join(set_parts)} WHERE id = :uid RETURNING *"),
        params,
    ).fetchone()
    db.commit()

    logger.info("[SCM] URL config %s updated by %s", url_id, admin["email"])
    return dict(row._mapping)


@router.patch("/{url_id}/toggle", summary="Enable or disable a URL config")
def toggle_url_config(
    url_id: str,
    db:     Session = Depends(get_db),
    admin:  dict    = Depends(get_current_admin),
):
    existing = _get_url_or_404(db, url_id)
    new_state = not existing["is_enabled"]

    db.execute(
        text("""
            UPDATE public.scraper_url_configs
            SET is_enabled = :state, updated_at = now()
            WHERE id = :uid
        """),
        {"state": new_state, "uid": url_id},
    )
    db.commit()

    action = "enabled" if new_state else "disabled"
    logger.info("[SCM] URL config %s %s by %s", url_id, action, admin["email"])
    return {
        "url_config_id":     url_id,
        "url":               existing["url"],
        "authority_code":    existing["authority_code"],
        "is_enabled":        new_state,
        "message":           f"URL '{existing['url']}' has been {action}",
    }


@router.patch("/{url_id}/sub-pages", summary="Replace sub-pages for a URL config")
def update_sub_pages(
    url_id:  str,
    payload: SubPagesUpdate,
    db:      Session = Depends(get_db),
    admin:   dict    = Depends(get_current_admin),
):
    """
    Full replacement of sub_pages JSONB array.
    Each sub-page has: url, label (optional), selector (optional), is_enabled.
    Max 5 sub-pages per URL config.
    """
    _get_url_or_404(db, url_id)

    if len(payload.sub_pages) > 5:
        raise HTTPException(status_code=422, detail="Maximum 5 sub-pages per URL config")

    db.execute(
        text("""
            UPDATE public.scraper_url_configs
            SET sub_pages = :sp::JSONB, updated_at = now()
            WHERE id = :uid
        """),
        {"sp": json.dumps([sp.dict() for sp in payload.sub_pages]), "uid": url_id},
    )
    db.commit()

    logger.info("[SCM] Sub-pages updated for URL config %s by %s", url_id, admin["email"])
    return {
        "url_config_id": url_id,
        "sub_pages":     [sp.dict() for sp in payload.sub_pages],
        "count":         len(payload.sub_pages),
    }


@router.patch("/{url_id}/report-failure", summary="Record a scraper failure for this URL")
def report_failure(
    url_id:  str,
    payload: FailureReport,
    db:      Session = Depends(get_db),
    admin:   dict    = Depends(get_current_admin),
):
    """
    Called by the scraper when a URL fetch fails.
    Increments failure_count, stamps last_failure_at, stores reason.
    """
    _get_url_or_404(db, url_id)

    db.execute(
        text("""
            UPDATE public.scraper_url_configs
            SET failure_count       = failure_count + 1,
                last_failure_at     = now(),
                last_failure_reason = :reason,
                updated_at          = now()
            WHERE id = :uid
        """),
        {"reason": f"{payload.reason}: {payload.error_detail or ''}".strip(": "), "uid": url_id},
    )
    db.commit()
    return {"url_config_id": url_id, "failure_recorded": True}


@router.patch("/{url_id}/report-success", summary="Record a successful scrape for this URL")
def report_success(
    url_id: str,
    db:     Session = Depends(get_db),
    admin:  dict    = Depends(get_current_admin),
):
    """
    Called by the scraper when a URL fetch succeeds.
    Resets failure_count to 0, stamps last_success_at.
    """
    _get_url_or_404(db, url_id)

    db.execute(
        text("""
            UPDATE public.scraper_url_configs
            SET failure_count   = 0,
                last_success_at = now(),
                updated_at      = now()
            WHERE id = :uid
        """),
        {"uid": url_id},
    )
    db.commit()
    return {"url_config_id": url_id, "success_recorded": True}


@router.delete("/{url_id}", summary="Hard delete a URL config")
def delete_url_config(
    url_id: str,
    db:     Session = Depends(get_db),
    admin:  dict    = Depends(get_current_admin),
):
    """
    Hard delete — removes the URL config permanently.
    Only allowed if no run logs reference this URL config.
    """
    existing = _get_url_or_404(db, url_id)

    # Safety check: does any run log reference this URL?
    ref_count = db.execute(
        text("SELECT COUNT(*) FROM public.scraper_run_logs WHERE url_config_id = :uid"),
        {"uid": url_id},
    ).fetchone()[0]

    if ref_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete: {ref_count} run log(s) reference this URL config. "
                   f"Disable it instead using PATCH /{url_id}/toggle",
        )

    db.execute(
        text("DELETE FROM public.scraper_url_configs WHERE id = :uid"),
        {"uid": url_id},
    )
    db.commit()

    logger.info(
        "[SCM] URL config %s (%s) deleted by %s",
        url_id, existing["url"], admin["email"],
    )
    return {
        "url_config_id": url_id,
        "url":           existing["url"],
        "deleted":       True,
    }
