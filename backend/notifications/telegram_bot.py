"""
GovPlot Tracker — Telegram bot entrypoint for account linking.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from backend.models.database import SessionLocal, init_db
from backend.models.db_models import User

logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.effective_chat or not update.effective_user or not update.message:
        return

    args = context.args or []
    if not args:
        await update.message.reply_text(
            "Welcome to GovPlot Tracker. Open the website, sign in, and tap Connect Telegram to link your alerts."
        )
        return

    payload = args[0]
    if not payload.startswith("link_"):
        await update.message.reply_text("That link looks invalid. Please request a fresh Telegram link from GovPlot Tracker.")
        return

    token = payload.removeprefix("link_")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_link_token == token).first()
        if not user or not user.telegram_link_expires_at or user.telegram_link_expires_at < datetime.utcnow():
            await update.message.reply_text("This link has expired. Please generate a new Telegram link from your GovPlot account.")
            return

        user.telegram_chat_id = str(update.effective_chat.id)
        user.telegram_username = update.effective_user.username
        user.telegram_link_token = None
        user.telegram_link_expires_at = None
        db.add(user)
        db.commit()
        await update.message.reply_text(
            f"Telegram alerts are now linked to {user.email}. You can subscribe to GovPlot alerts from the website."
        )
    finally:
        db.close()


async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.effective_chat or not update.message:
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_chat_id == str(update.effective_chat.id)).first()
        if not user:
            await update.message.reply_text("This Telegram chat is not linked yet. Open GovPlot Tracker and tap Connect Telegram first.")
            return

        await update.message.reply_text(
            f"Linked to {user.email}. Tier: {user.subscription_tier}. Telegram username: @{user.telegram_username or 'not-set'}"
        )
    finally:
        db.close()


def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is required")

    init_db()
    application = Application.builder().token(token).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("status", status))
    logger.info("Starting GovPlot Tracker Telegram bot")
    application.run_polling()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
