"""
GovPlot Tracker — Notification Service
Sends alerts via Email (SendGrid), WhatsApp (Twilio), Telegram, and Push (Firebase).
"""

import logging
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class AlertPayload:
    scheme_name: str
    city: str
    authority: str
    status: str
    apply_url: str
    open_date: str = ""
    close_date: str = ""


def send_email_alert(to_email: str, payload: AlertPayload):
    """Send scheme alert via SendGrid."""
    api_key = os.getenv("SENDGRID_API_KEY")
    if not api_key:
        logger.warning("SENDGRID_API_KEY not set — skipping email")
        return

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, To

        message = Mail(
            from_email="alerts@govplottracker.in",
            to_emails=To(to_email),
            subject=f"🏠 GovPlot Alert: {payload.scheme_name} is {payload.status}",
            html_content=f"""
            <h2>Government Plot Scheme Alert</h2>
            <p><strong>Scheme:</strong> {payload.scheme_name}</p>
            <p><strong>City:</strong> {payload.city} &nbsp;|&nbsp; <strong>Authority:</strong> {payload.authority}</p>
            <p><strong>Status:</strong> <span style="color:{'green' if payload.status=='OPEN' else 'orange'}">{payload.status}</span></p>
            <p><strong>Apply By:</strong> {payload.close_date or 'Check website'}</p>
            <a href="{payload.apply_url}" style="background:#1d4ed8;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">
              Apply Now →
            </a>
            <hr><p style="font-size:12px;color:#888">GovPlot Tracker | Unsubscribe from your dashboard</p>
            """,
        )
        sg = sendgrid.SendGridAPIClient(api_key=api_key)
        sg.send(message)
        logger.info(f"Email sent to {to_email}")
    except Exception as exc:
        logger.error(f"Email send failed: {exc}")


def send_whatsapp_alert(phone: str, payload: AlertPayload):
    """Send scheme alert via Twilio WhatsApp."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

    if not account_sid or not auth_token:
        logger.warning("Twilio not configured — skipping WhatsApp")
        return

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        body = (
            f"🏠 *GovPlot Alert*\n"
            f"*{payload.scheme_name}*\n"
            f"City: {payload.city} | Authority: {payload.authority}\n"
            f"Status: {payload.status}\n"
            f"Apply: {payload.apply_url}"
        )
        client.messages.create(body=body, from_=from_number, to=f"whatsapp:{phone}")
        logger.info(f"WhatsApp sent to {phone}")
    except Exception as exc:
        logger.error(f"WhatsApp send failed: {exc}")


def send_telegram_alert(chat_id: str, payload: AlertPayload):
    """Send scheme alert via Telegram Bot."""
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN not set — skipping Telegram")
        return

    try:
        import httpx
        text = (
            f"🏠 *GovPlot Alert*\n"
            f"*{payload.scheme_name}*\n"
            f"📍 {payload.city} | 🏛 {payload.authority}\n"
            f"Status: *{payload.status}*\n"
            f"[Apply Now]({payload.apply_url})"
        )
        httpx.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
            timeout=10,
        )
        logger.info(f"Telegram sent to {chat_id}")
    except Exception as exc:
        logger.error(f"Telegram send failed: {exc}")


def dispatch_alert(channel: str, recipient: str, payload: AlertPayload):
    """Unified dispatcher — routes to the correct channel."""
    if channel == "email":
        send_email_alert(recipient, payload)
    elif channel == "whatsapp":
        send_whatsapp_alert(recipient, payload)
    elif channel == "telegram":
        send_telegram_alert(recipient, payload)
    else:
        logger.warning(f"Unknown channel: {channel}")
