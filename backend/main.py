"""
GovPlot Tracker — FastAPI Backend v1.2
Adds admin auth + admin data routes.
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import schemes, alerts, auth, cities, billing, telegram
from backend.routes.seo import router as seo_router
from backend.routes.admin_auth import router as admin_auth_router
from backend.routes.admin_data import router as admin_data_router
from backend.routes.scm import scm_router
from backend.models.database import init_db
from backend.routes import blogs_public

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 GovPlot Tracker starting up...")
    try:
        init_db()
        logger.info("✅ Database tables verified/created successfully.")
    except Exception as exc:
        logger.error(f"❌ Database init failed: {exc}")
    yield
    logger.info("🛑 GovPlot Tracker shutting down.")


app = FastAPI(
    title="GovPlot Tracker API",
    description="Real-time Government Residential Plot Scheme tracker for India's top cities.",
    version="1.2.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://govplottracker.com,https://www.govplottracker.com,"
    "https://govplot-tracker.vercel.app,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Existing routes ────────────────────────────────────────────────────────
app.include_router(schemes.router,  prefix="/api/v1/schemes",  tags=["Schemes"])
app.include_router(alerts.router,   prefix="/api/v1/alerts",   tags=["Alerts"])
app.include_router(auth.router,     prefix="/api/v1/auth",     tags=["Auth"])
app.include_router(cities.router,   prefix="/api/v1/cities",   tags=["Cities"])
app.include_router(billing.router,  prefix="/api/v1/billing",  tags=["Billing"])
app.include_router(telegram.router, prefix="/api/v1/telegram", tags=["Telegram"])
app.include_router(seo_router,      prefix="/api/v1/seo",      tags=["SEO"])

# ── NEW: Admin routes ──────────────────────────────────────────────────────
app.include_router(admin_auth_router, prefix="/api/v1/admin/auth", tags=["Admin Auth"])
app.include_router(admin_data_router, prefix="/api/v1/admin/data", tags=["Admin Data"])
app.include_router(scm_router,        prefix="/api/v1/admin",      tags=["SCM"])
#------Blog New Route -------------------------------------------------------
app.include_router(blogs_public.router, prefix="/api/v1/blogs", tags=["Public Blogs"])


@app.get("/", tags=["Health"])
def root():
    db_type = "PostgreSQL (Supabase)" if "postgresql" in os.getenv("DATABASE_URL", "") else "SQLite (local)"
    return {
        "service": "GovPlot Tracker API",
        "version": "1.2.0",
        "status": "running",
        "database": db_type,
        "docs": "/api/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
