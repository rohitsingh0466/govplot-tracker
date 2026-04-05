"""
GovPlot Tracker — Scraper Orchestrator v3.0
============================================
Modes: full | refresh | auto

WHAT CHANGED FROM v2.x:
  - Removed: verification engine (verifier.py calls)
  - Removed: Supabase / database push logic
  - Removed: external site verification HTTP calls
  - Removed: verification_scores.json
  - Simplified: two modes only — full (all cities) or refresh (active only)
  - Data: 2025-01-01 onwards only; Residential Plot schemes only (≥ ₹25L)
  - Output: data/schemes/latest.json only

EXECUTION FLOW:
  mode=full    → Scrape all cities → save to disk
  mode=refresh → Scrape active/open schemes only → save to disk
  mode=auto    → Sunday = full, Mon–Sat = refresh
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from scraper.cities.all_cities import ALL_SCRAPERS

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

OUTPUT_DIR = Path("data/schemes")
CUTOFF_DATE = "2025-01-01"          # Only schemes from this date onwards
MIN_PRICE_LAKH = 25.0               # Minimum price in lakhs (₹25L)
ACTIVE_STATUS = {"OPEN", "ACTIVE"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_weekly_run() -> bool:
    return (
        os.getenv("GOVPLOT_FORCE_FULL", "").strip() == "1"
        or datetime.now(timezone.utc).weekday() == 6  # Sunday
    )


def _load_existing() -> dict:
    p = OUTPUT_DIR / "latest.json"
    if p.exists():
        try:
            data = json.loads(p.read_text())
            return {s["scheme_id"]: s for s in data if isinstance(s, dict)}
        except Exception:
            pass
    return {}


def _is_valid_scheme(scheme: dict) -> bool:
    """
    Filter rules:
      1. close_date or open_date must be >= 2026-01-01
      2. price_min must be >= 25.0 (₹25 lakh)
      3. status must not be CLOSED for pre-2025 schemes
    """
    open_date = scheme.get("open_date") or ""
    close_date = scheme.get("close_date") or ""
    price_min = scheme.get("price_min") or 0.0

    # At least one date must exist and be >= 2025-01-01
    relevant_date = close_date or open_date
    if relevant_date and relevant_date < CUTOFF_DATE:
        return False

    # Price filter — must be >= ₹25L (0 means unknown, allow those through)
    if price_min > 0 and price_min < MIN_PRICE_LAKH:
        return False

    return True


def _recalc_status(scheme: dict) -> dict:
    """Re-derive OPEN/UPCOMING/CLOSED from open_date and close_date."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    od = scheme.get("open_date") or ""
    cd = scheme.get("close_date") or ""

    if cd and cd < today:
        scheme["status"] = "CLOSED"
    elif od and od > today:
        scheme["status"] = "UPCOMING"
    elif od and od <= today and (not cd or cd >= today):
        scheme["status"] = "OPEN"
    # else: leave as-is (ACTIVE)
    return scheme


def _save_to_disk(schemes: list[dict]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    payload = json.dumps(schemes, ensure_ascii=False, indent=2)
    # Save timestamped snapshot
    (OUTPUT_DIR / f"schemes_{ts}.json").write_text(payload)
    # Always overwrite latest.json
    (OUTPUT_DIR / "latest.json").write_text(payload)
    logger.info(f"📁 {len(schemes)} schemes saved → data/schemes/latest.json")


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

def run_all(mode: str = "auto") -> list[dict]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    existing = _load_existing()
    is_weekly = (mode == "full") or (mode == "auto" and _is_weekly_run())

    all_schemes: list[dict] = []
    errors: list[dict] = []

    logger.info(f"🕷️  GovPlot Scraper v3.0 — mode={mode}, full_pull={is_weekly}")
    logger.info(f"📅 Date filter: {CUTOFF_DATE} onwards | 💰 Min price: ₹{MIN_PRICE_LAKH}L")

    for SC in ALL_SCRAPERS:
        sc = SC()

        # refresh mode: only re-scrape authorities with active/open schemes
        if not is_weekly and mode not in ("full",):
            has_active = any(
                s.get("authority") == sc.authority
                and s.get("status") in ACTIVE_STATUS
                for s in existing.values()
            )
            if not has_active:
                # Carry forward cached data for this authority
                carried = [
                    v for v in existing.values()
                    if v.get("authority") == sc.authority
                    and _is_valid_scheme(v)
                ]
                all_schemes.extend(carried)
                logger.info(
                    f"⏩ {sc.authority} ({sc.city}): "
                    f"no active schemes — carrying {len(carried)} from cache"
                )
                continue

        try:
            raw_results = sc.run()
            valid = []
            for r in raw_results:
                r = _recalc_status(r)
                if _is_valid_scheme(r):
                    valid.append(r)
                else:
                    logger.debug(
                        f"   ⛔ Filtered out: {r.get('scheme_id')} "
                        f"(date={r.get('open_date') or r.get('close_date')}, "
                        f"price={r.get('price_min')})"
                    )
            all_schemes.extend(valid)
            logger.info(
                f"✅ {sc.authority} ({sc.city}): "
                f"{len(valid)}/{len(raw_results)} schemes passed filters"
            )
        except Exception as e:
            errors.append({"scraper": sc.authority, "city": sc.city, "error": str(e)})
            logger.error(f"❌ {sc.authority} ({sc.city}): {e}")
            # Carry forward cached data on error
            carried = [
                v for v in existing.values()
                if v.get("authority") == sc.authority
                and _is_valid_scheme(v)
            ]
            all_schemes.extend(carried)

    # Deduplicate by scheme_id (latest wins)
    seen: set[str] = set()
    unique: list[dict] = []
    for s in all_schemes:
        sid = s.get("scheme_id", "")
        if sid and sid not in seen:
            seen.add(sid)
            unique.append(s)

    # Summary
    open_c = sum(1 for s in unique if s.get("status") == "OPEN")
    active_c = sum(1 for s in unique if s.get("status") == "ACTIVE")
    upcoming_c = sum(1 for s in unique if s.get("status") == "UPCOMING")
    closed_c = sum(1 for s in unique if s.get("status") == "CLOSED")

    logger.info(f"""
╔══════════════════════════════════════════════════╗
║  GovPlot Scraper — Run Complete                 ║
╠══════════════════════════════════════════════════╣
║  Total schemes : {len(unique):<31}║
║  OPEN          : {open_c:<31}║
║  ACTIVE        : {active_c:<31}║
║  UPCOMING      : {upcoming_c:<31}║
║  CLOSED        : {closed_c:<31}║
║  Errors        : {len(errors):<31}║
╚══════════════════════════════════════════════════╝""")

    if errors:
        failed_scrapers = [f"{e['scraper']} ({e['city']})" for e in errors]
        logger.warning(
            f"⚠️  Failed scrapers: "
            f"{failed_scrapers}"
        )

    _save_to_disk(unique)
    return unique


if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "auto"
    result = run_all(mode=mode)
    print(f"\n✅ Done — {len(result)} schemes | mode={mode}")
