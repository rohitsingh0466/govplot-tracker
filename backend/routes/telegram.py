"""
GovPlot Tracker — Telegram account linking routes.
"""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
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
    if "alerts.telegram" not in current_user.capabilities:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Telegram linking is available on Pro and Premium plans only",
        )
    bot_username = _bot_username()
    token = secrets.token_urlsafe(24)
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    current_user.telegram_link_token = token
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


@router.get("/status", response_model=TelegramLinkStatus)
def telegram_link_status(current_user: User = Depends(get_current_user)):
    if "alerts.telegram" not in current_user.capabilities:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Telegram linking is available on Pro and Premium plans only",
        )
    if current_user.telegram_chat_id:
        return TelegramLinkStatus(
            is_linked=True,
            telegram_username=current_user.telegram_username,
            bot_username=os.getenv("TELEGRAM_BOT_USERNAME", "").lstrip("@") or None,
        )

    bot_username = os.getenv("TELEGRAM_BOT_USERNAME", "").lstrip("@")
    deep_link_url = None
    if bot_username and current_user.telegram_link_token and current_user.telegram_link_expires_at:
        if current_user.telegram_link_expires_at > datetime.utcnow():
            deep_link_url = f"https://t.me/{bot_username}?start=link_{current_user.telegram_link_token}"

    return TelegramLinkStatus(
        is_linked=False,
        telegram_username=current_user.telegram_username,
        deep_link_url=deep_link_url,
        bot_username=bot_username or None,
    )
