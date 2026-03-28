"""
GovPlot Tracker — Database Setup
Uses SQLite for local dev, PostgreSQL (Supabase) in production.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from backend.models.db_models import Base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./govplot.db"
)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

# Supabase Transaction Pooler (port 6543) manages its own connection pool.
# SQLAlchemy must use NullPool — no internal pooling on top of the pooler.
is_pooler = "pooler.supabase.com" in DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    **( {"poolclass": NullPool}
        if is_pooler else
        {"pool_size": 5, "max_overflow": 10} ),
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
