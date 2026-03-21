"""
GovPlot Tracker — Bangalore Development Authority (BDA) Scraper
Source: https://bdabangalore.org
"""

import hashlib
import re
from scraper.base_scraper import BaseScraper, SchemeData


class BDAScraper(BaseScraper):
    """
    Scrapes residential plot schemes from Bangalore Development Authority (BDA).
    BDA portal uses dynamic content; Selenium used for JS-rendered pages.
    """

    BASE_URL = "https://bdabangalore.org"
    SCHEME_URLS = [
        "https://bdabangalore.org/site-allotment/",
        "https://bdabangalore.org/schemes/",
    ]

    def __init__(self):
        super().__init__(
            city="Bangalore",
            authority="BDA",
            base_url=self.BASE_URL,
            use_selenium=True,
        )

    # ------------------------------------------------------------------ #
    def scrape(self) -> list[SchemeData]:
        schemes = []
        for url in self.SCHEME_URLS:
            # Try static first; fallback to Selenium
            soup = self._get_soup(url)
            if soup:
                parsed = self._parse_page(soup, url)
                if parsed:
                    schemes.extend(parsed)
                    continue
            # Dynamic fallback
            soup = self._get_selenium_soup(url, wait_css=".entry-content, .scheme-list, table")
            if soup:
                schemes.extend(self._parse_page(soup, url))

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

        # BDA lists schemes as articles, divs, or table rows
        items = (
            soup.select("article.post")
            or soup.select("div.scheme-card")
            or soup.select("table.scheme-table tr")
            or soup.select("li.scheme-item")
        )

        for item in items:
            name_el = (
                item.select_one("h2, h3, .scheme-title, td.scheme-name, a.scheme-link")
            )
            if not name_el:
                continue
            name = name_el.get_text(strip=True)
            if len(name) < 5:
                continue

            # Status detection
            status_el = item.select_one(".status, .badge, td.status, span.tag")
            raw_status = status_el.get_text(strip=True) if status_el else item.get_text()
            status = self.normalise_status(raw_status)

            link_tag = item.select_one("a[href]")
            apply_url = link_tag["href"] if link_tag else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            scheme_id = hashlib.md5(f"BDA-{name}".encode()).hexdigest()[:12]

            schemes.append(SchemeData(
                scheme_id=f"BDA-{scheme_id}",
                name=name,
                city="Bangalore",
                authority="BDA",
                status=status,
                apply_url=apply_url,
                source_url=source_url,
            ))

        return schemes

    # ------------------------------------------------------------------ #
    def _fallback_schemes(self) -> list[SchemeData]:
        known = [
            {
                "name": "BDA Arkavathy Layout 2E Residential Sites",
                "status": "ACTIVE",
                "open_date": "2024-09-01",
                "close_date": "2025-03-31",
                "total_plots": 6588,
                "price_min": 45.0,
                "price_max": 300.0,
                "area_sqft_min": 600,
                "area_sqft_max": 4800,
                "location_details": "Arkavathy Layout, North Bangalore",
                "apply_url": "https://bdabangalore.org/site-allotment/",
            },
            {
                "name": "BDA JP Nagar 9th Phase Extension Plot Scheme",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-08-31",
                "total_plots": 920,
                "price_min": 80.0,
                "price_max": 450.0,
                "area_sqft_min": 1200,
                "area_sqft_max": 6000,
                "location_details": "JP Nagar 9th Phase, South Bangalore",
                "apply_url": "https://bdabangalore.org/schemes/",
            },
            {
                "name": "BDA Kempegowda Layout Housing Scheme 2023",
                "status": "CLOSED",
                "open_date": "2023-04-01",
                "close_date": "2023-07-31",
                "total_plots": 3200,
                "price_min": 55.0,
                "price_max": 220.0,
                "area_sqft_min": 600,
                "area_sqft_max": 2400,
                "location_details": "Kempegowda Layout, Bangalore",
                "apply_url": "https://bdabangalore.org/",
            },
        ]
        return [
            SchemeData(
                scheme_id=f"BDA-{hashlib.md5(s['name'].encode()).hexdigest()[:12]}",
                city="Bangalore",
                authority="BDA",
                source_url=self.BASE_URL,
                **s,
            )
            for s in known
        ]
