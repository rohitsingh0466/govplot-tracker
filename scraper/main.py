"""
GovPlot Tracker — Scraper Orchestrator
Runs all city scrapers, saves results to JSON and optionally to Supabase.
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path

from scraper.cities.lucknow import LDAScraper
from scraper.cities.bangalore import BDAScraper
from scraper.cities.noida import NoidaScraper
from scraper.cities.gurgaon import HSVPScraper
from scraper.cities.hyderabad import HMDAScraper
from scraper.cities.other_cities import MHADAScraper, PMRDAScraper, GMADAScraper, ADAScraper

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# ── Registry: all 9 cities ────────────────────────────────────────────────────
SCRAPERS = [
    LDAScraper,    # Lucknow
    BDAScraper,    # Bangalore
    NoidaScraper,  # Noida (GNIDA/NUDA/YEIDA)
    HSVPScraper,   # Gurgaon
    HMDAScraper,   # Hyderabad
    MHADAScraper,  # Mumbai
    PMRDAScraper,  # Pune
    GMADAScraper,  # Chandigarh
    ADAScraper,    # Agra
]
# ─────────────────────────────────────────────────────────────────────────────

OUTPUT_DIR = Path("data/schemes")


def run_all() -> list[dict]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    all_schemes = []
    errors = []

    for ScraperClass in SCRAPERS:
        scraper = ScraperClass()
        try:
            results = scraper.run()
            all_schemes.extend(results)
            logger.info(f"✅ {scraper.authority} ({scraper.city}): {len(results)} schemes")
        except Exception as exc:
            errors.append({"scraper": scraper.authority, "error": str(exc)})
            logger.error(f"❌ {scraper.authority} failed: {exc}")

    # Save per-run snapshot
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    snapshot_path = OUTPUT_DIR / f"schemes_{timestamp}.json"
    with open(snapshot_path, "w", encoding="utf-8") as f:
        json.dump(all_schemes, f, ensure_ascii=False, indent=2)

    # Always overwrite the "latest" file (used by the API)
    latest_path = OUTPUT_DIR / "latest.json"
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(all_schemes, f, ensure_ascii=False, indent=2)

    logger.info(f"📁 Saved {len(all_schemes)} schemes → {latest_path}")

    if errors:
        logger.warning(f"⚠️  {len(errors)} scrapers had errors: {errors}")

    # Push to Supabase if configured
    _push_to_supabase(all_schemes)

    return all_schemes


def _push_to_supabase(schemes: list[dict]):
    """Push scraped data to Supabase (optional — requires SUPABASE_URL + SUPABASE_KEY env vars)."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        logger.info("Supabase not configured — skipping DB push (set SUPABASE_URL + SUPABASE_KEY)")
        return

    try:
        import httpx
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        }
        resp = httpx.post(
            f"{supabase_url}/rest/v1/schemes",
            json=schemes,
            headers=headers,
            timeout=30,
        )
        resp.raise_for_status()
        logger.info(f"✅ Pushed {len(schemes)} schemes to Supabase")
    except Exception as exc:
        logger.error(f"Supabase push failed: {exc}")


if __name__ == "__main__":
    run_all()
