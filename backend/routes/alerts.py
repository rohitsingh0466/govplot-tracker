"""
GovPlot Tracker — Alerts / Notification Subscription Routes v3.0
Tier access:
  free    → 0 city alerts (blocked)
  pro     → up to 2 cities (Email + Telegram)
  premium → unlimited cities (Email + Telegram + WhatsApp)
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


def _assert_alert_access(current_user: User, channel: str, db: Session) -> None:
    tier = (current_user.subscription_tier or "free").lower()

    # Free users cannot create any alerts
    if tier == "free":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Alert subscriptions require a Pro or Premium plan. Upgrade to stay updated with active schemes."
        )

    # Channel access checks
    if channel == "whatsapp" and tier != "premium":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="WhatsApp alerts require a Premium plan"
        )
    if channel == "whatsapp" and not current_user.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add your 10-digit mobile number in the dashboard before enabling WhatsApp alerts"
        )

    # Cities limit check (pro = 2 cities max)
    if tier == "pro":
        active_count = db.query(AlertSubscription).filter_by(
            user_email=current_user.email, is_active=True
        ).count()
        if active_count >= current_user.max_alert_cities:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Pro plan supports up to {current_user.max_alert_cities} city alerts. Upgrade to Premium for unlimited cities."
            )


@router.post("/subscribe", response_model=AlertOut)
def subscribe(
    payload: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Subscribe to scheme alerts for a city/authority via chosen channel."""
    email = _require_user_email(current_user)
    channel = (payload.channel or "email").lower()
    _assert_alert_access(current_user, channel, db)

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
        user_id=current_user.id,
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
    if not sub or sub.user_email != email:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.is_active = False
    db.commit()
    return {"message": "Unsubscribed successfully"}
