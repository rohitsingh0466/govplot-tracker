"""
GovPlot Tracker — Auth Routes v1.2
Supports: Email/Password, Google OAuth, Mobile OTP
New fields: first_name, last_name, phone_verified
"""

from __future__ import annotations

import os
import random
import string
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from backend.auth_utils import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from backend.models.database import get_db
from backend.models.db_models import (
    AuthResponse,
    SendOTPRequest,
    User,
    UserCreate,
    UserLogin,
    UserOut,
    VerifyOTPRequest,
)

router = APIRouter()

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "https://govplottracker-api.railway.app/api/v1/auth/google/callback")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "https://govplottracker.com")

OTP_EXPIRE_MINUTES   = 10


# ─── Helpers ────────────────────────────────────────────────────────────────

def _build_auth_response(user: User) -> AuthResponse:
    from datetime import timezone
    token, expires_at = create_access_token(user.email or str(user.id))
    expires_in = max(expires_at - int(datetime.now(timezone.utc).timestamp()), 0)
    return AuthResponse(access_token=token, expires_in=expires_in, user=user)


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def _send_sms_otp(phone: str, otp: str) -> bool:
    """
    Send OTP via SMS. Integrate your SMS provider here.
    Supported: Twilio, MSG91, Fast2SMS, etc.
    Returns True if sent successfully.
    """
    # --- MSG91 (popular in India) ---
    api_key = os.getenv("MSG91_API_KEY")
    sender  = os.getenv("MSG91_SENDER_ID", "GOVPLT")
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    "https://api.msg91.com/api/v5/otp",
                    json={
                        "mobile": phone.lstrip("+"),
                        "otp": otp,
                        "sender": sender,
                        "template_id": os.getenv("MSG91_TEMPLATE_ID", ""),
                        "authkey": api_key,
                    },
                )
                return resp.status_code == 200
        except Exception:
            pass

    # --- Twilio fallback ---
    twilio_sid   = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from  = os.getenv("TWILIO_PHONE_FROM")
    if twilio_sid and twilio_token and twilio_from:
        try:
            async with httpx.AsyncClient(auth=(twilio_sid, twilio_token), timeout=10) as client:
                await client.post(
                    f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json",
                    data={
                        "From": twilio_from,
                        "To": phone,
                        "Body": f"Your GovPlot Tracker OTP is {otp}. Valid for {OTP_EXPIRE_MINUTES} minutes.",
                    },
                )
                return True
        except Exception:
            pass

    # Dev mode — just log
    import logging
    logging.getLogger(__name__).info(f"[DEV] OTP for {phone}: {otp}")
    return True


# ─── Email / Password ────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if not payload.email:
        raise HTTPException(status_code=400, detail="Email is required for email registration")
    if not payload.password:
        raise HTTPException(status_code=400, detail="Password is required")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Resolve display name
    full_name = None
    if payload.first_name or payload.last_name:
        full_name = f"{payload.first_name or ''} {payload.last_name or ''}".strip()
    elif payload.name:
        full_name = payload.name

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        name=full_name,
        phone=payload.phone,
        subscription_tier="free",
        subscription_status="active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _build_auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return _build_auth_response(user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ─── Google OAuth ────────────────────────────────────────────────────────────

@router.get("/google")
def google_login():
    """Redirect browser to Google OAuth consent screen."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return RedirectResponse(url=f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}")


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback, upsert user, redirect to frontend with token."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")

    # Exchange code for tokens
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Google token exchange failed")

    token_data = token_resp.json()
    id_token   = token_data.get("id_token")

    # Decode Google ID token (no signature verify needed — just payload)
    import base64, json as _json
    try:
        payload_b64 = id_token.split(".")[1]
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        google_user = _json.loads(base64.urlsafe_b64decode(payload_b64))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode Google token")

    google_id   = google_user.get("sub")
    email       = google_user.get("email")
    first_name  = google_user.get("given_name")
    last_name   = google_user.get("family_name")
    avatar_url  = google_user.get("picture")

    # Upsert user
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            google_id=google_id,
            first_name=first_name,
            last_name=last_name,
            name=f"{first_name or ''} {last_name or ''}".strip() or email,
            avatar_url=avatar_url,
            subscription_tier="free",
            subscription_status="active",
        )
        db.add(user)
    else:
        user.google_id  = user.google_id or google_id
        user.first_name = user.first_name or first_name
        user.last_name  = user.last_name or last_name
        user.avatar_url = avatar_url or user.avatar_url

    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    auth = _build_auth_response(user)
    import json
    user_json = json.dumps({
        "id": user.id, "email": user.email,
        "first_name": user.first_name, "last_name": user.last_name,
        "name": user.name, "is_premium": user.is_premium,
        "subscription_tier": user.subscription_tier,
        "subscription_status": user.subscription_status,
        "telegram_username": user.telegram_username,
        "avatar_url": user.avatar_url,
    })
    from urllib.parse import quote
    redirect_url = f"{FRONTEND_URL}/auth?token={auth.access_token}&user={quote(user_json)}"
    return RedirectResponse(url=redirect_url)


# ─── Mobile OTP ─────────────────────────────────────────────────────────────

@router.post("/send-otp", status_code=200)
async def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    """Generate and send OTP to mobile number."""
    phone = payload.phone
    if not phone.startswith("+"):
        raise HTTPException(status_code=400, detail="Phone must be in E.164 format: +91XXXXXXXXXX")

    otp         = _generate_otp()
    otp_expires = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

    # Upsert OTP into user record (or a temp record keyed on phone)
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        # Create a placeholder user for OTP verification
        user = User(
            phone=phone,
            subscription_tier="free",
            subscription_status="active",
            otp_code=otp,
            otp_expires_at=otp_expires,
        )
        db.add(user)
    else:
        user.otp_code      = otp
        user.otp_expires_at = otp_expires

    db.commit()

    sent = await _send_sms_otp(phone, otp)
    if not sent:
        raise HTTPException(status_code=503, detail="Could not send OTP. Please try again.")

    return {"message": f"OTP sent to {phone}", "expires_in": OTP_EXPIRE_MINUTES * 60}


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP and return auth token. Creates/updates user account."""
    phone = payload.phone
    user  = db.query(User).filter(User.phone == phone).first()

    if not user:
        raise HTTPException(status_code=404, detail="No OTP request found for this number")
    if not user.otp_code or user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if not user.otp_expires_at or user.otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # Mark phone verified, update name fields
    user.phone_verified = True
    user.otp_code       = None
    user.otp_expires_at = None
    user.last_login_at  = datetime.utcnow()

    if payload.first_name and not user.first_name:
        user.first_name = payload.first_name
    if payload.last_name and not user.last_name:
        user.last_name = payload.last_name
    if (payload.first_name or payload.last_name) and not user.name:
        user.name = f"{payload.first_name or ''} {payload.last_name or ''}".strip()

    # Ensure user has a usable email or generate a placeholder
    if not user.email:
        user.email = f"phone_{phone.replace('+', '')}@govplot.user"

    db.commit()
    db.refresh(user)
    return _build_auth_response(user)
