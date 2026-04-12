"""
GovPlot Tracker — Admin Authentication Routes v1.0
===================================================
Endpoints:
  POST /api/v1/admin/auth/login   → issue JWT, record session
  POST /api/v1/admin/auth/logout  → revoke session
  GET  /api/v1/admin/auth/me      → return current admin info

Security:
  • Brute-force: max 5 failed attempts per IP per 15 minutes → HTTP 429
  • Sessions tracked in admin_sessions table (forced logout supported)
  • JWT signed with ADMIN_SECRET_KEY (separate from user SECRET_KEY)
  • Tokens expire after 8 hours
"""
from __future__ import annotations

import os
import uuid
import logging
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt

from fastapi import APIRouter, Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.models.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────
ADMIN_SECRET_KEY    = os.getenv("ADMIN_SECRET_KEY", os.getenv("SECRET_KEY", "admin-dev-secret-32chars-min"))
ALGORITHM           = "HS256"
TOKEN_EXPIRE_HOURS  = 8
MAX_ATTEMPTS        = 5
LOCKOUT_MINUTES     = 15

bearer = HTTPBearer(auto_error=False)


# ── Password helpers using bcrypt 4.x directly (no passlib) ──────────────────
def _verify_password(plain: str, hashed: str) -> bool:
    """Works with both $2a$ (pgcrypto) and $2b$ (bcrypt) prefixes."""
    try:
        h = hashed.encode() if isinstance(hashed, str) else hashed
        # Normalise $2a$ → $2b$ so bcrypt 4.x accepts pgcrypto hashes
        if h.startswith(b"$2a$"):
            h = b"$2b$" + h[4:]
        return _bcrypt.checkpw(plain.encode(), h)
    except Exception as exc:
        logger.error(f"Password verify error: {exc}")
        return False


# ── Pydantic ─────────────────────────────────────────────────────────────────
class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    admin_email: str


# ── Helpers ───────────────────────────────────────────────────────────────────
def _client_ip(request: Request) -> str:
    fwd = request.headers.get("X-Forwarded-For")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(db: Session, ip: str) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=LOCKOUT_MINUTES)
    count = db.execute(
        text("""
            SELECT COUNT(*) FROM public.admin_login_attempts
            WHERE ip_address = :ip AND success = FALSE AND attempted_at > :cutoff
        """),
        {"ip": ip, "cutoff": cutoff},
    ).scalar()
    if count and count >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts from your IP. Try again after {LOCKOUT_MINUTES} minutes.",
        )


def _record_attempt(db: Session, ip: str, email: str, success: bool) -> None:
    db.execute(
        text("""
            INSERT INTO public.admin_login_attempts (ip_address, email, success)
            VALUES (:ip, :email, :success)
        """),
        {"ip": ip, "email": email, "success": success},
    )
    # Cleanup stale attempts while we're here
    db.execute(
        text("DELETE FROM public.admin_login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours'")
    )
    db.commit()


def _make_token(admin_id: int, email: str) -> tuple[str, str, datetime]:
    jti    = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "sub":   str(admin_id),
        "email": email,
        "jti":   jti,
        "exp":   expire,
        "type":  "admin",
    }
    token = jwt.encode(payload, ADMIN_SECRET_KEY, algorithm=ALGORITHM)
    return token, jti, expire


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> dict:
    """FastAPI dependency — validates admin JWT and returns admin dict."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, ADMIN_SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("type") != "admin":
        raise HTTPException(status_code=401, detail="Invalid token type")

    jti = payload.get("jti", "")
    row = db.execute(
        text("SELECT is_revoked FROM public.admin_sessions WHERE token_jti = :jti"),
        {"jti": jti},
    ).fetchone()
    if row and row[0]:
        raise HTTPException(status_code=401, detail="Session has been revoked")

    return {"id": int(payload["sub"]), "email": payload["email"], "jti": jti}


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/login", response_model=AdminLoginResponse)
def admin_login(
    payload: AdminLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = _client_ip(request)
    _check_rate_limit(db, ip)

    row = db.execute(
        text("SELECT id, email, password_hash FROM public.admin_users WHERE email = :e"),
        {"e": payload.email},
    ).fetchone()

    if not row or not _verify_password(payload.password, row[2]):
        _record_attempt(db, ip, payload.email, success=False)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _record_attempt(db, ip, payload.email, success=True)
    token, jti, expire = _make_token(row[0], row[1])

    # Store session
    db.execute(
        text("""
            INSERT INTO public.admin_sessions
                (admin_id, token_jti, ip_address, user_agent, expires_at)
            VALUES (:aid, :jti, :ip, :ua, :exp)
        """),
        {
            "aid": row[0], "jti": jti, "ip": ip,
            "ua": request.headers.get("User-Agent", "")[:500],
            "exp": expire,
        },
    )
    db.execute(
        text("UPDATE public.admin_users SET last_login_at = NOW() WHERE id = :id"),
        {"id": row[0]},
    )
    db.commit()

    return AdminLoginResponse(
        access_token=token,
        expires_in=TOKEN_EXPIRE_HOURS * 3600,
        admin_email=row[1],
    )


@router.post("/logout")
def admin_logout(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    db.execute(
        text("UPDATE public.admin_sessions SET is_revoked = TRUE WHERE token_jti = :jti"),
        {"jti": admin["jti"]},
    )
    db.commit()
    return {"message": "Logged out successfully"}


@router.get("/me")
def admin_me(admin: dict = Depends(get_current_admin)):
    return {"id": admin["id"], "email": admin["email"]}
