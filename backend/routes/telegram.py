"""
GovPlot Tracker — Telegram account linking routes v3.0
Fixed: returns clear warning when telegram alerts are subscribed but bot not linked.
"""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.auth_utils import get_current_user
from backend.models.database import get_db
from backend.models.db_models import TelegramLinkResponse, TelegramLinkStatus, User

router = APIRouter()


def _bot_username() -> str:
    username = os.getenv("TELEGRAM_BOT_USERNAME")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TELEGRAM_BOT_USERNAME is not configured",
        )
    return username.lstrip("@")


@router.post("/link", response_model=TelegramLinkResponse)
def create_link_token(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a one-time Telegram deep-link token. Valid for 15 minutes."""
    if "alerts.telegram" not in current_user.capabilities:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Telegram linking is available on Pro and Premium plans only",
        )

    bot_username = _bot_username()
    token        = secrets.token_urlsafe(24)
    expires_at   = datetime.utcnow() + timedelta(minutes=15)

    current_user.telegram_link_token      = token
    current_user.telegram_link_expires_at = expires_at
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return TelegramLinkResponse(
        link_token=token,
        bot_username=bot_username,
        deep_link_url=f"https://t.me/{bot_username}?start=link_{token}",
        expires_in=15 * 60,
    )


@router.get("/status")
def telegram_link_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns Telegram link status with extra context:
    - is_linked: True if telegram_chat_id is set
    - pending_alerts: number of telegram alerts blocked because bot not linked
    - action_required: clear message if user needs to complete the link
    """
    if "alerts.telegram" not in current_user.capabilities:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Telegram linking is available on Pro and Premium plans only",
        )

    bot_username = os.getenv("TELEGRAM_BOT_USERNAME", "").lstrip("@")

    # Count blocked telegram alerts for this user
    blocked_count = db.execute(
        text("""
            SELECT COUNT(*) FROM public.alert_dispatch_blocked_view
            WHERE user_email = :email AND channel = 'telegram'
        """),
        {"email": current_user.email},
    ).scalar() or 0

    if current_user.telegram_chat_id:
        return {
            "is_linked": True,
            "telegram_username": current_user.telegram_username,
            "telegram_chat_id": str(current_user.telegram_chat_id),
            "bot_username": bot_username or None,
            "pending_alerts": 0,
            "action_required": None,
        }

    # Not linked — build deep link if token is still valid
    deep_link_url = None
    if (
        bot_username
        and current_user.telegram_link_token
        and current_user.telegram_link_expires_at
        and current_user.telegram_link_expires_at > datetime.utcnow()
    ):
        deep_link_url = (
            f"https://t.me/{bot_username}?start=link_{current_user.telegram_link_token}"
        )

    action_required = None
    if blocked_count > 0:
        action_required = (
            f"You have {blocked_count} Telegram alert(s) subscribed but your "
            f"Telegram account is not linked. Use 'Connect Telegram' in your dashboard "
            f"to complete the setup, otherwise these alerts will not be delivered."
        )

    return {
        "is_linked": False,
        "telegram_username": current_user.telegram_username,
        "telegram_chat_id": None,
        "bot_username": bot_username or None,
        "deep_link_url": deep_link_url,
        "pending_alerts": blocked_count,
        "action_required": action_required,
    }
