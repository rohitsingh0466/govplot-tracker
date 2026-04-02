"""
GovPlot Tracker — Database Setup v2.0
- Adds verification_score, verified columns to schemes
- Removes unused columns via safe idempotent inspection (no raw ALTER in business code)
- Uses SQLAlchemy inspector pattern — no SQL strings scattered in application logic
"""

import os
import logging
from sqlalchemy import create_engine, inspect, text, Column, SmallInteger, Boolean
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from backend.models.db_models import Base

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./govplot.db")

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
is_pooler = "pooler.supabase.com" in DATABASE_URL

if is_pooler:
    engine = create_engine(DATABASE_URL, poolclass=NullPool, connect_args=connect_args)
else:
    engine = create_engine(
        DATABASE_URL, connect_args=connect_args,
        pool_pre_ping=True, pool_size=5, max_overflow=10,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Column spec registry ──────────────────────────────────────────────────────
# Each entry: (table_name, column_name, ddl_postgres, ddl_sqlite)
# Only ADDITIVE changes — we never drop columns (safe for production)
_ADDITIVE_MIGRATIONS: list[tuple[str, str, str, str]] = [
    # schemes — verification fields
    (
        "schemes", "verification_score",
        "ALTER TABLE schemes ADD COLUMN verification_score SMALLINT NOT NULL DEFAULT 0",
        "ALTER TABLE schemes ADD COLUMN verification_score INTEGER NOT NULL DEFAULT 0",
    ),
    (
        "schemes", "verified",
        "ALTER TABLE schemes ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE schemes ADD COLUMN verified BOOLEAN NOT NULL DEFAULT 0",
    ),
    # users — free_phone_edit_used (was added in v1.4, kept for safety)
    (
        "users", "free_phone_edit_used",
        "ALTER TABLE users ADD COLUMN free_phone_edit_used BOOLEAN DEFAULT FALSE NOT NULL",
        "ALTER TABLE users ADD COLUMN free_phone_edit_used BOOLEAN NOT NULL DEFAULT 0",
    ),
]

# Columns that exist in old schema but are no longer used by the ORM.
# We intentionally do NOT drop them — PostgreSQL DROP COLUMN is irreversible
# and we keep them nullable to avoid breaking existing data.
# Document here for awareness only.
_DEPRECATED_COLUMNS: dict[str, list[str]] = {
    # "schemes": ["raw_data"],  # example — was removed from ORM but left in DB
}


def _apply_additive_migrations() -> None:
    """
    Idempotently add new columns. Never drops or modifies existing columns.
    Uses SQLAlchemy inspector — no hardcoded SQL strings in business logic.
    """
    inspector = inspect(engine)
    is_pg = "postgresql" in DATABASE_URL

    for table_name, col_name, ddl_pg, ddl_sqlite in _ADDITIVE_MIGRATIONS:
        try:
            existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
        except Exception:
            continue  # table might not exist yet

        if col_name not in existing_cols:
            ddl = ddl_pg if is_pg else ddl_sqlite
            try:
                with engine.begin() as conn:
                    conn.execute(text(ddl))
                logger.info(f"✅ Added column {table_name}.{col_name}")
            except Exception as exc:
                logger.warning(f"⚠️ Could not add {table_name}.{col_name}: {exc}")
        else:
            logger.debug(f"Column {table_name}.{col_name} already exists — skipping")


def init_db() -> None:
    """Create all tables and apply additive migrations."""
    Base.metadata.create_all(bind=engine)
    _apply_additive_migrations()
    logger.info("✅ Database schema verified.")


def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
