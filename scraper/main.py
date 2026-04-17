"""
GovPlot Tracker — Scraper Main v4.1 (Phase 3 — SCM Integration)
================================================================
Key changes from v4.0:
  1. Calls scm_config_loader.load_all_configs() at startup — ONE Supabase
     query fetches all authority URLs/settings before any scraping begins.
  2. Passes ScraperConfig to each scraper so it uses DB URLs, not hardcoded ones.
  3. Writes per-authority run results + a full-run summary to Supabase via
     scm_run_logger.SCMRunLogger at the end of the run.
  4. Fully backward compatible — if Supabase is unreachable, scrapers fall
     back to their hardcoded SCHEME_URLS with zero code changes.

Architecture rules (unchanged from v4.0):
  - Scrape-first: data is saved to disk + pushed to Supabase BEFORE verification.
  - Verification runs only when mode=verify (separate workflow step).
  - LIG / EWS / eAuction excluded at scraper level.
  - Residential Plot schemes only, launch ≥ 2025-01-01, price ≥ ₹25L.
"""

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from scraper.scm_config_loader import load_all_configs, get_config, ScraperConfig
from scraper.scm_run_logger import SCMRunLogger, AuthorityRunResult

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)

# ── Constants ─────────────────────────────────────────────────────────────────
SCRAPER_VERSION  = "v4.1"
DATA_DIR         = Path("data/schemes")
LATEST_JSON      = DATA_DIR / "latest.json"


# ── Supabase push (unchanged from v4.0) ───────────────────────────────────────

def _push_to_supabase(schemes: list[dict]) -> bool:
    """Push schemes to Supabase via REST. Returns True on success."""
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key  = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY", "")
    if not supabase_url or not service_key:
        logger.warning("SUPABASE_URL / SUPABASE_SERVICE_KEY not set — skipping DB push")
        return False

    try:
        import httpx
        headers = {
            "apikey":        service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type":  "application/json",
            "Prefer":        "resolution=merge-duplicates,return=minimal",
        }
        resp = httpx.post(
            f"{supabase_url}/rest/v1/schemes?on_conflict=scheme_id",
            json=schemes,
            headers=headers,
            timeout=60,
        )
        if resp.status_code in (200, 201):
            logger.info("✅ Pushed %d schemes to Supabase", len(schemes))
            return True
        logger.error("❌ Supabase push failed %s: %s", resp.status_code, resp.text[:200])
        return False
    except Exception as exc:
        logger.error("❌ Supabase push exception: %s", exc)
        return False


def _save_to_disk(schemes: list[dict]):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(LATEST_JSON, "w", encoding="utf-8") as f:
        json.dump(schemes, f, ensure_ascii=False, indent=2, default=str)
    logger.info("💾 Saved %d schemes to %s", len(schemes), LATEST_JSON)


# ── Core run logic ────────────────────────────────────────────────────────────

