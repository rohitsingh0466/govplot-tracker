"""
GovPlot Tracker — SQLAlchemy Models + Pydantic Schemas
"""

from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel, EmailStr

Base = declarative_base()


# ──────────────────────────────────────────────────────────────────────────────
# SQLAlchemy ORM Models
# ──────────────────────────────────────────────────────────────────────────────

class Scheme(Base):
    __tablename__ = "schemes"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id      = Column(String(64), unique=True, index=True, nullable=False)
    name           = Column(String(512), nullable=False)
    city           = Column(String(128), index=True)
    authority      = Column(String(64), index=True)
    status         = Column(String(32), index=True)   # OPEN | CLOSED | ACTIVE | UPCOMING
    open_date      = Column(String(32), nullable=True)
    close_date     = Column(String(32), nullable=True)
    total_plots    = Column(Integer, nullable=True)
    price_min      = Column(Float, nullable=True)     # INR lakhs
    price_max      = Column(Float, nullable=True)
    area_sqft_min  = Column(Integer, nullable=True)
    area_sqft_max  = Column(Integer, nullable=True)
    location_details = Column(Text, nullable=True)
    apply_url      = Column(String(1024), nullable=True)
    source_url     = Column(String(1024), nullable=True)
    last_updated   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active      = Column(Boolean, default=True)


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    email         = Column(String(256), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    name          = Column(String(128), nullable=True)
    phone         = Column(String(20), nullable=True)
    is_premium    = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    user_email    = Column(String(256), index=True, nullable=False)
    city          = Column(String(128), nullable=True)   # NULL = all cities
    authority     = Column(String(64), nullable=True)    # NULL = all authorities
    channel       = Column(String(32), default="email")  # email | whatsapp | telegram | push
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Response Schemas
# ──────────────────────────────────────────────────────────────────────────────

class SchemeOut(BaseModel):
    scheme_id: str
    name: str
    city: str
    authority: str
    status: str
    open_date: Optional[str]
    close_date: Optional[str]
    total_plots: Optional[int]
    price_min: Optional[float]
    price_max: Optional[float]
    area_sqft_min: Optional[int]
    area_sqft_max: Optional[int]
    location_details: Optional[str]
    apply_url: Optional[str]
    source_url: Optional[str]
    last_updated: Optional[datetime]

    class Config:
        from_attributes = True


class AlertCreate(BaseModel):
    email: EmailStr
    city: Optional[str] = None
    authority: Optional[str] = None
    channel: str = "email"


class AlertOut(BaseModel):
    id: int
    user_email: str
    city: Optional[str]
    authority: Optional[str]
    channel: str
    is_active: bool

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str]
    is_premium: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
