"""
GovPlot Tracker — Admin Data Routes v1.0
=========================================
All endpoints require admin JWT via Depends(get_current_admin).

Endpoints:
  GET  /dashboard/stats
  GET/PATCH/POST /schemes
  GET/PATCH/POST/DELETE /blogs
  GET/PATCH /feature-flags
  GET /users
  GET /public/blogs        ← no auth, used by frontend
  GET /public/blogs/{slug} ← no auth, used by frontend
  GET /public/feature-flags ← no auth, used by frontend
"""
from __future__ import annotations

import re
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.routes.admin_auth import get_current_admin

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Pydantic models ───────────────────────────────────────────────────────────

class SchemeCreate(BaseModel):
    scheme_id: str
    name: str
    city: str
    authority: str
    status: str
    open_date: Optional[str] = None
    close_date: Optional[str] = None
    total_plots: Optional[int] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    area_sqft_min: Optional[int] = None
    area_sqft_max: Optional[int] = None
    location_details: Optional[str] = None
    apply_url: Optional[str] = None
    source_url: Optional[str] = None
    is_active: bool = True
    manual_notes: Optional[str] = None


class SchemeUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    authority: Optional[str] = None
    status: Optional[str] = None
    open_date: Optional[str] = None
    close_date: Optional[str] = None
    total_plots: Optional[int] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    area_sqft_min: Optional[int] = None
    area_sqft_max: Optional[int] = None
    location_details: Optional[str] = None
    apply_url: Optional[str] = None
    source_url: Optional[str] = None
    is_active: Optional[bool] = None
    manual_notes: Optional[str] = None


class BlogCreate(BaseModel):
    title: str
    excerpt: str = ""
    content_html: str
    city: Optional[str] = None
    tag: str = "General"
    read_time_mins: int = 5
    is_published: bool = False
    is_featured: bool = False
    meta_title: Optional[str] = None
    meta_desc: Optional[str] = None
    cover_image_url: Optional[str] = None


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content_html: Optional[str] = None
    city: Optional[str] = None
    tag: Optional[str] = None
    read_time_mins: Optional[int] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_desc: Optional[str] = None
    cover_image_url: Optional[str] = None


