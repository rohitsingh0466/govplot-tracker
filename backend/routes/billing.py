"""
GovPlot Tracker — Razorpay billing routes v3.0
Plans:
  pro_monthly     → ₹99/mo  → 2 city alerts (Email, Telegram)
  premium_monthly → ₹299/mo → unlimited city alerts (Email, Telegram, WhatsApp)
"""

from __future__ import annotations

import hashlib
import hmac
import os
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.auth_utils import get_current_user
from backend.models.database import get_db
from backend.models.db_models import (
    SubscriptionStartRequest,
    SubscriptionStartResponse,
    SubscriptionVerifyRequest,
    User,
)

router = APIRouter()

RAZORPAY_API_BASE = "https://api.razorpay.com/v1"

PLAN_CONFIG = {
    "pro_monthly": {
        "code": "pro_monthly",
        "name": "GovPlot Pro",
        "description": "All schemes + Email & Telegram alerts for up to 2 cities.",
        "amount_env": "RAZORPAY_PRO_MONTHLY_AMOUNT",
        "amount_default": 9900,
        "currency_env": "RAZORPAY_PRO_MONTHLY_CURRENCY",
        "plan_id_env": "RAZORPAY_PRO_PLAN_ID",
        "total_count_env": "RAZORPAY_PRO_TOTAL_COUNT",
        "total_count_default": 12,
        "tier": "pro",
    },
    "premium_monthly": {
        "code": "premium_monthly",
        "name": "GovPlot Premium",
        "description": "All schemes + Email, Telegram & WhatsApp alerts for unlimited cities.",
        "amount_env": "RAZORPAY_PREMIUM_MONTHLY_AMOUNT",
        "amount_default": 29900,
        "currency_env": "RAZORPAY_PREMIUM_MONTHLY_CURRENCY",
        "plan_id_env": "RAZORPAY_PREMIUM_PLAN_ID",
        "total_count_env": "RAZORPAY_PREMIUM_TOTAL_COUNT",
        "total_count_default": 12,
        "tier": "premium",
    },
}


def _env(name: str, *, required: bool = True, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if required and not value:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{name} is not configured",
        )
    return value or ""


def _get_plan_config(plan_code: str) -> dict:
    if plan_code not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unsupported plan code: {plan_code}")
    cfg = PLAN_CONFIG[plan_code]
    return {
        **cfg,
        "amount": int(os.getenv(cfg["amount_env"], str(cfg["amount_default"]))),
        "currency": os.getenv(cfg["currency_env"], "INR"),
        "plan_id": _env(cfg["plan_id_env"]),
        "total_count": int(os.getenv(cfg["total_count_env"], str(cfg["total_count_default"]))),
    }


async def _razorpay_request(method: str, path: str, *, json: dict[str, Any] | None = None) -> dict[str, Any]:
    key_id = _env("RAZORPAY_KEY_ID")
    key_secret = _env("RAZORPAY_KEY_SECRET")

    async with httpx.AsyncClient(auth=(key_id, key_secret), timeout=20) as client:
        response = await client.request(method, f"{RAZORPAY_API_BASE}{path}", json=json)

    if response.status_code >= 400:
        detail = response.json() if "json" in response.headers.get("content-type", "") else response.text
        raise HTTPException(status_code=502, detail={"message": "Razorpay request failed", "razorpay": detail})
    return response.json()


@router.get("/plans")
def list_plans(current_user: User = Depends(get_current_user)):
    plans = []
    for plan_code, cfg in PLAN_CONFIG.items():
        plans.append({
            "code": plan_code,
            "name": cfg["name"],
            "description": cfg["description"],
            "amount": int(os.getenv(cfg["amount_env"], str(cfg["amount_default"]))),
            "currency": os.getenv(cfg["currency_env"], "INR"),
            "interval": "monthly",
            "tier": cfg["tier"],
        })
    return {
        "plans": plans,
        "user": {
            "email": current_user.email,
            "subscription_tier": current_user.subscription_tier,
            "subscription_status": current_user.subscription_status,
        },
    }


