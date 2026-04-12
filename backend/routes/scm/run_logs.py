"""
SCM — Run Logs Router
=====================
Read-only access to scraper execution history.

GET  /api/v1/admin/scm/run-logs/                      → paginated per-authority run logs
GET  /api/v1/admin/scm/run-logs/summaries             → paginated full-run summaries
GET  /api/v1/admin/scm/run-logs/summaries/latest      → the most recent run summary
GET  /api/v1/admin/scm/run-logs/by-authority/{code}   → run logs filtered by authority
GET  /api/v1/admin/scm/run-logs/{log_id}              → single run log detail
GET  /api/v1/admin/scm/run-logs/health                → health overview per authority
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.routes.admin import get_current_admin

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", summary="Paginated per-authority run log entries")
def list_run_logs(
    authority_code: Optional[str]  = Query(None, description="Filter by authority code"),
    status:         Optional[str]  = Query(None, description="ok | fallback | failed | timeout"),
    run_mode:       Optional[str]  = Query(None, description="full | refresh | verify"),
    limit:          int            = Query(50, ge=1, le=200),
    offset:         int            = Query(0, ge=0),
    db:             Session        = Depends(get_db),
    admin:          dict           = Depends(get_current_admin),
):
    """
    Returns per-authority-per-run log rows.
    Each row = one scraper class execution: what URL was tried, result, duration, errors.
    """
    where_parts = []
    params: dict = {"limit": limit, "offset": offset}

    if authority_code:
        where_parts.append("rl.authority_code = :authority_code")
        params["authority_code"] = authority_code.upper()
    if status:
        where_parts.append("rl.status = :status")
        params["status"] = status
    if run_mode:
        where_parts.append("rl.run_mode = :run_mode")
        params["run_mode"] = run_mode

    where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    rows = db.execute(
        text(f"""
            SELECT
                rl.id,
                rl.run_id,
                rl.authority_code,
                rl.city,
                rl.url_attempted,
                rl.url_type,
                rl.run_at,
                rl.run_mode,
                rl.status,
                rl.schemes_found,
                rl.schemes_live,
                rl.schemes_static,
                rl.duration_ms,
                rl.error_type,
                rl.error_detail,
                rl.tier_attempted,
                rl.used_proxy,
                rl.used_playwright,
                rl.scraper_version,
                rl.github_run_url
            FROM public.scraper_run_logs rl
            {where_sql}
            ORDER BY rl.run_at DESC
            LIMIT :limit OFFSET :offset
        """),
        params,
    ).fetchall()

    total_row = db.execute(
        text(f"SELECT COUNT(*) FROM public.scraper_run_logs rl {where_sql}"),
        {k: v for k, v in params.items() if k not in ("limit", "offset")},
    ).fetchone()

    return {
        "items":  [dict(r._mapping) for r in rows],
        "total":  total_row[0],
        "limit":  limit,
        "offset": offset,
        "pages":  max(1, -(-total_row[0] // limit)),   # ceiling division
    }


@router.get("/summaries", summary="Paginated full-run summaries")
def list_run_summaries(
    run_mode: Optional[str] = Query(None),
    limit:    int           = Query(20, ge=1, le=100),
    offset:   int           = Query(0, ge=0),
    db:       Session       = Depends(get_db),
    admin:    dict          = Depends(get_current_admin),
):
    """
    Returns one row per GitHub Actions run.
    Each row has aggregate totals: total_scrapers, schemes found, LIVE vs STATIC breakdown.
    """
    where_parts = []
    params: dict = {"limit": limit, "offset": offset}

    if run_mode:
        where_parts.append("run_mode = :run_mode")
        params["run_mode"] = run_mode

    where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    rows = db.execute(
        text(f"""
            SELECT *
            FROM public.scraper_run_summaries
            {where_sql}
            ORDER BY started_at DESC
            LIMIT :limit OFFSET :offset
        """),
        params,
    ).fetchall()

    total_row = db.execute(
        text(f"SELECT COUNT(*) FROM public.scraper_run_summaries {where_sql}"),
        {k: v for k, v in params.items() if k not in ("limit", "offset")},
    ).fetchone()

    return {
        "items":  [dict(r._mapping) for r in rows],
        "total":  total_row[0],
        "limit":  limit,
        "offset": offset,
        "pages":  max(1, -(-total_row[0] // limit)),
    }


@router.get("/summaries/latest", summary="Most recent run summary")
def get_latest_summary(
    db:    Session = Depends(get_db),
    admin: dict    = Depends(get_current_admin),
):
    """Quick endpoint for admin dashboard 'last run' widget."""
    row = db.execute(
        text("""
            SELECT *
            FROM public.scraper_run_summaries
            ORDER BY started_at DESC
            LIMIT 1
        """),
    ).fetchone()

    if not row:
        return {"message": "No scraper runs recorded yet"}

    return dict(row._mapping)


@router.get("/health", summary="Health overview per authority")
def get_authority_health(
    db:    Session = Depends(get_db),
    admin: dict    = Depends(get_current_admin),
):
    """
    Returns a health snapshot per authority:
    - last run status + timestamp
    - how many of its URLs are healthy vs broken
    - consecutive failure count
    Useful for the admin dashboard health table.
    """
    rows = db.execute(
        text("""
            WITH last_run AS (
                SELECT DISTINCT ON (authority_code)
                    authority_code,
                    status         AS last_status,
                    run_at         AS last_run_at,
                    error_type,
                    schemes_found,
                    schemes_live,
                    schemes_static
                FROM public.scraper_run_logs
                ORDER BY authority_code, run_at DESC
            ),
            url_health AS (
                SELECT
                    sa.authority_code,
                    COUNT(uc.id)                                              AS total_urls,
                    COUNT(uc.id) FILTER (WHERE uc.is_enabled = TRUE)          AS enabled_urls,
                    COUNT(uc.id) FILTER (WHERE uc.failure_count > 3)          AS unhealthy_urls,
                    MAX(uc.failure_count)                                      AS max_failures
                FROM public.scraper_authorities sa
                LEFT JOIN public.scraper_url_configs uc ON uc.authority_id = sa.id
                GROUP BY sa.authority_code
            )
            SELECT
                sa.authority_code,
                sa.authority_name,
                sa.state,
                sa.is_active,
                sa.priority_rank,
                lr.last_status,
                lr.last_run_at,
                lr.error_type        AS last_error_type,
                lr.schemes_found,
                lr.schemes_live,
                lr.schemes_static,
                uh.total_urls,
                uh.enabled_urls,
                uh.unhealthy_urls,
                uh.max_failures,
                CASE
                    WHEN NOT sa.is_active THEN 'disabled'
                    WHEN lr.last_status IS NULL THEN 'never_run'
                    WHEN lr.last_status = 'ok' AND uh.unhealthy_urls = 0 THEN 'healthy'
                    WHEN lr.last_status = 'fallback' THEN 'degraded'
                    WHEN lr.last_status IN ('failed', 'timeout') THEN 'failing'
                    ELSE 'unknown'
                END AS health_status
            FROM public.scraper_authorities sa
            LEFT JOIN last_run lr ON lr.authority_code = sa.authority_code
            LEFT JOIN url_health uh ON uh.authority_code = sa.authority_code
            ORDER BY
                CASE WHEN lr.last_status IN ('failed', 'timeout') THEN 0
                     WHEN lr.last_status = 'fallback' THEN 1
                     ELSE 2 END ASC,
                sa.priority_rank ASC
        """),
    ).fetchall()

    result = [dict(r._mapping) for r in rows]

    # Add summary counts
    summary = {
        "total":    len(result),
        "healthy":  sum(1 for r in result if r["health_status"] == "healthy"),
        "degraded": sum(1 for r in result if r["health_status"] == "degraded"),
        "failing":  sum(1 for r in result if r["health_status"] == "failing"),
        "disabled": sum(1 for r in result if r["health_status"] == "disabled"),
        "never_run":sum(1 for r in result if r["health_status"] == "never_run"),
    }

    return {"summary": summary, "authorities": result}


@router.get("/by-authority/{code}", summary="Run log history for a single authority")
def get_run_logs_for_authority(
    code:   str,
    limit:  int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db:     Session = Depends(get_db),
    admin:  dict    = Depends(get_current_admin),
):
    rows = db.execute(
        text("""
            SELECT *
            FROM public.scraper_run_logs
            WHERE authority_code = :code
            ORDER BY run_at DESC
            LIMIT :limit OFFSET :offset
        """),
        {"code": code.upper(), "limit": limit, "offset": offset},
    ).fetchall()

    total = db.execute(
        text("SELECT COUNT(*) FROM public.scraper_run_logs WHERE authority_code = :code"),
        {"code": code.upper()},
    ).fetchone()[0]

    return {
        "authority_code": code.upper(),
        "items":  [dict(r._mapping) for r in rows],
        "total":  total,
        "limit":  limit,
        "offset": offset,
    }


@router.get("/{log_id}", summary="Single run log entry detail")
def get_run_log(
    log_id: int,
    db:     Session = Depends(get_db),
    admin:  dict    = Depends(get_current_admin),
):
    row = db.execute(
        text("SELECT * FROM public.scraper_run_logs WHERE id = :id"),
        {"id": log_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Run log #{log_id} not found")
    return dict(row._mapping)