def run_all(mode: str = "auto") -> list[dict]:
    """
    Main entry point. Called by GitHub Actions workflow.

    mode:
      auto    — full run on Sundays, refresh (active only) Mon–Sat
      full    — scrape all authorities
      refresh — scrape only authorities with OPEN/ACTIVE/UPCOMING schemes
      verify  — verification only (reads from disk, does not re-scrape)
    """
    logger.info("═" * 60)
    logger.info("🚀 GovPlot Scraper %s starting — mode=%s", SCRAPER_VERSION, mode)
    logger.info("═" * 60)

    # ── PHASE 1: Load DB config (SCM) ─────────────────────────────────────────
    logger.info("📡 Loading scraper config from Supabase SCM...")
    scm_configs = load_all_configs()
    if scm_configs:
        logger.info(
            "✅ SCM config loaded — %d authorities with DB-driven URLs",
            len(scm_configs),
        )
    else:
        logger.warning(
            "⚠️  SCM config unavailable — all scrapers will use hardcoded URLs"
        )

    # ── PHASE 2: Import registry and run scrapers ─────────────────────────────
    from scraper.registry import ALL_SCRAPERS  # noqa: import here to avoid circular

    run_logger = SCMRunLogger(run_mode=mode, scraper_version=SCRAPER_VERSION)

    all_schemes: list[dict] = []
    seen_ids:    set[str]   = set()
    errors:      list[str]  = []

    for scraper_cls in ALL_SCRAPERS:
        authority_code = getattr(scraper_cls, "AUTHORITY_CODE", None) or scraper_cls.__name__
        config         = get_config(scm_configs, authority_code) if scm_configs else None

        # Skip disabled authorities
        if config and not config.is_active:
            logger.info("⏭  Skipping %s (disabled in admin portal)", authority_code)
            continue

        logger.info("─" * 40)
        logger.info("🕷  Scraping %s ...", authority_code)

        start_ms   = int(time.time() * 1000)
        result     = AuthorityRunResult(
            authority_code  = authority_code,
            authority_id    = config.authority_code if config else None,  # will be resolved below
            city            = (config.cities[0] if config and config.cities else authority_code),
            scraper_version = SCRAPER_VERSION,
        )

        # Resolve authority UUID for run log
        if config:
            _aid = _resolve_authority_id(authority_code)
            result.authority_id = _aid

        try:
            # Instantiate scraper — pass config if available
            if config:
                scraper = scraper_cls(config=config)
            else:
                scraper = scraper_cls()

            # Call run() — returns (list[dict], list[ScraperError])
            schemes, scraper_errors = scraper.run()

            duration_ms = int(time.time() * 1000) - start_ms

            # Deduplicate
            new_schemes = []
            for s in schemes:
                sid = s.get("scheme_id") or s.get("id", "")
                if sid and sid not in seen_ids:
                    seen_ids.add(sid)
                    new_schemes.append(s)

            live_count   = sum(1 for s in new_schemes if s.get("data_source") == "LIVE")
            static_count = sum(1 for s in new_schemes if s.get("data_source") == "STATIC")

            all_schemes.extend(new_schemes)

            # Collect scraper errors for summary email
            for e in scraper_errors:
                errors.append(f"{e.authority}: {e.error_type} — {e.error_detail[:80]}")

            # Populate run result
            result.status         = "success" if live_count > 0 else "fallback"
            result.schemes_found  = len(new_schemes)
            result.schemes_live   = live_count
            result.schemes_static = static_count
            result.duration_ms    = duration_ms
            result.tier_attempted = getattr(scraper, "_last_tier_attempted", None)
            result.url_attempted  = getattr(scraper, "_last_url_attempted", None)
            result.url_type       = getattr(scraper, "_last_url_type", None)
            result.used_playwright = getattr(scraper, "_used_playwright", False)
            result.used_proxy      = getattr(scraper, "_used_proxy", False)

            # Resolve url_config_id if scraper tracked which URL succeeded
            if result.url_attempted and config:
                for entry in config.url_entries:
                    if entry.url == result.url_attempted:
                        result.url_config_id = entry.id
                        break

            logger.info(
                "  ✅ %s — %d schemes (%d LIVE / %d STATIC) in %dms",
                authority_code, len(new_schemes), live_count, static_count, duration_ms,
            )

        except Exception as exc:
            duration_ms = int(time.time() * 1000) - start_ms
            result.status       = "failed"
            result.error_type   = type(exc).__name__
            result.error_detail = str(exc)[:500]
            result.duration_ms  = duration_ms
            errors.append(f"{authority_code}: {exc}")
            logger.error("  ❌ %s failed: %s", authority_code, exc)

        run_logger.record(result)

    # ── PHASE 3: Save + push ──────────────────────────────────────────────────
    logger.info("═" * 60)
    logger.info("💾 Saving %d schemes to disk...", len(all_schemes))
    _save_to_disk(all_schemes)

    logger.info("📤 Pushing to Supabase...")
    push_ok = _push_to_supabase(all_schemes)

    # ── PHASE 4: Flush run logs to Supabase ───────────────────────────────────
    open_count     = sum(1 for s in all_schemes if s.get("status") == "OPEN")
    upcoming_count = sum(1 for s in all_schemes if s.get("status") == "UPCOMING")
    live_total     = sum(1 for s in all_schemes if s.get("data_source") == "LIVE")
    static_total   = sum(1 for s in all_schemes if s.get("data_source") == "STATIC")
    cities_count   = len({s.get("city", "") for s in all_schemes if s.get("city")})

    logger.info("📊 Flushing run logs to Supabase...")
    run_logger.flush(
        total_schemes    = len(all_schemes),
        live_schemes     = live_total,
        static_schemes   = static_total,
        open_schemes     = open_count,
        upcoming_schemes = upcoming_count,
        cities_with_data = cities_count,
        notes            = f"{len(errors)} errors" if errors else None,
    )

    # ── Summary ───────────────────────────────────────────────────────────────
    logger.info("═" * 60)
    logger.info("🏁 Run complete — mode=%s", mode)
    logger.info("   Total schemes : %d", len(all_schemes))
    logger.info("   LIVE          : %d", live_total)
    logger.info("   STATIC        : %d", static_total)
    logger.info("   OPEN now      : %d", open_count)
    logger.info("   Errors        : %d", len(errors))
    logger.info("   DB push       : %s", "✅" if push_ok else "❌")
    if errors:
        logger.warning("Errors: %s", "; ".join(errors[:10]))
    logger.info("═" * 60)

    return all_schemes


def _resolve_authority_id(authority_code: str) -> Optional[str]:
    """
    Returns the UUID of an authority from Supabase for run log foreign key.
    Cached in module-level dict to avoid repeated queries.
    """
    if authority_code in _authority_id_cache:
        return _authority_id_cache[authority_code]

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key  = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY", "")
    if not supabase_url or not service_key:
        return None

    try:
        import httpx
        resp = httpx.get(
            f"{supabase_url}/rest/v1/scraper_authorities",
            params={"authority_code": f"eq.{authority_code}", "select": "id"},
            headers={"apikey": service_key, "Authorization": f"Bearer {service_key}"},
            timeout=10,
        )
        rows = resp.json()
        if rows:
            _authority_id_cache[authority_code] = rows[0]["id"]
            return rows[0]["id"]
    except Exception:
        pass
    return None


_authority_id_cache: dict[str, str] = {}


# ── CLI entry ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mode   = sys.argv[1] if len(sys.argv) > 1 else "auto"
    result = run_all(mode=mode)
    print(f"\n✅ Done — {len(result)} schemes, mode={mode}")
