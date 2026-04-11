"""
GovPlot Tracker — City Scraper Base Helper
==========================================
Shared parsing logic used by all 20 city scrapers.
Each city imports this and overrides only what's different.
"""

from __future__ import annotations
import re
from datetime import datetime, timezone
from typing import Optional

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme, make_scheme_id
from scraper.cities.static_schemes import get_schemes_for_city


class CityScraperMixin:
    """
    Mixin providing shared fallback_schemes() loader and
    common HTML parsing helpers for all 20 city scrapers.
    """

    def _load_static_fallback(self, city: str, base_url: str, authority: str) -> list[SchemeData]:
        """Load static schemes from static_schemes.py for this city."""
        raw = get_schemes_for_city(city)
        result = []
        for s in raw:
            result.append(SchemeData(
                scheme_id=s["scheme_id"],
                name=s["name"],
                city=s["city"],
                authority=s.get("authority", authority),
                status=s["status"],
                open_date=s.get("open_date"),
                close_date=s.get("close_date"),
                total_plots=s.get("total_plots"),
                price_min=s.get("price_min"),
                price_max=s.get("price_max"),
                area_sqft_min=s.get("area_sqft_min"),
                area_sqft_max=s.get("area_sqft_max"),
                location_details=s.get("location_details"),
                apply_url=s.get("apply_url", base_url),
                source_url=s.get("source_url", base_url),
                data_source="STATIC",
                scraper_status="fallback",
            ))
        return result

    def _parse_aggregator_generic(
        self, soup, source_url: str,
        authority: str, city: str, base_url: str,
        location_hint: str = "",
    ) -> list[SchemeData]:
        """
        Generic aggregator page parser.
        Looks for scheme names in headings within article/post content.
        """
        if not soup:
            return []
        schemes = []
        content_blocks = (
            soup.select("article, .post-content, .entry-content, main, .blog-content")
            or soup.select("section, div.content")
        )
        for block in content_blocks:
            text = block.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential", "lottery", "scheme", "authority")):
                continue
            if any(k in text.lower() for k in ("e-auction", "commercial", "industrial")):
                continue
            for heading in block.select("h1, h2, h3, h4"):
                h = heading.get_text(strip=True)
                if len(h) < 15:
                    continue
                if not any(k in h.lower() for k in ("plot", "residential", "lottery", "scheme")):
                    continue
                if any(k in h.lower() for k in ("e-auction", "lig", "ews", "flat")):
                    continue
                name = h if h.upper().startswith(authority) else f"{authority} {h}"
                if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                    name = f"{name} {datetime.now(timezone.utc).year}"
                # Try to detect close date from nearby text
                heading_idx = text.find(h)
                nearby = text[max(0, heading_idx - 100):heading_idx + 500]
                close_d = None
                for pattern in [
                    r"(?:last date|closing|deadline)[^\d]{0,20}(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
                    r"(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+20\d{2})",
                ]:
                    m = re.search(pattern, nearby, re.IGNORECASE)
                    if m:
                        from scraper.base_scraper import BaseScraper as BS
                        close_d = BS.parse_date(m.group(1))
                        break
                plots = None
                pm = re.search(r"(\d[\d,]+)\s*(?:plot|site|unit)", nearby, re.IGNORECASE)
                if pm:
                    plots = int(pm.group(1).replace(",", ""))
                status = "UPCOMING"
                if any(k in text.lower() for k in ("apply now", "now open", "last date")):
                    status = "OPEN"
                schemes.append(make_scheme(
                    authority, city, name, status, source_url,
                    data_source="LIVE", apply_url=base_url,
                    close_date=close_d, total_plots=plots,
                    location_details=location_hint or city,
                ))
                break
        return schemes
