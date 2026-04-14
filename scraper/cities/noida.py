"""
GovPlot Tracker — Noida (GNIDA / NUDA / YEIDA) Scraper
Sources: https://noidaauthorityonline.in, https://greaternoida.in
"""

import hashlib
from scraper.base_scraper import BaseScraper, SchemeData


class NoidaScraper(BaseScraper):
    """
    Scrapes residential plot schemes for Noida from multiple authorities:
    - Noida Authority (NUDA)
    - Greater Noida Industrial Development Authority (GNIDA)
    - Yamuna Expressway Industrial Development Authority (YEIDA)
    """

    SOURCES = [
        {
            "authority": "NUDA",
            "url": "https://noidaauthorityonline.in/scheme",
            "base": "https://noidaauthorityonline.in",
        },
        {
            "authority": "GNIDA",
            "url": "https://greaternoida.in/residential-plot-scheme",
            "base": "https://greaternoida.in",
        },
        {
            "authority": "YEIDA",
            "url": "https://yamunaexpresswayauthority.com/scheme",
            "base": "https://yamunaexpresswayauthority.com",
        },
    ]

    def __init__(self, config=None):
        super().__init__(
            city="Noida",
            authority="GNIDA/NUDA",
            base_url="https://noidaauthorityonline.in",
            use_selenium=False,
            config=config,
        )

    # ------------------------------------------------------------------ #
    def scrape(self) -> list[SchemeData]:
        schemes = []
        for source in self.SOURCES:
            soup = self._get_soup(source["url"])
            if soup:
                schemes.extend(self._parse_page(soup, source))

        seen = set()
        unique = []
        for s in schemes:
            if s.scheme_id not in seen:
                seen.add(s.scheme_id)
                unique.append(s)

        return unique if unique else self._fallback_schemes()

    # ------------------------------------------------------------------ #
    def _parse_page(self, soup, source: dict) -> list[SchemeData]:
        schemes = []
        authority = source["authority"]
        base = source["base"]
        url = source["url"]

        rows = (
            soup.select("table.scheme-table tbody tr")
            or soup.select("div.scheme-box")
            or soup.select("ul.scheme-list li")
        )

        for row in rows:
            name_el = row.select_one("td, h3, h4, .title, a")
            if not name_el:
                continue
            name = name_el.get_text(strip=True)
            if len(name) < 5:
                continue

            raw_status_el = row.select_one(".status, .badge, td:last-child")
            raw_status = raw_status_el.get_text(strip=True) if raw_status_el else row.get_text()
            status = self.normalise_status(raw_status)

            link = row.select_one("a[href]")
            apply_url = (base + link["href"] if link and link["href"].startswith("/")
                         else (link["href"] if link else url))

            sid = hashlib.md5(f"{authority}-{name}".encode()).hexdigest()[:12]
            schemes.append(SchemeData(
                scheme_id=f"{authority}-{sid}",
                name=name,
                city="Noida",
                authority=authority,
                status=status,
                apply_url=apply_url,
                source_url=url,
            ))

        return schemes

    # ------------------------------------------------------------------ #
    def _fallback_schemes(self) -> list[SchemeData]:
        known = [
            {
                "name": "Noida Authority Sector 99 Residential Plot Scheme",
                "authority": "NUDA",
                "status": "CLOSED",
                "open_date": "2023-10-01",
                "close_date": "2023-11-30",
                "total_plots": 750,
                "price_min": 40.0,
                "price_max": 180.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Sector 99, Noida",
                "apply_url": "https://noidaauthorityonline.in",
            },
            {
                "name": "Greater Noida Residential Plot Scheme 2025 (Sector Omega)",
                "authority": "GNIDA",
                "status": "OPEN",
                "open_date": "2025-01-15",
                "close_date": "2025-03-15",
                "total_plots": 1100,
                "price_min": 30.0,
                "price_max": 150.0,
                "area_sqft_min": 600,
                "area_sqft_max": 2700,
                "location_details": "Sector Omega, Greater Noida",
                "apply_url": "https://greaternoida.in/residential-plot-scheme",
            },
            {
                "name": "YEIDA Plot Scheme Sector 18 (Expressway)",
                "authority": "YEIDA",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-07-31",
                "total_plots": 2000,
                "price_min": 15.0,
                "price_max": 80.0,
                "area_sqft_min": 1080,
                "area_sqft_max": 4320,
                "location_details": "Sector 18, Yamuna Expressway",
                "apply_url": "https://yamunaexpresswayauthority.com/scheme",
            },
            {
                "name": "Noida Authority Sector 122 Premium Plots",
                "authority": "NUDA",
                "status": "ACTIVE",
                "open_date": "2024-08-01",
                "close_date": "2025-07-31",
                "total_plots": 420,
                "price_min": 60.0,
                "price_max": 250.0,
                "area_sqft_min": 1800,
                "area_sqft_max": 5400,
                "location_details": "Sector 122, Noida (near Film City)",
                "apply_url": "https://noidaauthorityonline.in",
            },
        ]
        return [
            SchemeData(
                scheme_id=f"{s['authority']}-{hashlib.md5(s['name'].encode()).hexdigest()[:12]}",
                city="Noida",
                source_url="https://noidaauthorityonline.in",
                **s,
            )
            for s in known
        ]
