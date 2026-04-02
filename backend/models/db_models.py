"""
GovPlot Tracker — SQLAlchemy Models + Pydantic Schemas
v2.0: Added verification fields, cleaned unused columns from Scheme model
"""

from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, BigInteger, SmallInteger
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel, EmailStr

Base = declarative_base()


# ──────────────────────────────────────────────────────────────────────────────
# SQLAlchemy ORM Models
# ──────────────────────────────────────────────────────────────────────────────

class Scheme(Base):
    __tablename__ = "schemes"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id        = Column(String(64), unique=True, index=True, nullable=False)
    name             = Column(String(512), nullable=False)
    city             = Column(String(128), index=True)
    authority        = Column(String(64), index=True)
    status           = Column(String(32), index=True)           # OPEN | ACTIVE | UPCOMING | CLOSED
    open_date        = Column(String(32), nullable=True)
    close_date       = Column(String(32), nullable=True)
    total_plots      = Column(Integer, nullable=True)
    price_min        = Column(Float, nullable=True)             # in INR lakhs
    price_max        = Column(Float, nullable=True)
    area_sqft_min    = Column(Integer, nullable=True)
    area_sqft_max    = Column(Integer, nullable=True)
    location_details = Column(Text, nullable=True)
    apply_url        = Column(String(1024), nullable=True)
    source_url       = Column(String(1024), nullable=True)
    last_updated     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active        = Column(Boolean, default=True)

    # ── Verification fields (v2.0) ────────────────────────────────────────
    verification_score = Column(SmallInteger, default=0, nullable=False)
    # 0=unverified, 1-5 = number of sources that confirmed this scheme
    verified           = Column(Boolean, default=False, nullable=False)
    # True if verification_score >= 1


class User(Base):
    __tablename__ = "users"

    id                       = Column(Integer, primary_key=True, autoincrement=True)
    email                    = Column(String(256), unique=True, index=True, nullable=True)
    hashed_password          = Column(String(256), nullable=True)

    first_name               = Column(String(64), nullable=True)
    last_name                = Column(String(64), nullable=True)
    name                     = Column(String(128), nullable=True)
    phone                    = Column(String(20), nullable=True, unique=False, index=True)
    free_phone_edit_used     = Column(Boolean, default=False, nullable=False)

    google_id                = Column(String(128), nullable=True, unique=True, index=True)
    avatar_url               = Column(String(512), nullable=True)

    telegram_chat_id         = Column(BigInteger, nullable=True)
    telegram_username        = Column(String(128), nullable=True)
    telegram_link_token      = Column(String(128), nullable=True)
    telegram_link_expires_at = Column(DateTime, nullable=True)

    is_premium               = Column(Boolean, default=False)
    subscription_tier        = Column(String(32), default="free", nullable=False)
    subscription_status      = Column(String(32), default="inactive", nullable=False)
    subscription_expires_at  = Column(DateTime, nullable=True)
    razorpay_customer_id     = Column(String(128), nullable=True)
    razorpay_subscription_id = Column(String(128), nullable=True)

    is_active                = Column(Boolean, default=True)
    last_login_at            = Column(DateTime, nullable=True)
    created_at               = Column(DateTime, default=datetime.utcnow)

    @property
    def capabilities(self) -> list[str]:
        tier = (self.subscription_tier or "free").lower()
        capability_map = {
            "free": ["alerts.email"],
            "pro": [
                "alerts.email", "alerts.telegram", "alerts.whatsapp",
                "profile.phone_edit", "downloads.pdf",
            ],
            "premium": [
                "alerts.email", "alerts.telegram", "alerts.whatsapp",
                "profile.phone_edit", "downloads.pdf",
            ],
        }
        return capability_map.get(tier, capability_map["free"])


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(256), index=True, nullable=False)
    city       = Column(String(128), nullable=True)
    authority  = Column(String(64), nullable=True)
    channel    = Column(String(32), default="email")
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Subscription(Base):
    """Razorpay payment records."""
    __tablename__ = "subscriptions"

    id                   = Column(Integer, primary_key=True, autoincrement=True)
    user_email           = Column(String(256), index=True, nullable=False)
    razorpay_order_id    = Column(String(64), nullable=True)
    razorpay_payment_id  = Column(String(64), nullable=True)
    razorpay_sub_id      = Column(String(64), nullable=True)
    plan                 = Column(String(20), nullable=False, default="pro")
    amount_paise         = Column(Integer, nullable=False, default=9900)
    currency             = Column(String(10), default="INR")
    status               = Column(String(20), default="created")
    created_at           = Column(DateTime, default=datetime.utcnow)
    expires_at           = Column(DateTime, nullable=True)


class SeoMetadata(Base):
    __tablename__ = "seo_metadata"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id  = Column(String(64), unique=True, index=True)
    meta_title = Column(String(160))
    meta_desc  = Column(String(320))
    og_title   = Column(String(160))
    og_desc    = Column(String(320))
    keywords   = Column(Text)
    slug       = Column(String(200), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TelegramSubscriber(Base):
    __tablename__ = "telegram_subscribers"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    chat_id    = Column(String(32), unique=True, nullable=False)
    username   = Column(String(64), nullable=True)
    city       = Column(String(128), nullable=True)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Schemas
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
    verification_score: int = 0
    verified: bool = False

    class Config:
        from_attributes = True


class AlertCreate(BaseModel):
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
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    name: Optional[str]
    is_premium: bool
    subscription_tier: str
    subscription_status: str
    telegram_username: Optional[str]
    phone: Optional[str]
    avatar_url: Optional[str] = None
    free_phone_edit_used: bool = False
    capabilities: list[str] = []

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    phone: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthResponse(Token):
    user: UserOut


class SubscriptionStartRequest(BaseModel):
    plan_code: str = "pro_monthly"


class SubscriptionStartResponse(BaseModel):
    subscription_id: str
    checkout_key: str
    plan_code: str
    amount: int
    currency: str
    name: str
    description: str
    prefill_email: str
    prefill_name: Optional[str] = None
    prefill_contact: Optional[str] = None


class SubscriptionVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str


class TelegramLinkResponse(BaseModel):
    link_token: str
    bot_username: str
    deep_link_url: str
    expires_in: int


class TelegramLinkStatus(BaseModel):
    is_linked: bool
    telegram_username: Optional[str] = None
    deep_link_url: Optional[str] = None
    bot_username: Optional[str] = None
