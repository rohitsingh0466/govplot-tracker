"""
GovPlot Tracker — Razorpay billing routes for v1.1.
"""

from __future__ import annotations

import hashlib
import hmac
import os
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
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


@dataclass(frozen=True)
class BillingPlan:
    code: str
    name: str
    description: str
    amount: int
    currency: str
    plan_id: str
    total_count: int


def _env(name: str, *, required: bool = True, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if required and not value:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{name} is not configured",
        )
    return value or ""


def _billing_plan(plan_code: str) -> BillingPlan:
    if plan_code != "pro_monthly":
        raise HTTPException(status_code=400, detail="Unsupported plan code")

    return BillingPlan(
        code="pro_monthly",
        name="GovPlot Pro Monthly",
        description="Unlimited tracking, premium alerts, and Pro member access.",
        amount=int(os.getenv("RAZORPAY_PRO_MONTHLY_AMOUNT", "9900")),
        currency=os.getenv("RAZORPAY_PRO_MONTHLY_CURRENCY", "INR"),
        plan_id=_env("RAZORPAY_PRO_PLAN_ID"),
        total_count=int(os.getenv("RAZORPAY_PRO_TOTAL_COUNT", "12")),
    )


async def _razorpay_request(method: str, path: str, *, json: dict[str, Any] | None = None) -> dict[str, Any]:
    key_id = _env("RAZORPAY_KEY_ID")
    key_secret = _env("RAZORPAY_KEY_SECRET")

    async with httpx.AsyncClient(auth=(key_id, key_secret), timeout=20) as client:
        response = await client.request(method, f"{RAZORPAY_API_BASE}{path}", json=json)

    if response.status_code >= 400:
        detail = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
        raise HTTPException(status_code=502, detail={"message": "Razorpay request failed", "razorpay": detail})
    return response.json()


def _apply_subscription_state(user: User, subscription: dict[str, Any]) -> None:
    user.razorpay_customer_id = subscription.get("customer_id") or user.razorpay_customer_id
    user.razorpay_subscription_id = subscription.get("id") or user.razorpay_subscription_id
    user.subscription_tier = "pro"
    user.subscription_status = subscription.get("status", "authenticated")
    user.is_premium = subscription.get("status") in {"authenticated", "active", "pending"}


@router.get("/plans")
def list_plans(current_user: User = Depends(get_current_user)):
    plan = _billing_plan("pro_monthly")
    return {
        "plans": [
            {
                "code": plan.code,
                "name": plan.name,
                "description": plan.description,
                "amount": plan.amount,
                "currency": plan.currency,
                "interval": "monthly",
            }
        ],
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
    plan = _billing_plan(payload.plan_code)
    key_id = _env("RAZORPAY_KEY_ID")

    if current_user.subscription_tier == "pro" and current_user.subscription_status in {"authenticated", "active", "pending"}:
        raise HTTPException(status_code=400, detail="Pro subscription is already active or awaiting activation")

    subscription = await _razorpay_request(
        "POST",
        "/subscriptions",
        json={
            "plan_id": plan.plan_id,
            "total_count": plan.total_count,
            "quantity": 1,
            "customer_notify": True,
            "notes": {
                "product": "govplot_pro",
                "user_email": current_user.email,
                "plan_code": plan.code,
            },
        },
    )

    return SubscriptionStartResponse(
        subscription_id=subscription["id"],
        checkout_key=key_id,
        plan_code=plan.code,
        amount=plan.amount,
        currency=plan.currency,
        name=plan.name,
        description=plan.description,
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
    signed_value = f"{payload.razorpay_payment_id}|{payload.razorpay_subscription_id}".encode("utf-8")
    generated_signature = hmac.new(
        key_secret.encode("utf-8"),
        signed_value,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(generated_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid Razorpay signature")

    subscription = await _razorpay_request("GET", f"/subscriptions/{payload.razorpay_subscription_id}")
    _apply_subscription_state(current_user, subscription)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Pro subscription verified",
        "subscription_id": current_user.razorpay_subscription_id,
        "subscription_status": current_user.subscription_status,
        "is_premium": current_user.is_premium,
    }
