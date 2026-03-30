"""
GovPlot Tracker — Alerts / Notification Subscription Routes
POST /api/v1/alerts/subscribe   → subscribe to alerts
DELETE /api/v1/alerts/{id}      → unsubscribe
GET /api/v1/alerts/my           → list my subscriptions
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.auth_utils import get_current_user
from backend.models.database import get_db
from backend.models.db_models import AlertSubscription, AlertCreate, AlertOut, User

router = APIRouter()


def _require_user_email(current_user: User) -> str:
    if not current_user.email:
        raise HTTPException(status_code=400, detail="This account does not have a usable email address")
    return current_user.email


def _assert_channel_access(current_user: User, channel: str) -> None:
    allowed = set(current_user.capabilities)
    if channel == "email":
        if "alerts.email" not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email alerts are not enabled for this account")
        return
    if channel == "telegram":
        if "alerts.telegram" not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Telegram alerts require a Pro or Premium plan")
        return
    if channel == "whatsapp":
        if "alerts.whatsapp" not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WhatsApp alerts require a Pro or Premium plan")
        if not current_user.phone:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Add your 10-digit mobile number in the dashboard before enabling WhatsApp alerts")
        return
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported alert channel")


@router.post("/subscribe", response_model=AlertOut)
def subscribe(
    payload: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Subscribe to scheme alerts for a city/authority via chosen channel."""
    email = _require_user_email(current_user)
    channel = (payload.channel or "email").lower()
    _assert_channel_access(current_user, channel)

    existing = db.query(AlertSubscription).filter_by(
        user_email=email,
        city=payload.city,
        authority=payload.authority,
        channel=channel,
    ).first()

    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
        return existing

    sub = AlertSubscription(
        user_email=email,
        city=payload.city,
        authority=payload.authority,
        channel=channel,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/my", response_model=list[AlertOut])
def my_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all active alert subscriptions for an email."""
    email = _require_user_email(current_user)
    return db.query(AlertSubscription).filter_by(user_email=email, is_active=True).all()


@router.delete("/{alert_id}")
def unsubscribe(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    email = _require_user_email(current_user)
    sub = db.query(AlertSubscription).filter_by(id=alert_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if sub.user_email != email:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.is_active = False
    db.commit()
    return {"message": "Unsubscribed successfully"}
