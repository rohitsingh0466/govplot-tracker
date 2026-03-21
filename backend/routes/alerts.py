"""
GovPlot Tracker — Alerts / Notification Subscription Routes
POST /api/v1/alerts/subscribe   → subscribe to alerts
DELETE /api/v1/alerts/{id}      → unsubscribe
GET /api/v1/alerts/my           → list my subscriptions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.db_models import AlertSubscription, AlertCreate, AlertOut

router = APIRouter()


@router.post("/subscribe", response_model=AlertOut)
def subscribe(payload: AlertCreate, db: Session = Depends(get_db)):
    """Subscribe to scheme alerts for a city/authority via chosen channel."""
    existing = db.query(AlertSubscription).filter_by(
        user_email=payload.email,
        city=payload.city,
        authority=payload.authority,
        channel=payload.channel,
    ).first()

    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
        return existing

    sub = AlertSubscription(
        user_email=payload.email,
        city=payload.city,
        authority=payload.authority,
        channel=payload.channel,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/my", response_model=list[AlertOut])
def my_alerts(email: str, db: Session = Depends(get_db)):
    """List all active alert subscriptions for an email."""
    return db.query(AlertSubscription).filter_by(user_email=email, is_active=True).all()


@router.delete("/{alert_id}")
def unsubscribe(alert_id: int, db: Session = Depends(get_db)):
    sub = db.query(AlertSubscription).filter_by(id=alert_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.is_active = False
    db.commit()
    return {"message": "Unsubscribed successfully"}
