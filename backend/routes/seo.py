"""
GovPlot Tracker v1.1 — SEO Routes
GET /api/v1/seo/sitemap        → all scheme URLs for sitemap
GET /api/v1/seo/{scheme_id}    → SEO metadata for a scheme
GET /api/v1/seo/slug/{slug}    → scheme by URL slug
"""
from __future__ import annotations

import logging
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.models.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

SITE_URL = os.getenv("NEXT_PUBLIC_SITE_URL", "https://govplottracker.com")


@router.get("/sitemap")
def get_sitemap(db: Session = Depends(get_db)):
    """Return all scheme slugs/IDs for sitemap generation."""
    try:
        rows = db.execute(text("""
            SELECT s.scheme_id, s.name, s.city, s.status,
                   s.last_updated, m.slug
            FROM schemes s
            LEFT JOIN seo_metadata m ON s.scheme_id = m.scheme_id
            WHERE s.is_active = TRUE
            ORDER BY s.last_updated DESC
        """)).fetchall()
        return {
            "base_url": SITE_URL,
            "count": len(rows),
            "schemes": [
                {
                    "scheme_id": r[0],
                    "name": r[1],
                    "city": r[2],
                    "status": r[3],
                    "last_updated": str(r[4]),
                    "url": f"/schemes/{r[5] or r[0]}",
                }
                for r in rows
            ],
        }
    except Exception:
        rows = db.execute(text("""
            SELECT scheme_id, name, city, status, last_updated
            FROM schemes WHERE is_active = TRUE
        """)).fetchall()
        return {
            "base_url": SITE_URL,
            "count": len(rows),
            "schemes": [
                {
                    "scheme_id": r[0], "name": r[1], "city": r[2],
                    "status": r[3], "last_updated": str(r[4]),
                    "url": f"/schemes/{r[0]}",
                }
                for r in rows
            ],
        }


@router.get("/slug/{slug}")
def by_slug(slug: str, db: Session = Depends(get_db)):
    try:
        row = db.execute(text("""
            SELECT s.*, m.meta_title, m.meta_desc,
                   m.og_title, m.og_desc, m.keywords, m.slug
            FROM schemes s
            JOIN seo_metadata m ON s.scheme_id = m.scheme_id
            WHERE m.slug = :slug AND s.is_active = TRUE
        """), {"slug": slug}).fetchone()
        if not row:
            raise HTTPException(404, "Scheme not found")
        return dict(row._mapping)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(404, "Scheme not found")


@router.get("/{scheme_id}")
def by_scheme_id(scheme_id: str, db: Session = Depends(get_db)):
    try:
        row = db.execute(text(
            "SELECT * FROM seo_metadata WHERE scheme_id = :sid"
        ), {"sid": scheme_id}).fetchone()
        if not row:
            raise HTTPException(404, "SEO metadata not found")
        return dict(row._mapping)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(404, "SEO metadata not found")
