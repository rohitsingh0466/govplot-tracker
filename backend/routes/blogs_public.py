"""
GovPlot Tracker — Public Blogs API
====================================
Public endpoints — NO authentication required.
Used by the frontend blog listing page and individual blog pages.

Routes:
  GET /api/v1/blogs/           → paginated list of published blogs
  GET /api/v1/blogs/{slug}     → single blog by slug (for [slug].tsx)
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.models.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
def list_public_blogs(
    limit:  int            = Query(default=9,    ge=1, le=50),
    offset: int            = Query(default=0,    ge=0),
    tag:    Optional[str]  = Query(default=None),
    city:   Optional[str]  = Query(default=None),
    db:     Session        = Depends(get_db),
):
    """
    Public endpoint — returns all published blogs with pagination.
    No authentication needed.
    Used by frontend/pages/blog/index.tsx
    """
    # Build filters
    filters = ["is_published = TRUE"]
    params: dict = {"limit": limit, "offset": offset}

    if tag:
        filters.append("tag = :tag")
        params["tag"] = tag
    if city:
        filters.append("city ILIKE :city")
        params["city"] = f"%{city}%"

    where_clause = " AND ".join(filters)

    # Count total
    count_row = db.execute(
        text(f"SELECT COUNT(*) FROM public.blogs WHERE {where_clause}"),
        params,
    ).fetchone()
    total = count_row[0] if count_row else 0

    # Fetch rows
    rows = db.execute(
        text(f"""
            SELECT
                id, slug, title, excerpt,
                city, tag, author,
                published_at, created_at, updated_at,
                cover_image_url, meta_title, meta_desc,
                read_time_mins, is_featured
            FROM public.blogs
            WHERE {where_clause}
            ORDER BY
                is_featured DESC,
                COALESCE(published_at, created_at) DESC
            LIMIT :limit OFFSET :offset
        """),
        params,
    ).fetchall()

    items = []
    for r in rows:
        items.append({
            "id":             r.id,
            "slug":           r.slug,
            "title":          r.title,
            "excerpt":        r.excerpt,
            "city":           r.city,
            "tag":            r.tag,
            "author":         r.author,
            "published_at":   str(r.published_at) if r.published_at else None,
            "created_at":     str(r.created_at)   if r.created_at   else None,
            "updated_at":     str(r.updated_at)   if r.updated_at   else None,
            "cover_image_url":r.cover_image_url,
            "meta_title":     r.meta_title,
            "meta_desc":      r.meta_desc,
            "read_time_mins": r.read_time_mins,
            "is_featured":    r.is_featured,
        })

    return {
        "items":  items,
        "total":  total,
        "limit":  limit,
        "offset": offset,
        "pages":  max(1, -(-total // limit)),   # ceiling division
    }


@router.get("/{slug}")
def get_public_blog(slug: str, db: Session = Depends(get_db)):
    """
    Public endpoint — returns a single published blog by its slug.
    No authentication needed.
    Used by frontend/pages/blog/[slug].tsx
    """
    row = db.execute(
        text("""
            SELECT
                id, slug, title, excerpt, content_html,
                city, tag, author,
                published_at, created_at, updated_at,
                cover_image_url, meta_title, meta_desc,
                read_time_mins, is_featured, is_published
            FROM public.blogs
            WHERE slug = :slug
              AND is_published = TRUE
            LIMIT 1
        """),
        {"slug": slug},
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Blog '{slug}' not found or not published")

    return {
        "id":             row.id,
        "slug":           row.slug,
        "title":          row.title,
        "excerpt":        row.excerpt,
        "content_html":   row.content_html,
        "city":           row.city,
        "tag":            row.tag,
        "author":         row.author,
        "published_at":   str(row.published_at) if row.published_at else None,
        "created_at":     str(row.created_at)   if row.created_at   else None,
        "updated_at":     str(row.updated_at)   if row.updated_at   else None,
        "cover_image_url":row.cover_image_url,
        "meta_title":     row.meta_title,
        "meta_desc":      row.meta_desc,
        "read_time_mins": row.read_time_mins,
        "is_featured":    row.is_featured,
    }
