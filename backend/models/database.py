"""
GovPlot Tracker — Database Setup
Uses SQLite for local dev, PostgreSQL (Supabase) in production.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool, QueuePool
from backend.models.db_models import Base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./govplot.db"
)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

# Supabase Transaction Pooler (port 6543) manages its own connections.
# Use NullPool — SQLAlchemy must NOT maintain its own pool on top.
# pool_pre_ping is incompatible with NullPool, so we omit it.
is_pooler = "pooler.supabase.com" in DATABASE_URL

if is_pooler:
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        connect_args=connect_args,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )

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
