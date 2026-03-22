"""
GovPlot Tracker — Scraper Orchestrator
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

SCRAPERS = [
    LDAScraper, BDAScraper, NoidaScraper, HSVPScraper, HMDAScraper,
    MHADAScraper, PMRDAScraper, GMADAScraper, ADAScraper,
]

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

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    with open(OUTPUT_DIR / f"schemes_{timestamp}.json", "w", encoding="utf-8") as f:
        json.dump(all_schemes, f, ensure_ascii=False, indent=2)

    latest_path = OUTPUT_DIR / "latest.json"
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(all_schemes, f, ensure_ascii=False, indent=2)

    logger.info(f"📁 Saved {len(all_schemes)} schemes → {latest_path}")
    if errors:
        logger.warning(f"⚠️  {len(errors)} scraper(s) had errors: {errors}")

    _push_to_supabase(all_schemes)
    return all_schemes


def _push_to_supabase(schemes: list[dict]):
    """Push to Supabase using service role key for trusted server-side writes."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        logger.info("Supabase not configured — skipping push.")
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
            timeout=60,
        )
        resp.raise_for_status()
        logger.info(f"✅ Pushed {len(schemes)} schemes to Supabase")
    except Exception as exc:
        logger.error(f"❌ Supabase push failed: {exc}")


if __name__ == "__main__":
    run_all()
