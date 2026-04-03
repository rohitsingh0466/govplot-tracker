"""
GovPlot Tracker — SQLAlchemy Models + Pydantic Schemas
v3.0: New subscription model: free | pro | premium
      Scheme visibility: anonymous=CLOSED+UPCOMING | signed_free=all | pro=all+2city alerts | premium=all+unlimited alerts
"""

from __future__ import annotations
from datetime import datetime
from typing import Optional, Literal
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, BigInteger, SmallInteger
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel, EmailStr

Base = declarative_base()

# ──────────────────────────────────────────────────────────────────────────────
# Subscription tiers
# ──────────────────────────────────────────────────────────────────────────────
# free       → logged in, can see ALL schemes, no city alerts
# pro        → paid, all schemes + Email/Telegram alerts for up to 2 cities
# premium    → paid, all schemes + Email/Telegram/WhatsApp alerts, all cities
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
    price_min        = Column(Float, nullable=True)
    price_max        = Column(Float, nullable=True)
    area_sqft_min    = Column(Integer, nullable=True)
    area_sqft_max    = Column(Integer, nullable=True)
    location_details = Column(Text, nullable=True)
    apply_url        = Column(String(1024), nullable=True)
    source_url       = Column(String(1024), nullable=True)
    last_updated     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active        = Column(Boolean, default=True)
    verification_score = Column(SmallInteger, default=0, nullable=False)
    verified           = Column(Boolean, default=False, nullable=False)


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
    # Tiers: 'free' | 'pro' | 'premium'
    subscription_tier        = Column(String(32), default="free", nullable=False)
    subscription_status      = Column(String(32), default="active", nullable=False)
    subscription_expires_at  = Column(DateTime, nullable=True)
    razorpay_customer_id     = Column(String(128), nullable=True)
    razorpay_subscription_id = Column(String(128), nullable=True)

    # How many cities this user can subscribe alerts for
    # free=0, pro=2, premium=999
    alert_cities_limit       = Column(Integer, default=0, nullable=False)

    is_active                = Column(Boolean, default=True)
    last_login_at            = Column(DateTime, nullable=True)
    created_at               = Column(DateTime, default=datetime.utcnow)

    @property
    def capabilities(self) -> list[str]:
        tier = (self.subscription_tier or "free").lower()
        capability_map = {
            "free": [
                # Can see all schemes after sign-up, but no alerts
                "schemes.view_all",
            ],
            "pro": [
                "schemes.view_all",
                "alerts.email",
                "alerts.telegram",
                "alerts.max_cities_2",
                "profile.phone_edit",
                "downloads.pdf",
            ],
            "premium": [
                "schemes.view_all",
                "alerts.email",
                "alerts.telegram",
                "alerts.whatsapp",
                "alerts.unlimited_cities",
                "profile.phone_edit",
                "downloads.pdf",
            ],
        }
        return capability_map.get(tier, capability_map["free"])

    @property
    def can_view_open_schemes(self) -> bool:
        """Logged-in users (any tier) can see OPEN/ACTIVE schemes."""
        return True  # any authenticated user can see all statuses

    @property
    def max_alert_cities(self) -> int:
        tier = (self.subscription_tier or "free").lower()
        return {"free": 0, "pro": 2, "premium": 999}.get(tier, 0)


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(256), index=True, nullable=False)
    user_id    = Column(Integer, nullable=True, index=True)
    city       = Column(String(128), nullable=True)
    authority  = Column(String(64), nullable=True)
    channel    = Column(String(32), default="email")
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Subscription(Base):
    """Razorpay payment records — FK to users."""
    __tablename__ = "subscriptions"

    id                   = Column(Integer, primary_key=True, autoincrement=True)
    user_id              = Column(Integer, nullable=False, index=True)   # FK to users.id
    user_email           = Column(String(256), index=True, nullable=True)
    razorpay_order_id    = Column(String(64), nullable=True)
    razorpay_payment_id  = Column(String(64), nullable=True)
    razorpay_sub_id      = Column(String(64), nullable=True)
    razorpay_signature   = Column(String(256), nullable=True)
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
    # Blurred means the user can see the card exists but not the details
    blurred: bool = False

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
    max_alert_cities: int = 0
    alert_cities_limit: int = 0

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
