"""
GovPlot Tracker — FastAPI Backend
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import schemes, alerts, auth, cities, billing, telegram
from backend.routes.seo import router as seo_router
from backend.models.database import init_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run on startup — create all DB tables if they don't exist."""
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
    version="1.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://govplot-tracker.vercel.app,https://govplot-tracker-rohitsingh0466s-projects.vercel.app,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schemes.router, prefix="/api/v1/schemes", tags=["Schemes"])
app.include_router(alerts.router,  prefix="/api/v1/alerts",  tags=["Alerts"])
app.include_router(auth.router,    prefix="/api/v1/auth",    tags=["Auth"])
app.include_router(cities.router,  prefix="/api/v1/cities",  tags=["Cities"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["Billing"])
app.include_router(telegram.router, prefix="/api/v1/telegram", tags=["Telegram"])
app.include_router(seo_router,     prefix="/api/v1/seo",     tags=["SEO"])


@app.get("/", tags=["Health"])
def root():
    db_type = "PostgreSQL (Supabase)" if "postgresql" in os.getenv("DATABASE_URL", "") else "SQLite (local)"
    return {
        "service": "GovPlot Tracker API",
        "version": "1.1.0",
        "status": "running",
        "database": db_type,
        "docs": "/api/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
