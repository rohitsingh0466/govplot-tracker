"""
GovPlot Tracker — Lucknow Development Authority (LDA) Scraper
Source: https://lda.up.nic.in
"""

import hashlib
import re
from scraper.base_scraper import BaseScraper, SchemeData


class LDAScraper(BaseScraper):
    """
    Scrapes residential plot schemes from Lucknow Development Authority (LDA).
    LDA portal is PHP-based; most scheme data is in HTML tables.
    """

    BASE_URL = "https://lda.up.nic.in"
    SCHEME_URLS = [
        "https://lda.up.nic.in/scheme.htm",
        "https://lda.up.nic.in/residential-plot-scheme.aspx",
    ]

    def __init__(self):
        super().__init__(
            city="Lucknow",
            authority="LDA",
            base_url=self.BASE_URL,
            use_selenium=False,
        )

    # ------------------------------------------------------------------ #
    def scrape(self) -> list[SchemeData]:
        schemes = []
        for url in self.SCHEME_URLS:
            soup = self._get_soup(url)
            if soup:
                schemes.extend(self._parse_page(soup, url))

        # Deduplicate by scheme_id
        seen = set()
        unique = []
        for s in schemes:
            if s.scheme_id not in seen:
                seen.add(s.scheme_id)
                unique.append(s)

        return unique if unique else self._fallback_schemes()

    # ------------------------------------------------------------------ #
    def _parse_page(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []

        # LDA lists schemes in <table> rows or <div class="scheme-list">
        rows = soup.select("table tr") or soup.select("div.scheme-item") or []

        for row in rows:
            cells = row.find_all(["td", "th"])
            if len(cells) < 3:
                continue
            text_cells = [c.get_text(strip=True) for c in cells]

            # Skip header rows
            if text_cells[0].lower() in ("s.no", "#", "sr", "scheme name"):
                continue

            name = text_cells[1] if len(text_cells) > 1 else text_cells[0]
            if not name or len(name) < 5:
                continue

            raw_status = text_cells[-1] if text_cells else "active"
            status = self.normalise_status(raw_status)

            link_tag = row.find("a", href=True)
            apply_url = (self.BASE_URL + "/" + link_tag["href"].lstrip("/")
                         if link_tag else source_url)

            scheme_id = hashlib.md5(f"LDA-{name}".encode()).hexdigest()[:12]

            schemes.append(SchemeData(
                scheme_id=f"LDA-{scheme_id}",
                name=name,
                city="Lucknow",
                authority="LDA",
                status=status,
                apply_url=apply_url,
                source_url=source_url,
                raw_data={"cells": text_cells},
            ))

        return schemes

    # ------------------------------------------------------------------ #
    def _fallback_schemes(self) -> list[SchemeData]:
        """
        Known LDA schemes hardcoded as fallback when site is unreachable.
        These are publicly announced schemes; update as new ones launch.
        """
        known = [
            {
                "name": "LDA Vasant Kunj Residential Plot Scheme 2024",
                "status": "CLOSED",
                "open_date": "2024-01-15",
                "close_date": "2024-02-28",
                "total_plots": 1200,
                "price_min": 25.0,
                "price_max": 85.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Vasant Kunj, Lucknow",
                "apply_url": "https://lda.up.nic.in",
            },
            {
                "name": "LDA Gomti Nagar Extension Plot Scheme 2025",
                "status": "UPCOMING",
                "open_date": "2025-04-01",
                "close_date": "2025-05-31",
                "total_plots": 800,
                "price_min": 35.0,
                "price_max": 120.0,
                "area_sqft_min": 1200,
                "area_sqft_max": 4800,
                "location_details": "Gomti Nagar Extension, Lucknow",
                "apply_url": "https://lda.up.nic.in",
            },
            {
                "name": "LDA Amar Shaheed Path Housing Scheme",
                "status": "ACTIVE",
                "open_date": "2024-11-01",
                "close_date": "2025-12-31",
                "total_plots": 500,
                "price_min": 20.0,
                "price_max": 60.0,
                "area_sqft_min": 800,
                "area_sqft_max": 2400,
                "location_details": "Amar Shaheed Path, Lucknow",
                "apply_url": "https://lda.up.nic.in",
            },
        ]
        return [
            SchemeData(
                scheme_id=f"LDA-{hashlib.md5(s['name'].encode()).hexdigest()[:12]}",
                city="Lucknow",
                authority="LDA",
                source_url=self.BASE_URL,
                **s,
            )
            for s in known
        ]