@router.post("/subscription/start", response_model=SubscriptionStartResponse)
async def start_subscription(
    payload: SubscriptionStartRequest,
    current_user: User = Depends(get_current_user),
):
    plan = _get_plan_config(payload.plan_code)
    key_id = _env("RAZORPAY_KEY_ID")

    # Check if already on the target tier
    target_tier = plan["tier"]
    if current_user.subscription_tier == target_tier and current_user.subscription_status in {"authenticated", "active", "pending"}:
        raise HTTPException(
            status_code=400,
            detail=f"{target_tier.capitalize()} subscription is already active."
        )

    subscription = await _razorpay_request(
        "POST",
        "/subscriptions",
        json={
            "plan_id": plan["plan_id"],
            "total_count": plan["total_count"],
            "quantity": 1,
            "customer_notify": True,
            "notes": {
                "product": "govplot",
                "user_email": current_user.email,
                "user_id": str(current_user.id),
                "plan_code": plan["code"],
                "tier": target_tier,
            },
        },
    )

    return SubscriptionStartResponse(
        subscription_id=subscription["id"],
        checkout_key=key_id,
        plan_code=plan["code"],
        amount=plan["amount"],
        currency=plan["currency"],
        name=plan["name"],
        description=plan["description"],
        prefill_email=current_user.email,
        prefill_name=current_user.name,
        prefill_contact=current_user.phone,
    )


@router.post("/subscription/verify")
async def verify_subscription(
    payload: SubscriptionVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    key_secret = _env("RAZORPAY_KEY_SECRET")

    # Verify Razorpay signature
    signed_value = f"{payload.razorpay_payment_id}|{payload.razorpay_subscription_id}".encode("utf-8")
    generated_signature = hmac.new(
        key_secret.encode("utf-8"),
        signed_value,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(generated_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid Razorpay signature")

    # Fetch subscription details from Razorpay
    subscription = await _razorpay_request("GET", f"/subscriptions/{payload.razorpay_subscription_id}")
    razorpay_status = subscription.get("status", "authenticated")

    # Determine plan from subscription notes or plan_id
    notes = subscription.get("notes", {})
    plan_code = notes.get("plan_code", "pro_monthly")
    tier = notes.get("tier", "pro")
    amount_paise = subscription.get("amount", 9900)

    # Use the DB function to atomically sync user + subscription record
    db.execute(
        text("""
            SELECT public.sync_user_subscription(
                :user_id, :plan, :razorpay_sub_id,
                :razorpay_payment_id, :razorpay_signature,
                :amount_paise, :sub_status
            )
        """),
        {
            "user_id": current_user.id,
            "plan": plan_code,
            "razorpay_sub_id": payload.razorpay_subscription_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_signature": payload.razorpay_signature,
            "amount_paise": amount_paise,
            "sub_status": razorpay_status,
        }
    )
    db.commit()
    db.refresh(current_user)

    return {
        "message": f"{tier.capitalize()} subscription verified",
        "subscription_tier": current_user.subscription_tier,
        "subscription_status": current_user.subscription_status,
        "is_premium": current_user.is_premium,
        "max_alert_cities": current_user.max_alert_cities,
    }


@router.post("/subscription/cancel")
async def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.razorpay_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription found")

    try:
        await _razorpay_request("POST", f"/subscriptions/{current_user.razorpay_subscription_id}/cancel")
    except Exception:
        pass  # proceed to update local state even if Razorpay call fails

    current_user.subscription_tier = "free"
    current_user.subscription_status = "cancelled"
    current_user.is_premium = False
    current_user.alert_cities_limit = 0
    current_user.razorpay_subscription_id = None
    db.add(current_user)
    db.commit()

    return {"message": "Subscription cancelled. You are now on the Free plan."}
