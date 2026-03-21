"""
GovPlot Tracker — FastAPI Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import schemes, alerts, auth, cities

app = FastAPI(
    title="GovPlot Tracker API",
    description="Real-time Government Residential Plot Scheme tracker for India's top cities.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restrict in production to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(schemes.router, prefix="/api/v1/schemes", tags=["Schemes"])
app.include_router(alerts.router,  prefix="/api/v1/alerts",  tags=["Alerts"])
app.include_router(auth.router,    prefix="/api/v1/auth",    tags=["Auth"])
app.include_router(cities.router,  prefix="/api/v1/cities",  tags=["Cities"])


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "GovPlot Tracker API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
