"""
GovPlot Tracker — GMADA Chandigarh Scraper
============================================
Rank: 6 | Demand: VERY_HIGH
Authority: Greater Mohali Area Development Authority
Tier: 2 (Playwright — .gov.in domain, may need proxy)
Known schemes: Eco City-2 Extension (185 plots), Eco City-2 (289 plots)
"""
from __future__ import annotations
import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme
from scraper.cities._city_mixin import CityScraperMixin


class GMADAScraper(CityScraperMixin, BaseScraper):
    CITY = "Chandigarh"
    AUTH = "GMADA"
    BASE_URL = "https://gmada.gov.in"
    TIER1_URLS = [
        "https://gmada.gov.in/en/notice-board/schemes",
        "https://gmada.gov.in/en",
        "https://gmada.gov.in",
    ]
    AGGREGATOR_URLS = [
        "https://garahpravesh.com/gmada-eco-city-2-extension-new-chandigarh-2025/",
        "https://garahpravesh.com/gmada-eco-city-2-plot-scheme-mohali-2025/",
        "https://www.eauctionsindia.com/blog-details/gmada",
    ]

    def __init__(self):
        super().__init__(self.CITY, self.AUTH, self.BASE_URL)

    def scrape_tier1(self) -> list[SchemeData]:
        """Try with ScraperAPI proxy (gmada.gov.in is .gov.in — may be blocked)."""
        for url in self.TIER1_URLS:
            soup = self.get_soup(url)  # ScraperAPI auto-applied for .gov.in
            if soup:
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def scrape_tier2(self) -> list[SchemeData]:
        """Playwright fallback for JS-rendered content."""
        for url in self.TIER1_URLS[:2]:
            soup = self.get_playwright_soup(
                url,
                wait_selector="table, .scheme-list, .notice-board, .allotment, main",
                wait_secs=15,
            )
            if soup:
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        rows = (
            soup.select("table tr")
            or soup.select("ul.scheme-list li")
            or soup.select("div.notice-item")
            or soup.select("div.scheme")
        )
        for row in rows:
            text = row.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential", "eco city", "scheme", "allot")):
                continue
            if any(k in text.lower() for k in ("lig", "ews", "flat", "e-auction", "commercial")):
                continue
            if len(text) < 10:
                continue
            name_el = row.select_one("a, td, strong, h4, .title")
            raw = name_el.get_text(strip=True) if name_el else text[:120]
            if len(raw) < 10:
                continue
            name = raw if raw.startswith("GMADA") else f"GMADA {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"
            if "residential" not in name.lower() and "plot" not in name.lower():
                name += " Residential Plot Lottery"
            link = row.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url
            plots = self.parse_plots(text)
            price_min = self.parse_price_lakh(text)
            schemes.append(make_scheme(
                self.AUTH, self.CITY, name, self.normalise_status(text), source_url,
                data_source="LIVE", apply_url=apply_url,
                total_plots=plots, price_min=price_min,
                location_details="New Chandigarh / Mohali, Punjab",
            ))
        return schemes

    def scrape_aggregators(self) -> list[SchemeData]:
        schemes = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            parsed = self._parse_aggregator_generic(
                soup, url, self.AUTH, self.CITY, self.BASE_URL,
                "Eco City, New Chandigarh, Mohali"
            )
            schemes.extend(parsed)
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        return self._load_static_fallback(self.CITY, self.BASE_URL, self.AUTH)
