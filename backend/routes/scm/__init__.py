"""
Scraper Config Manager (SCM) — Route Package
=============================================
All admin-only endpoints for managing the dynamic scraper configuration.

Sub-routers:
  /api/v1/admin/scm/authorities  → CRUD for scraper_authorities
  /api/v1/admin/scm/urls         → CRUD + enable/disable for scraper_url_configs
  /api/v1/admin/scm/run-logs     → Read-only run logs + summaries
  /api/v1/admin/scm/static-data  → GET current + PUT replace scraper_static_data
"""

from fastapi import APIRouter

from .authorities import router as authorities_router
from .urls        import router as urls_router
from .run_logs    import router as run_logs_router
from .static_data import router as static_data_router

scm_router = APIRouter(prefix="/scm", tags=["SCM — Scraper Config Manager"])

scm_router.include_router(authorities_router, prefix="/authorities")
scm_router.include_router(urls_router,        prefix="/urls")
scm_router.include_router(run_logs_router,    prefix="/run-logs")
scm_router.include_router(static_data_router, prefix="/static-data")
