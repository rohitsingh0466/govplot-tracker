"""
GovPlot Tracker — Scraper Orchestrator v3.1
============================================
Modes: full | refresh | auto

ARCHITECTURE:
  full   (Sunday)  → Run all 58 scrapers → upsert ALL into Supabase →
                     save latest.json to git
  refresh (Mon-Sat) → Re-check OPEN + UPCOMING schemes in Supabase only →
                      update their status in Supabase (CLOSED if past) →
                      save updated latest.json to git

SUPABASE PUSH RULES:
  - Full pull: INSERT new scheme_ids; UPDATE existing scheme_ids
  - Refresh:   UPDATE existing OPEN/UPCOMING schemes only (no new inserts)
  - Never DELETE any record from Supabase
  - Schemes with null close_date are included (marked as NA, refreshed daily)

FILTERING:
  - close_date >= (today - 365 days), OR close_date is null
  - price_min >= 25.0 (or unknown)
  - No eAuction / LIG / EWS schemes
  - Residential Plot lottery schemes only
  - Scheme name format: "Authority Name + Scheme Name + Year of Launch"
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

from scraper.cities.all_cities import ALL_SCRAPERS

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

OUTPUT_DIR = Path("data/schemes")
MIN_PRICE_LAKH = 25.0
ACTIVE_STATUS = {"OPEN", "UPCOMING"}


# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------

def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def _cutoff_date() -> str:
    """One year ago from today."""
    return (datetime.now(timezone.utc) - timedelta(days=365)).strftime("%Y-%m-%d")

def _is_weekly_run() -> bool:
    return (
        os.getenv("GOVPLOT_FORCE_FULL", "").strip() == "1"
        or datetime.now(timezone.utc).weekday() == 6  # Sunday
    )


# ---------------------------------------------------------------------------
# Status recalculation from real dates
# ---------------------------------------------------------------------------

def _recalc_status(scheme: dict) -> dict:
    """
    Derive the correct status from open_date and close_date.
    Null close_date → keep current status (refreshed daily).
    """
    today = _today()
    od = scheme.get("open_date") or ""
    cd = scheme.get("close_date") or ""

    if not cd:
        # No close_date — keep as UPCOMING if open_date is in future,
        # else mark OPEN. Refresh will update when we know more.
        if od and od > today:
            scheme["status"] = "UPCOMING"
        elif od and od <= today:
            scheme["status"] = "OPEN"
        # else leave status as-is
        return scheme

    if cd < today:
        scheme["status"] = "CLOSED"
    elif od and od > today:
        scheme["status"] = "UPCOMING"
    elif od and od <= today and cd >= today:
        scheme["status"] = "OPEN"
    elif not od and cd >= today:
        scheme["status"] = "ACTIVE"

    return scheme


def _is_valid_scheme(scheme: dict) -> bool:
    """
    Filter:
    1. close_date must be within last 365 days OR null
    2. price_min >= 25.0 (or 0/null = unknown, allow through)
    """
    cd = scheme.get("close_date") or ""
    price_min = scheme.get("price_min") or 0.0

    if cd and cd < _cutoff_date():
        return False
    if price_min > 0 and price_min < MIN_PRICE_LAKH:
        return False
    return True


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def _load_existing_json() -> dict[str, dict]:
    """Load latest.json as {scheme_id: scheme_dict}."""
    p = OUTPUT_DIR / "latest.json"
    if p.exists():
        try:
            data = json.loads(p.read_text())
            return {s["scheme_id"]: s for s in data if isinstance(s, dict)}
        except Exception:
            pass
    return {}


def _save_to_disk(schemes: list[dict]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    payload = json.dumps(schemes, ensure_ascii=False, indent=2)
    (OUTPUT_DIR / f"schemes_{ts}.json").write_text(payload)
    (OUTPUT_DIR / "latest.json").write_text(payload)
    logger.info(f"📁 {len(schemes)} schemes saved → data/schemes/latest.json")


# ---------------------------------------------------------------------------
# Supabase operations
# ---------------------------------------------------------------------------

def _get_supabase_client():
    """Return a configured Supabase client or None if not configured."""
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY", "")

    if not supabase_url or not supabase_key:
        logger.warning("⚠️  SUPABASE_URL or SUPABASE_SERVICE_KEY not set — skipping DB push")
        return None

    try:
        from supabase import create_client, Client
        client: Client = create_client(supabase_url, supabase_key)
        logger.info("✅ Supabase client connected")
        return client
    except Exception as e:
        logger.error(f"❌ Failed to create Supabase client: {e}")
        return None


def _fetch_supabase_active_schemes(client) -> list[dict]:
    """
    Fetch all OPEN and UPCOMING schemes from Supabase.
    Used by refresh mode to know which schemes to re-check.
    """
    try:
        result = (
            client.table("schemes")
            .select("scheme_id, status, open_date, close_date, authority, city")
            .in_("status", ["OPEN", "UPCOMING"])
            .execute()
        )
        return result.data or []
    except Exception as e:
        logger.error(f"❌ Failed to fetch active schemes from Supabase: {e}")
        return []


def _upsert_to_supabase(client, schemes: list[dict], mode: str = "full") -> dict:
    """
    Upsert schemes into Supabase.

    Full mode:  INSERT new + UPDATE existing (upsert on scheme_id)
    Refresh mode: UPDATE existing OPEN/UPCOMING schemes only (no new inserts)

    Returns counts: {upserted, skipped, failed}
    """
    if not client or not schemes:
        return {"upserted": 0, "skipped": 0, "failed": 0}

    upserted = 0
    skipped = 0
    failed = 0

    # Prepare records — ensure last_updated is set
    now_iso = datetime.now(timezone.utc).isoformat()
    records = []
    for s in schemes:
        record = {
            "scheme_id":        s.get("scheme_id"),
            "name":             s.get("name"),
            "city":             s.get("city"),
            "authority":        s.get("authority"),
            "status":           s.get("status"),
            "open_date":        s.get("open_date") or None,
            "close_date":       s.get("close_date") or None,
            "total_plots":      s.get("total_plots"),
            "price_min":        s.get("price_min"),
            "price_max":        s.get("price_max"),
            "area_sqft_min":    s.get("area_sqft_min"),
            "area_sqft_max":    s.get("area_sqft_max"),
            "location_details": s.get("location_details"),
            "apply_url":        s.get("apply_url"),
            "source_url":       s.get("source_url"),
            "last_updated":     now_iso,
            "is_active":        True,
        }
        records.append(record)

    if mode == "refresh":
        # In refresh mode: UPDATE only — no new inserts
        # We update one at a time to avoid inserting new records
        for record in records:
            try:
                sid = record["scheme_id"]
                result = (
                    client.table("schemes")
                    .update({
                        "status":       record["status"],
                        "last_updated": record["last_updated"],
                        "open_date":    record["open_date"],
                        "close_date":   record["close_date"],
                    })
                    .eq("scheme_id", sid)
                    .execute()
                )
                if result.data:
                    upserted += 1
                else:
                    skipped += 1  # Scheme not in DB yet — skip in refresh mode
            except Exception as e:
                logger.error(f"❌ Refresh update failed for {record['scheme_id']}: {e}")
                failed += 1
    else:
        # Full mode: upsert in batches of 50
        batch_size = 50
        for i in range(0, len(records), batch_size):
            batch = records[i: i + batch_size]
            try:
                result = (
                    client.table("schemes")
                    .upsert(batch, on_conflict="scheme_id")
                    .execute()
                )
                upserted += len(batch)
                logger.info(f"   ↑ Upserted batch {i // batch_size + 1}: {len(batch)} records")
            except Exception as e:
                logger.error(f"❌ Batch upsert failed (batch {i // batch_size + 1}): {e}")
                failed += len(batch)

    logger.info(
        f"📊 Supabase [{mode}]: upserted={upserted}, skipped={skipped}, failed={failed}"
    )
    return {"upserted": upserted, "skipped": skipped, "failed": failed}


# ---------------------------------------------------------------------------
# Refresh logic — re-check status of OPEN/UPCOMING in Supabase
# ---------------------------------------------------------------------------

def _run_refresh(client, existing_json: dict[str, dict]) -> list[dict]:
    """
    Refresh mode:
    1. Fetch OPEN + UPCOMING schemes from Supabase
    2. Recalculate their status based on today's date
    3. Update changed statuses in Supabase
    4. Merge with all other schemes from latest.json
    Returns the full updated scheme list for saving to disk.
    """
    if not client:
        logger.warning("No Supabase client — refresh skipped, returning cached data")
        return list(existing_json.values())

    active_schemes = _fetch_supabase_active_schemes(client)
    logger.info(f"🔄 Refresh: found {len(active_schemes)} OPEN/UPCOMING schemes in Supabase")

    updated_count = 0
    changed_schemes = []

    for db_scheme in active_schemes:
        sid = db_scheme.get("scheme_id")
        old_status = db_scheme.get("status")

        # Build a minimal scheme dict for recalculation
        scheme_for_recalc = {
            "scheme_id":  sid,
            "status":     old_status,
            "open_date":  db_scheme.get("open_date"),
            "close_date": db_scheme.get("close_date"),
        }

        updated = _recalc_status(scheme_for_recalc)
        new_status = updated["status"]

        if new_status != old_status:
            logger.info(
                f"   📋 Status change: {sid} → {old_status} → {new_status} "
                f"(close={db_scheme.get('close_date')})"
            )
            changed_schemes.append({
                "scheme_id":  sid,
                "status":     new_status,
                "open_date":  db_scheme.get("open_date"),
                "close_date": db_scheme.get("close_date"),
            })
            updated_count += 1

            # Update in-memory json cache too
            if sid in existing_json:
                existing_json[sid]["status"] = new_status

    # Push changed statuses to Supabase
    if changed_schemes:
        _upsert_to_supabase(client, changed_schemes, mode="refresh")
        logger.info(f"✅ Refresh: updated {updated_count} scheme statuses in Supabase")
    else:
        logger.info("✅ Refresh: no status changes detected")

    return list(existing_json.values())


# ---------------------------------------------------------------------------
# Full pull logic
# ---------------------------------------------------------------------------

def _run_full(client) -> list[dict]:
    """
    Full mode:
    1. Run all 58 scrapers
    2. Filter and recalculate statuses
    3. Upsert all into Supabase
    4. Return the scheme list for saving to disk
    """
    all_schemes: list[dict] = []
    errors: list[dict] = []

    for SC in ALL_SCRAPERS:
        sc = SC()
        try:
            raw_results = sc.run()
            valid = []
            for r in raw_results:
                r = _recalc_status(r)
                if _is_valid_scheme(r):
                    valid.append(r)
                else:
                    logger.debug(
                        f"   ⛔ Filtered: {r.get('scheme_id')} "
                        f"(close={r.get('close_date')}, price={r.get('price_min')})"
                    )
            all_schemes.extend(valid)
            logger.info(
                f"✅ {sc.authority} ({sc.city}): "
                f"{len(valid)}/{len(raw_results)} schemes passed filters"
            )
        except Exception as e:
            errors.append({"scraper": sc.authority, "city": sc.city, "error": str(e)})
            logger.error(f"❌ {sc.authority} ({sc.city}): {e}")

    # Deduplicate by scheme_id (latest wins)
    seen: set[str] = set()
    unique: list[dict] = []
    for s in all_schemes:
        sid = s.get("scheme_id", "")
        if sid and sid not in seen:
            seen.add(sid)
            unique.append(s)

    # Upsert to Supabase
    if client:
        _upsert_to_supabase(client, unique, mode="full")

    if errors:
        logger.warning(f"⚠️  {len(errors)} scrapers had errors: "
                       f"{[e['scraper'] for e in errors]}")

    return unique


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

def run_all(mode: str = "auto") -> list[dict]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    is_full = (mode == "full") or (mode == "auto" and _is_weekly_run())
    run_mode = "full" if is_full else "refresh"

    logger.info(f"🕷️  GovPlot Scraper v3.1 — mode={mode}, run_mode={run_mode}")
    logger.info(
        f"📅 Date window: {_cutoff_date()} → today ({_today()}) "
        f"| 💰 Min price: ₹{MIN_PRICE_LAKH}L"
    )
    logger.info("🚫 Excluded types: eAuction, LIG, EWS, commercial")

    client = _get_supabase_client()
    existing_json = _load_existing_json()

    if is_full:
        result = _run_full(client)
    else:
        result = _run_refresh(client, existing_json)

    # Summary
    open_c     = sum(1 for s in result if s.get("status") == "OPEN")
    active_c   = sum(1 for s in result if s.get("status") == "ACTIVE")
    upcoming_c = sum(1 for s in result if s.get("status") == "UPCOMING")
    closed_c   = sum(1 for s in result if s.get("status") == "CLOSED")

    logger.info(f"""
╔══════════════════════════════════════════════════╗
║  GovPlot Scraper v3.1 — Run Complete            ║
╠══════════════════════════════════════════════════╣
║  Mode           : {run_mode:<29}║
║  Total schemes  : {len(result):<29}║
║  OPEN           : {open_c:<29}║
║  ACTIVE         : {active_c:<29}║
║  UPCOMING       : {upcoming_c:<29}║
║  CLOSED         : {closed_c:<29}║
╚══════════════════════════════════════════════════╝""")

    _save_to_disk(result)
    return result


if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "auto"
    result = run_all(mode=mode)
    print(f"\n✅ Done — {len(result)} schemes | mode={mode}")
