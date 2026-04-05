"""
GovPlot Tracker — Scraper Orchestrator v3.2
============================================
Modes: full | refresh | auto

IMPORTS: Uses scraper.registry.ALL_SCRAPERS (NOT all_cities.py — deleted)

FULL PULL (Sunday):
  - Runs all scrapers in ALL_SCRAPERS registry
  - Live HTTP/Selenium first, fallback to static data if live fails
  - Records LIVE vs STATIC per scheme (data_source column)
  - Upserts all into Supabase (INSERT new + UPDATE existing on scheme_id conflict)
  - Sends one failure summary email via SendGrid if any scrapers fell back to STATIC
  - Saves latest.json to git

REFRESH (Mon-Sat):
  - Fetches only OPEN + UPCOMING schemes from Supabase
  - Recalculates status from today's date vs open/close dates
  - Updates changed statuses in Supabase (no new inserts)
  - Saves updated latest.json

FAILURE ALERT EMAIL:
  - To: rohit0904singh@gmail.com
  - One summary per run listing all scrapers that fell back to STATIC data
  - Includes: authority, city, URL, error type, detail, timestamp
  - Styled HTML email with action items
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── CRITICAL: Use registry.py — all_cities.py has been deleted ────────────
from scraper.registry import ALL_SCRAPERS
from scraper.base_scraper import ScraperError

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

OUTPUT_DIR     = Path("data/schemes")
MIN_PRICE_LAKH = 25.0
ALERT_EMAIL    = "rohit0904singh@gmail.com"


# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------

def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def _cutoff_date() -> str:
    return (datetime.now(timezone.utc) - timedelta(days=365)).strftime("%Y-%m-%d")

def _is_weekly_run() -> bool:
    return (
        os.getenv("GOVPLOT_FORCE_FULL", "").strip() == "1"
        or datetime.now(timezone.utc).weekday() == 6
    )


# ---------------------------------------------------------------------------
# Status recalculation
# ---------------------------------------------------------------------------

def _recalc_status(scheme: dict) -> dict:
    today = _today()
    od    = scheme.get("open_date") or ""
    cd    = scheme.get("close_date") or ""
    if not cd:
        scheme["status"] = "UPCOMING" if (od and od > today) else "OPEN" if od else scheme.get("status", "UPCOMING")
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


def _is_valid(scheme: dict) -> bool:
    cd        = scheme.get("close_date") or ""
    price_min = scheme.get("price_min") or 0.0
    if cd and cd < _cutoff_date():
        return False
    if price_min > 0 and price_min < MIN_PRICE_LAKH:
        return False
    return True


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def _load_json() -> dict[str, dict]:
    p = OUTPUT_DIR / "latest.json"
    if p.exists():
        try:
            return {s["scheme_id"]: s for s in json.loads(p.read_text()) if isinstance(s, dict)}
        except Exception:
            pass
    return {}


def _save_json(schemes: list[dict]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ts  = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    pay = json.dumps(schemes, ensure_ascii=False, indent=2)
    (OUTPUT_DIR / f"schemes_{ts}.json").write_text(pay)
    (OUTPUT_DIR / "latest.json").write_text(pay)
    logger.info(f"📁 {len(schemes)} schemes saved → data/schemes/latest.json")


# ---------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------

def _supabase_client():
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        logger.warning("⚠️  SUPABASE_URL/SUPABASE_SERVICE_KEY not set — skipping DB")
        return None
    try:
        from supabase import create_client
        client = create_client(url, key)
        logger.info("✅ Supabase connected")
        return client
    except Exception as e:
        logger.error(f"❌ Supabase error: {e}")
        return None


def _apply_migrations(client) -> None:
    """Add data_source + scraper_status columns if missing."""
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        return
    sqls = [
        "ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS data_source VARCHAR(10) DEFAULT 'STATIC'",
        "ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS scraper_status VARCHAR(20) DEFAULT 'ok'",
    ]
    try:
        import psycopg2
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        with conn.cursor() as cur:
            for sql in sqls:
                try:
                    cur.execute(sql)
                    logger.info(f"✅ Migration: {sql[:70]}")
                except Exception as e:
                    logger.debug(f"Migration skip: {e}")
        conn.close()
    except Exception as e:
        logger.debug(f"Migration unavailable (no psycopg2 / DATABASE_URL): {e}")


def _upsert_supabase(client, schemes: list[dict], mode: str) -> None:
    if not client or not schemes:
        return
    now = datetime.now(timezone.utc).isoformat()

    if mode == "refresh":
        updated = 0
        for s in schemes:
            try:
                client.table("schemes") \
                    .update({"status": s["status"], "last_updated": now,
                             "open_date": s.get("open_date"),
                             "close_date": s.get("close_date"),
                             "scraper_status": s.get("scraper_status", "ok")}) \
                    .eq("scheme_id", s["scheme_id"]).execute()
                updated += 1
            except Exception as e:
                logger.error(f"Refresh update {s['scheme_id']}: {e}")
        logger.info(f"📊 Supabase refresh: {updated} updates")
        return

    records = [{
        "scheme_id":        s["scheme_id"],
        "name":             s["name"],
        "city":             s["city"],
        "authority":        s["authority"],
        "status":           s["status"],
        "open_date":        s.get("open_date"),
        "close_date":       s.get("close_date"),
        "total_plots":      s.get("total_plots"),
        "price_min":        s.get("price_min"),
        "price_max":        s.get("price_max"),
        "area_sqft_min":    s.get("area_sqft_min"),
        "area_sqft_max":    s.get("area_sqft_max"),
        "location_details": s.get("location_details"),
        "apply_url":        s.get("apply_url"),
        "source_url":       s.get("source_url"),
        "data_source":      s.get("data_source", "STATIC"),
        "scraper_status":   s.get("scraper_status", "ok"),
        "last_updated":     now,
        "is_active":        True,
    } for s in schemes]

    upserted = failed = 0
    for i in range(0, len(records), 50):
        try:
            client.table("schemes").upsert(records[i:i+50], on_conflict="scheme_id").execute()
            upserted += len(records[i:i+50])
        except Exception as e:
            logger.error(f"Batch upsert {i//50+1}: {e}")
            failed += len(records[i:i+50])
    logger.info(f"📊 Supabase full: upserted={upserted} failed={failed}")


def _fetch_active(client) -> list[dict]:
    try:
        r = client.table("schemes") \
            .select("scheme_id,status,open_date,close_date,authority,city") \
            .in_("status", ["OPEN", "UPCOMING"]).execute()
        return r.data or []
    except Exception as e:
        logger.error(f"Fetch active: {e}")
        return []


# ---------------------------------------------------------------------------
# Failure alert email
# ---------------------------------------------------------------------------

def _send_alert(
    all_errors:       list[ScraperError],
    fallback_scrapers: list[str],
    run_mode:         str,
    total:            int,
    live_count:       int,
    static_count:     int,
) -> None:
    if not all_errors and not fallback_scrapers:
        logger.info("✅ All scrapers used LIVE data — no alert needed")
        return

    api_key    = os.getenv("SENDGRID_API_KEY", "")
    from_email = os.getenv("FROM_EMAIL", "alerts@govplottracker.com")
    if not api_key:
        logger.warning("SENDGRID_API_KEY not set — cannot send alert")
        return

    run_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    error_rows = "".join(f"""
    <tr>
      <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">{e.authority}</td>
      <td style="padding:8px;border:1px solid #e5e7eb">{e.city}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;color:#dc2626;font-weight:600">{e.error_type}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;font-size:12px;color:#64748b">{e.error_detail[:200]}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;color:#94a3b8">{e.url[:55]}...</td>
    </tr>""" for e in all_errors)

    fallback_items = "".join(
        f'<li style="margin:4px 0;color:#92400e">{s}</li>' for s in fallback_scrapers
    )

    html = f"""
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;background:#f8fafc;padding:24px">
  <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 32px;border-radius:12px 12px 0 0">
    <p style="color:#fca5a5;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">
      GovPlot Tracker · Scraper Alert
    </p>
    <h1 style="color:white;font-size:22px;font-weight:800;margin:0">
      ⚠️ Scraper Run Had Failures
    </h1>
    <p style="color:#fca5a5;font-size:13px;margin:8px 0 0">{run_time} &nbsp;|&nbsp; Mode: {run_mode.upper()}</p>
  </div>

  <div style="background:white;padding:28px 32px;border:1px solid #e2e8f0">

    <!-- Stats row -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#15803d">{total}</div>
          <div style="font-size:11px;color:#166534;font-weight:600">Total Schemes</div>
        </td>
        <td style="width:10px"></td>
        <td style="padding:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#1d4ed8">{live_count}</div>
          <div style="font-size:11px;color:#1e40af;font-weight:600">LIVE scraped</div>
        </td>
        <td style="width:10px"></td>
        <td style="padding:12px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#b45309">{static_count}</div>
          <div style="font-size:11px;color:#92400e;font-weight:600">STATIC fallback</div>
        </td>
        <td style="width:10px"></td>
        <td style="padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#dc2626">{len(all_errors)}</div>
          <div style="font-size:11px;color:#b91c1c;font-weight:600">Errors</div>
        </td>
      </tr>
    </table>

    <!-- Fallback scrapers -->
    <h2 style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 10px">
      Authorities Using Fallback Data ({len(fallback_scrapers)})
    </h2>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:22px">
      <p style="font-size:13px;color:#92400e;margin:0 0 8px">
        These portals returned 0 live results. Update their scraper files with fresh selectors or fallback data.
      </p>
      <ul style="margin:0;padding-left:18px">{fallback_items}</ul>
    </div>

    <!-- Error table -->
    <h2 style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 10px">
      Detailed Error Log ({len(all_errors)})
    </h2>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Authority</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">City</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Error Type</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Detail</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">URL</th>
          </tr>
        </thead>
        <tbody>{error_rows}</tbody>
      </table>
    </div>

    <!-- Fix guide -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-top:22px">
      <h3 style="font-size:13px;font-weight:700;color:#15803d;margin:0 0 8px">🛠 How to Fix</h3>
      <ol style="margin:0;padding-left:18px;font-size:12px;color:#166534;line-height:1.9">
        <li>Visit the failing authority URL — check if it's down or restructured</li>
        <li>Update CSS selectors in <code>scraper/cities/&lt;state&gt;.py → _parse()</code></li>
        <li>Update <code>fallback_schemes()</code> with the latest known scheme data</li>
        <li>Run: <code>python -m scraper.main full</code> to verify the fix</li>
        <li>Go to GitHub Actions → GovPlot Scraper → Run workflow to trigger manually</li>
      </ol>
    </div>
  </div>

  <div style="padding:14px 32px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;background:#f8fafc">
    <p style="color:#94a3b8;font-size:11px;margin:0">
      GovPlot Tracker Automated Alert ·
      <a href="https://govplottracker.com/dashboard" style="color:#0d7a68">Dashboard →</a>
    </p>
  </div>
