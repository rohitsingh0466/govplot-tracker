"""
GovPlot Tracker — Auth Routes v1.2
Supports: Email/Password and Google OAuth
New fields: first_name, last_name
"""

from __future__ import annotations

import os
from datetime import datetime
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
    User,
    UserCreate,
    UserLogin,
    UserOut,
)

router = APIRouter()

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "https://govplottracker-api.railway.app/api/v1/auth/google/callback")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "https://govplottracker.com")

# ─── Helpers ────────────────────────────────────────────────────────────────

def _build_auth_response(user: User) -> AuthResponse:
    from datetime import timezone
    token, expires_at = create_access_token(user.email or str(user.id))
    expires_in = max(expires_at - int(datetime.now(timezone.utc).timestamp()), 0)
    return AuthResponse(access_token=token, expires_in=expires_in, user=user)


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
