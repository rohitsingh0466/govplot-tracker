"""
GovPlot Tracker — Notification Service v3.0
Sends alerts via Email (SendGrid), WhatsApp (Twilio), Telegram Bot API.

Key fix v3.0:
  - Telegram dispatch now reads telegram_chat_id from users table (not alert_subscriptions)
  - Email uses SendGrid with proper HTML template
  - WhatsApp uses Twilio with phone from users.phone
  - All dispatches guarded: skips silently if contact info missing
  - Uses alert_dispatch_view for clean recipient resolution
"""

import logging
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Payload
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class AlertPayload:
    scheme_name: str
    city: str
    authority: str
    status: str
    apply_url: str
    open_date: str = ""
    close_date: str = ""


# ─────────────────────────────────────────────────────────────────────────────
# Email — SendGrid
# ─────────────────────────────────────────────────────────────────────────────

def send_email_alert(to_email: str, payload: AlertPayload) -> bool:
    """Send scheme alert via SendGrid. Returns True on success."""
    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("FROM_EMAIL", "alerts@govplottracker.com")

    if not api_key:
        logger.warning("SENDGRID_API_KEY not set — skipping email to %s", to_email)
        return False

    if not to_email or "@" not in to_email:
        logger.warning("Invalid email address: %s", to_email)
        return False

    status_color = "#22c55e" if payload.status in ("OPEN", "ACTIVE") else "#f59e0b"
    apply_section = (
        f'<a href="{payload.apply_url}" '
        f'style="display:inline-block;background:#0d7a68;color:white;'
        f'padding:12px 24px;border-radius:8px;text-decoration:none;'
        f'font-weight:600;margin-top:16px;">Apply Now →</a>'
        if payload.apply_url and payload.apply_url != "#"
        else '<p style="color:#666;font-size:13px;">Check the official authority website to apply.</p>'
    )

    html_content = f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#f4f8fb;padding:24px;">
      <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0d7a68,#042f26);padding:28px 32px;">
          <p style="color:#65e9d0;font-size:11px;font-weight:700;letter-spacing:2px;
                    text-transform:uppercase;margin:0 0 8px;">GovPlot Tracker Alert</p>
          <h1 style="color:white;font-size:22px;font-weight:800;margin:0;line-height:1.3;">
            🏠 {payload.scheme_name}
          </h1>
        </div>
        <!-- Body -->
        <div style="padding:28px 32px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:13px;width:40%;">City</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:13px;font-weight:600;">{payload.city}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:13px;">Authority</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:13px;font-weight:600;">{payload.authority}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:13px;">Status</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                <span style="background:{status_color};color:white;padding:3px 10px;
                             border-radius:20px;font-size:12px;font-weight:700;">
                  {payload.status}
                </span>
              </td>
            </tr>
            {f'<tr><td style="padding:10px 0;color:#666;font-size:13px;">Apply By</td><td style="padding:10px 0;color:#111;font-size:13px;font-weight:600;">{payload.close_date}</td></tr>' if payload.close_date else ''}
          </table>
          {apply_section}
        </div>
        <!-- Footer -->
        <div style="background:#f4f8fb;padding:16px 32px;border-top:1px solid #e5edf5;">
          <p style="color:#999;font-size:11px;margin:0;">
            You're receiving this because you subscribed to GovPlot Tracker alerts for {payload.city}.
            <a href="https://govplottracker.com/dashboard" style="color:#0d7a68;">Manage alerts →</a>
          </p>
        </div>
      </div>
    </div>
    """

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, To

        message = Mail(
            from_email=from_email,
            to_emails=To(to_email),
            subject=f"🏠 GovPlot Alert: {payload.scheme_name} is {payload.status} in {payload.city}",
            html_content=html_content,
        )
        sg = sendgrid.SendGridAPIClient(api_key=api_key)
        response = sg.send(message)

        if response.status_code in (200, 202):
            logger.info("✅ Email sent to %s (status %s)", to_email, response.status_code)
            return True
        else:
            logger.error("❌ Email to %s failed with status %s", to_email, response.status_code)
            return False

    except Exception as exc:
        logger.error("❌ Email send failed to %s: %s", to_email, exc)
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Telegram — Bot API
# ─────────────────────────────────────────────────────────────────────────────

def send_telegram_alert(chat_id: str, payload: AlertPayload) -> bool:
    """
    Send scheme alert via Telegram Bot API.
    chat_id must be the numeric Telegram chat ID stored in users.telegram_chat_id.
    Returns True on success.
    """
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")

    if not bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN not set — skipping Telegram alert")
        return False

    if not chat_id:
        logger.warning("No telegram_chat_id — user has not linked their Telegram account")
        return False

    apply_line = (
        f"[Apply Now →]({payload.apply_url})"
        if payload.apply_url and payload.apply_url != "#"
        else "Visit the official authority website to apply."
    )
    close_line = f"\n📅 *Apply by:* {payload.close_date}" if payload.close_date else ""

    text = (
        f"🏠 *GovPlot Alert*\n\n"
        f"*{payload.scheme_name}*\n\n"
        f"📍 *City:* {payload.city}\n"
        f"🏛 *Authority:* {payload.authority}\n"
        f"📊 *Status:* `{payload.status}`"
        f"{close_line}\n\n"
        f"{apply_line}\n\n"
        f"_Manage your alerts at govplottracker.com/dashboard_"
    )

    try:
        import httpx
        response = httpx.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "Markdown",
                "disable_web_page_preview": False,
            },
            timeout=15,
        )
        data = response.json()
        if data.get("ok"):
            logger.info("✅ Telegram sent to chat_id %s", chat_id)
            return True
        else:
            logger.error("❌ Telegram failed to chat_id %s: %s", chat_id, data.get("description"))
            return False

    except Exception as exc:
        logger.error("❌ Telegram send failed to chat_id %s: %s", chat_id, exc)
        return False


# ─────────────────────────────────────────────────────────────────────────────
# WhatsApp — Twilio
# ─────────────────────────────────────────────────────────────────────────────

def send_whatsapp_alert(phone: str, payload: AlertPayload) -> bool:
    """Send scheme alert via Twilio WhatsApp. Returns True on success."""
    account_sid  = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token   = os.getenv("TWILIO_AUTH_TOKEN")
    from_number  = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

    if not account_sid or not auth_token:
        logger.warning("Twilio not configured — skipping WhatsApp to %s", phone)
        return False

    if not phone:
        logger.warning("No phone number — skipping WhatsApp alert")
        return False

    # Normalise phone — add +91 if 10-digit Indian number
    if phone.isdigit() and len(phone) == 10:
        phone = f"+91{phone}"
    elif not phone.startswith("+"):
        phone = f"+{phone}"

    body = (
        f"🏠 *GovPlot Alert*\n"
        f"*{payload.scheme_name}*\n"
        f"📍 {payload.city} | 🏛 {payload.authority}\n"
        f"Status: *{payload.status}*\n"
        + (f"Apply by: {payload.close_date}\n" if payload.close_date else "")
        + (f"Apply: {payload.apply_url}" if payload.apply_url and payload.apply_url != "#" else "")
    )

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=body,
            from_=from_number,
            to=f"whatsapp:{phone}",
        )
        logger.info("✅ WhatsApp sent to %s (SID: %s)", phone, message.sid)
        return True

    except Exception as exc:
        logger.error("❌ WhatsApp send failed to %s: %s", phone, exc)
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Unified dispatcher
# ─────────────────────────────────────────────────────────────────────────────

def dispatch_alert(channel: str, recipient: str, payload: AlertPayload) -> bool:
    """
    Unified dispatcher — routes to the correct channel.

    Args:
        channel:   'email' | 'telegram' | 'whatsapp'
        recipient: email address | telegram_chat_id (numeric str) | phone number
        payload:   AlertPayload with scheme details

    Returns:
        True if sent successfully, False otherwise.
    """
    if not recipient:
        logger.warning("dispatch_alert: empty recipient for channel=%s — skipping", channel)
        return False

    if channel == "email":
        return send_email_alert(recipient, payload)

    elif channel == "telegram":
        # recipient must be the telegram_chat_id (numeric string) from users table
        return send_telegram_alert(recipient, payload)

    elif channel == "whatsapp":
        return send_whatsapp_alert(recipient, payload)

    else:
        logger.warning("dispatch_alert: unknown channel '%s'", channel)
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Batch dispatcher — called by the scraper after scheme status changes
# ─────────────────────────────────────────────────────────────────────────────

def dispatch_alerts_for_scheme(scheme: dict, db_session) -> dict:
    """
    Find all active alert subscriptions for a scheme's city,
    resolve recipient contact info, and dispatch.

    Uses alert_dispatch_view for clean recipient resolution.

    Args:
        scheme:     dict with keys: name, city, authority, status, apply_url, close_date
        db_session: SQLAlchemy session

    Returns:
        dict with counts: sent, skipped, failed
    """
    from sqlalchemy import text

    city = scheme.get("city", "")
    payload = AlertPayload(
        scheme_name=scheme.get("name", "Unknown Scheme"),
        city=city,
        authority=scheme.get("authority", ""),
        status=scheme.get("status", ""),
        apply_url=scheme.get("apply_url", ""),
        close_date=scheme.get("close_date", ""),
        open_date=scheme.get("open_date", ""),
    )

    # Query the dispatch view for all dispatchable alerts for this city
    rows = db_session.execute(
        text("""
            SELECT alert_id, user_email, channel, recipient,
                   is_dispatchable, blocked_reason
            FROM public.alert_dispatch_view
            WHERE (city = :city OR city IS NULL)
              AND is_dispatchable = true
        """),
        {"city": city},
    ).fetchall()

    sent    = 0
    skipped = 0
    failed  = 0

    for row in rows:
        alert_id      = row[0]
        channel       = row[2]
        recipient     = row[3]
        is_dispatchable = row[4]

        if not is_dispatchable or not recipient:
            skipped += 1
            continue

        success = dispatch_alert(channel, recipient, payload)
        if success:
            sent += 1
        else:
            failed += 1

    logger.info(
        "dispatch_alerts_for_scheme: city=%s sent=%d skipped=%d failed=%d",
        city, sent, skipped, failed,
    )
    return {"sent": sent, "skipped": skipped, "failed": failed}
