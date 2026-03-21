"""
GovPlot Tracker — Database Setup
Uses SQLite for local dev, PostgreSQL (Supabase) in production.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.db_models import Base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./govplot.db"   # local dev default
)

# SQLite needs check_same_thread=False
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