class FlagUpdate(BaseModel):
    is_enabled: bool
    coming_soon_text: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:200]


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    try:
        s = db.execute(text("""
            SELECT
                COUNT(*)                                              AS total,
                SUM(CASE WHEN status='OPEN'     THEN 1 ELSE 0 END)   AS open_c,
                SUM(CASE WHEN status='ACTIVE'   THEN 1 ELSE 0 END)   AS active_c,
                SUM(CASE WHEN status='UPCOMING' THEN 1 ELSE 0 END)   AS upcoming_c,
                SUM(CASE WHEN status='CLOSED'   THEN 1 ELSE 0 END)   AS closed_c,
                SUM(CASE WHEN is_active=TRUE    THEN 1 ELSE 0 END)   AS enabled_c,
                SUM(CASE WHEN is_active=FALSE   THEN 1 ELSE 0 END)   AS disabled_c,
                COUNT(DISTINCT city)                                  AS cities_c
            FROM public.schemes
        """)).fetchone()

        total_u   = db.execute(text("SELECT COUNT(*) FROM public.users")).scalar() or 0
        pro_u     = db.execute(text("SELECT COUNT(*) FROM public.users WHERE subscription_tier='pro'")).scalar() or 0
        premium_u = db.execute(text("SELECT COUNT(*) FROM public.users WHERE subscription_tier='premium'")).scalar() or 0
        alerts    = db.execute(text("SELECT COUNT(*) FROM public.alert_subscriptions WHERE is_active=TRUE")).scalar() or 0

        b = db.execute(text("""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN is_published=TRUE  THEN 1 ELSE 0 END) AS published_c,
                SUM(CASE WHEN is_published=FALSE THEN 1 ELSE 0 END) AS drafts_c
            FROM public.blogs
        """)).fetchone()

        return {
            "schemes": {
                "total": s[0] or 0, "open": s[1] or 0, "active": s[2] or 0,
                "upcoming": s[3] or 0, "closed": s[4] or 0,
                "enabled": s[5] or 0, "disabled": s[6] or 0, "cities": s[7] or 0,
            },
            "users": {
                "total": total_u, "free": max(0, total_u - pro_u - premium_u),
                "pro": pro_u, "premium": premium_u,
            },
            "blogs": {
                "total": b[0] or 0, "published": b[1] or 0, "drafts": b[2] or 0,
            },
            "alerts": alerts,
        }
    except Exception as e:
        logger.error(f"dashboard_stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Schemes ───────────────────────────────────────────────────────────────────

@router.get("/schemes")
def list_schemes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    city: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    offset = (page - 1) * limit
    conditions, params = [], {"limit": limit, "offset": offset}

    if city:
        conditions.append("city ILIKE :city")
        params["city"] = f"%{city}%"
    if status:
        conditions.append("status = :status")
        params["status"] = status
    if search:
        conditions.append("(name ILIKE :q OR authority ILIKE :q OR city ILIKE :q OR scheme_id ILIKE :q)")
        params["q"] = f"%{search}%"

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    rows = db.execute(text(f"""
        SELECT scheme_id, name, city, authority, status,
               open_date, close_date, total_plots, price_min, price_max,
               area_sqft_min, area_sqft_max, location_details,
               apply_url, source_url, is_active, data_source,
               scraper_status, is_manually_edited, manual_notes, last_updated
        FROM public.schemes {where}
        ORDER BY last_updated DESC
        LIMIT :limit OFFSET :offset
    """), params).fetchall()

    total = db.execute(
        text(f"SELECT COUNT(*) FROM public.schemes {where}"),
        {k: v for k, v in params.items() if k not in ("limit", "offset")},
    ).scalar() or 0

    return {
        "items": [dict(r._mapping) for r in rows],
        "total": total, "page": page, "limit": limit,
        "pages": max(1, -(-total // limit)),
    }


@router.get("/schemes/{scheme_id}")
def get_scheme(
    scheme_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    row = db.execute(
        text("SELECT * FROM public.schemes WHERE scheme_id = :sid"), {"sid": scheme_id}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return dict(row._mapping)


@router.post("/schemes", status_code=201)
def create_scheme(
    payload: SchemeCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    now = _now()
    try:
        db.execute(text("""
            INSERT INTO public.schemes (
                scheme_id, name, city, authority, status,
                open_date, close_date, total_plots, price_min, price_max,
                area_sqft_min, area_sqft_max, location_details,
                apply_url, source_url, is_active, manual_notes,
                is_manually_edited, admin_last_updated,
                data_source, scraper_status, last_updated
            ) VALUES (
                :scheme_id, :name, :city, :authority, :status,
                :open_date, :close_date, :total_plots, :price_min, :price_max,
                :area_sqft_min, :area_sqft_max, :location_details,
                :apply_url, :source_url, :is_active, :manual_notes,
                TRUE, :now, 'STATIC', 'manual', :now
            )
        """), {**payload.dict(), "now": now})
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating scheme: {e}")
    return {"message": "Scheme created", "scheme_id": payload.scheme_id}


@router.patch("/schemes/{scheme_id}")
def update_scheme(
    scheme_id: str,
    payload: SchemeUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided")

    updates.update({
        "is_manually_edited": True,
        "admin_last_updated": _now(),
        "last_updated": _now(),
    })

    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["sid"] = scheme_id

    result = db.execute(
        text(f"UPDATE public.schemes SET {set_clause} WHERE scheme_id = :sid"),
        updates,
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {"message": "Scheme updated", "scheme_id": scheme_id}


@router.patch("/schemes/{scheme_id}/toggle")
def toggle_scheme(
    scheme_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    row = db.execute(
        text("SELECT is_active FROM public.schemes WHERE scheme_id = :sid"),
        {"sid": scheme_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Scheme not found")
    new_val = not row[0]
    db.execute(
        text("UPDATE public.schemes SET is_active = :v, last_updated = NOW() WHERE scheme_id = :sid"),
        {"v": new_val, "sid": scheme_id},
    )
    db.commit()
    return {"scheme_id": scheme_id, "is_active": new_val}


# ── Blogs ─────────────────────────────────────────────────────────────────────

@router.get("/blogs")
def list_blogs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    offset = (page - 1) * limit
    rows = db.execute(text("""
        SELECT id, slug, title, excerpt, city, tag,
               is_published, is_featured, read_time_mins,
               published_at, created_at, updated_at
        FROM public.blogs
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": limit, "offset": offset}).fetchall()
    total = db.execute(text("SELECT COUNT(*) FROM public.blogs")).scalar() or 0
    return {
        "items": [dict(r._mapping) for r in rows],
        "total": total, "page": page, "limit": limit,
        "pages": max(1, -(-total // limit)),
    }


@router.get("/blogs/{blog_id}")
def get_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    row = db.execute(
        text("SELECT * FROM public.blogs WHERE id = :id"), {"id": blog_id}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Blog not found")
    return dict(row._mapping)


@router.post("/blogs", status_code=201)
def create_blog(
    payload: BlogCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    slug = _slugify(payload.title)
    # Ensure unique slug
    exists = db.execute(
        text("SELECT id FROM public.blogs WHERE slug = :s"), {"s": slug}
    ).fetchone()
    if exists:
        slug = f"{slug}-{int(datetime.now().timestamp())}"

    pub_at = _now() if payload.is_published else None

    try:
        row = db.execute(text("""
            INSERT INTO public.blogs
                (slug, title, excerpt, content_html, city, tag,
                 is_published, is_featured, read_time_mins, published_at,
                 meta_title, meta_desc, cover_image_url, updated_at)
            VALUES
                (:slug, :title, :excerpt, :content_html, :city, :tag,
                 :is_published, :is_featured, :read_time_mins, :pub_at,
                 :meta_title, :meta_desc, :cover_image_url, NOW())
            RETURNING id, slug
        """), {
            "slug": slug, "title": payload.title, "excerpt": payload.excerpt,
            "content_html": payload.content_html, "city": payload.city,
            "tag": payload.tag, "is_published": payload.is_published,
            "is_featured": payload.is_featured, "read_time_mins": payload.read_time_mins,
            "pub_at": pub_at, "meta_title": payload.meta_title,
            "meta_desc": payload.meta_desc, "cover_image_url": payload.cover_image_url,
        }).fetchone()
        db.commit()
        return {"message": "Blog created", "id": row[0], "slug": row[1]}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/blogs/{blog_id}")
def update_blog(
    blog_id: int,
    payload: BlogUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided")

    # Auto-set published_at on first publish
    if updates.get("is_published") is True:
        existing = db.execute(
            text("SELECT published_at FROM public.blogs WHERE id = :id"), {"id": blog_id}
        ).fetchone()
        if existing and not existing[0]:
            updates["published_at"] = _now()

    updates["updated_at"] = _now()
    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["id"] = blog_id

    result = db.execute(
        text(f"UPDATE public.blogs SET {set_clause} WHERE id = :id"), updates
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"message": "Blog updated", "id": blog_id}


@router.patch("/blogs/{blog_id}/toggle")
def toggle_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    row = db.execute(
        text("SELECT is_published FROM public.blogs WHERE id = :id"), {"id": blog_id}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Blog not found")
    new_val = not row[0]
    extra = ", published_at = NOW()" if new_val else ""
    db.execute(
        text(f"UPDATE public.blogs SET is_published = :v, updated_at = NOW(){extra} WHERE id = :id"),
        {"v": new_val, "id": blog_id},
    )
    db.commit()
    return {"id": blog_id, "is_published": new_val}


@router.delete("/blogs/{blog_id}")
def delete_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    result = db.execute(
        text("DELETE FROM public.blogs WHERE id = :id"), {"id": blog_id}
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"message": "Blog deleted", "id": blog_id}


# ── Feature Flags ─────────────────────────────────────────────────────────────

@router.get("/feature-flags")
def list_flags(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    rows = db.execute(
        text("SELECT * FROM public.feature_flags ORDER BY id")
    ).fetchall()
    return [dict(r._mapping) for r in rows]


@router.patch("/feature-flags/{flag_key}")
def update_flag(
    flag_key: str,
    payload: FlagUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    updates: dict = {
        "is_enabled": payload.is_enabled,
        "updated_by": admin["email"],
        "updated_at": _now(),
        "flag_key": flag_key,
    }
    if payload.coming_soon_text is not None:
        updates["coming_soon_text"] = payload.coming_soon_text

    set_clause = ", ".join(f"{k} = :{k}" for k in updates if k != "flag_key")
    result = db.execute(
        text(f"UPDATE public.feature_flags SET {set_clause} WHERE flag_key = :flag_key"),
        updates,
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Flag not found")
    return {"flag_key": flag_key, "is_enabled": payload.is_enabled}


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(25, le=100),
    search: Optional[str] = None,
    tier: Optional[str] = None,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    offset = (page - 1) * limit
    conditions, params = [], {"limit": limit, "offset": offset}

    if search:
        conditions.append("(email ILIKE :q OR name ILIKE :q)")
        params["q"] = f"%{search}%"
    if tier:
        conditions.append("subscription_tier = :tier")
        params["tier"] = tier

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    rows = db.execute(text(f"""
        SELECT id, email, name, first_name, last_name, phone,
               subscription_tier, subscription_status, is_premium,
               is_active, created_at, last_login_at, telegram_username
        FROM public.users {where}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """), params).fetchall()

    total = db.execute(
        text(f"SELECT COUNT(*) FROM public.users {where}"),
        {k: v for k, v in params.items() if k not in ("limit", "offset")},
    ).scalar() or 0

    return {
        "items": [dict(r._mapping) for r in rows],
        "total": total, "page": page, "limit": limit,
        "pages": max(1, -(-total // limit)),
    }


# ── PUBLIC endpoints (no auth — used by frontend) ─────────────────────────────

@router.get("/public/blogs")
def public_blogs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db),
):
    """Returns published blogs for the public blog listing page."""
    offset = (page - 1) * limit
    rows = db.execute(text("""
        SELECT id, slug, title, excerpt, city, tag,
               is_featured, read_time_mins, published_at, cover_image_url
        FROM public.blogs
        WHERE is_published = TRUE
        ORDER BY is_featured DESC, published_at DESC NULLS LAST, updated_at DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": limit, "offset": offset}).fetchall()
    total = db.execute(
        text("SELECT COUNT(*) FROM public.blogs WHERE is_published = TRUE")
    ).scalar() or 0
    return {
        "items": [dict(r._mapping) for r in rows],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, -(-total // limit)),
    }


@router.get("/public/blogs/{slug}")
def public_blog_by_slug(slug: str, db: Session = Depends(get_db)):
    """Returns a single published blog by slug for the blog detail page."""
    row = db.execute(
        text("SELECT * FROM public.blogs WHERE slug = :slug AND is_published = TRUE"),
        {"slug": slug},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Blog not found")
    return dict(row._mapping)


@router.get("/public/feature-flags")
def public_feature_flags(db: Session = Depends(get_db)):
    """Returns feature flags for frontend to consume (channel enabled/disabled)."""
    rows = db.execute(text(
        "SELECT flag_key, flag_label, is_enabled, coming_soon_text FROM public.feature_flags"
    )).fetchall()
    return {r[0]: {"label": r[1], "enabled": r[2], "coming_soon": r[3]} for r in rows}