</div>"""

    subject = (
        f"⚠️ GovPlot Alert: {len(fallback_scrapers)} scrapers on fallback | "
        f"{live_count} LIVE / {static_count} STATIC | {run_time}"
    )

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, To
        sg = sendgrid.SendGridAPIClient(api_key=api_key)
        resp = sg.send(Mail(
            from_email=from_email,
            to_emails=To(ALERT_EMAIL),
            subject=subject,
            html_content=html,
        ))
        if resp.status_code in (200, 202):
            logger.info(f"✅ Alert sent to {ALERT_EMAIL}")
        else:
            logger.error(f"❌ Alert send failed: HTTP {resp.status_code}")
    except Exception as e:
        logger.error(f"❌ Alert exception: {e}")


# ---------------------------------------------------------------------------
# Full pull
# ---------------------------------------------------------------------------

def _run_full(client):
    all_schemes    = []
    all_errors     = []
    fallback_names = []

    for SC in ALL_SCRAPERS:
        sc = SC()
        raw, errors = sc.run()
        all_errors.extend(errors)

        valid      = []
        used_static = False
        for r in raw:
            r = _recalc_status(r)
            if _is_valid(r):
                valid.append(r)
                if r.get("data_source") == "STATIC":
                    used_static = True

        all_schemes.extend(valid)

        if used_static or any(e.error_type == "NO_RESULTS" for e in errors
                               if e.authority == sc.authority):
            fallback_names.append(f"{sc.authority} ({sc.city})")

        icon = "🟡 STATIC" if used_static else "🟢 LIVE  "
        logger.info(f"{icon} {sc.authority} ({sc.city}): {len(valid)} schemes")

    seen   = set()
    unique = [s for s in all_schemes
              if not (s.get("scheme_id") in seen or seen.add(s.get("scheme_id")))]
    return unique, all_errors, fallback_names


# ---------------------------------------------------------------------------
# Refresh
# ---------------------------------------------------------------------------

def _run_refresh(client, cached):
    if not client:
        return list(cached.values())

    active = _fetch_active(client)
    logger.info(f"🔄 Refresh: {len(active)} OPEN/UPCOMING in Supabase")

    changed = []
    for db in active:
        sid    = db["scheme_id"]
        old    = db["status"]
        new    = _recalc_status(dict(db))["status"]
        if new != old:
            logger.info(f"   📋 {sid}: {old} → {new}")
            changed.append({**db, "status": new})
            if sid in cached:
                cached[sid]["status"] = new

    if changed:
        _upsert_supabase(client, changed, mode="refresh")
    else:
        logger.info("✅ No status changes")

    return list(cached.values())


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run_all(mode: str = "auto") -> list[dict]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    is_full  = (mode == "full") or (mode == "auto" and _is_weekly_run())
    run_mode = "full" if is_full else "refresh"

    logger.info(f"🕷️  GovPlot v3.2 — mode={mode} run_mode={run_mode}")
    logger.info(f"📅 {_cutoff_date()} → {_today()} | 💰 ≥₹{MIN_PRICE_LAKH}L | 🚫 No LIG/EWS/eAuction")

    client = _supabase_client()
    cached = _load_json()

    if is_full:
        _apply_migrations(client)
        result, all_errors, fallback_names = _run_full(client)
        live_c   = sum(1 for s in result if s.get("data_source") == "LIVE")
        static_c = sum(1 for s in result if s.get("data_source") == "STATIC")
        _upsert_supabase(client, result, mode="full")
        _send_alert(all_errors, fallback_names, run_mode, len(result), live_c, static_c)
    else:
        result   = _run_refresh(client, cached)
        live_c   = sum(1 for s in result if s.get("data_source") == "LIVE")
        static_c = sum(1 for s in result if s.get("data_source") == "STATIC")

    open_c     = sum(1 for s in result if s.get("status") == "OPEN")
    upcoming_c = sum(1 for s in result if s.get("status") == "UPCOMING")
    closed_c   = sum(1 for s in result if s.get("status") == "CLOSED")

    logger.info(f"""
╔══════════════════════════════════════════════════╗
║  GovPlot v3.2 — Complete                       ║
╠══════════════════════════════════════════════════╣
║  Mode     : {run_mode:<35}║
║  Total    : {len(result):<35}║
║  LIVE     : {live_c:<35}║
║  STATIC   : {static_c:<35}║
║  OPEN     : {open_c:<35}║
║  UPCOMING : {upcoming_c:<35}║
║  CLOSED   : {closed_c:<35}║
╚══════════════════════════════════════════════════╝""")

    _save_json(result)
    return result


if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "auto"
    result = run_all(mode=mode)
    print(f"\n✅ Done — {len(result)} schemes | mode={mode}")
