"""
GovPlot Tracker — UIT Udaipur Scraper
Rank: 17 | Authority: Urban Improvement Trust Udaipur
Tier: 1 (Static HTML) + Aggregators
"""
from __future__ import annotations
import re
from datetime import datetime, timezone
from scraper.base_scraper import BaseScraper, SchemeData, make_scheme
from scraper.cities._city_mixin import CityScraperMixin


class UITScraper(CityScraperMixin, BaseScraper):
    CITY = "Udaipur"
    AUTH = "UIT"
    BASE_URL = "https://uitudaipur.org"
    TIER1_URLS = [
        "https://uitudaipur.org",
        "https://uitudaipur.org/scheme",
        "https://uitudaipur.org/residential-plot",
    ]
    AGGREGATOR_URLS = [
        "https://www.eauctionsindia.com/blog-details/udaipur",
        "https://awaszone.com/udaipur/",
    ]

    def __init__(self, config=None):
        super().__init__(self.CITY, self.AUTH, self.BASE_URL, config=config)

    def scrape_tier1(self) -> list[SchemeData]:
        for url in self.TIER1_URLS:
            soup = self.get_soup(url)
            if not soup:
                continue
            t = soup.get_text().lower()
            if not any(k in t for k in ("plot", "scheme", "residential", "awas", "yojana", "lottery", "allot")):
                continue
            s = self._parse(soup, url)
            if s:
                return s
        return []

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        candidates = (
            soup.select("table tr")
            or soup.select("div.scheme-item")
            or soup.select("div.notice")
            or soup.select("li")
            or soup.select("article")
        )
        for el in candidates:
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in (
                "plot", "residential", "yojana", "awas", "lottery", "scheme", "allot", "bhukhand"
            )):
                continue
            if any(k in text.lower() for k in ("lig", "ews", "flat", "e-auction", "commercial", "industrial")):
                continue
            if len(text) < 10:
                continue
            name_el = el.select_one("h2, h3, h4, a, td, strong, .title")
            raw = name_el.get_text(strip=True) if name_el else text[:150]
            if len(raw) < 8:
                continue
            auth_upper = self.AUTH.upper()
            name = raw if raw.upper().startswith(auth_upper.split("-")[0]) else f"{self.AUTH} {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"
            if "residential" not in name.lower() and "plot" not in name.lower():
                name += " Residential Plot Lottery"
            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url
            plots = self.parse_plots(text)
            price_min = self.parse_price_lakh(text)
            schemes.append(make_scheme(
                self.AUTH, self.CITY, name, self.normalise_status(text), source_url,
                data_source="LIVE", apply_url=apply_url,
                total_plots=plots, price_min=price_min,
                location_details="Udaipur City of Lakes multiple RERA locations",
            ))
        return schemes

    def scrape_aggregators(self) -> list[SchemeData]:
        schemes = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            parsed = self._parse_aggregator_generic(
                soup, url, self.AUTH, self.CITY, self.BASE_URL, "Udaipur City of Lakes multiple RERA locations"
            )
            schemes.extend(parsed)
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        return self._load_static_fallback(self.CITY, self.BASE_URL, self.AUTH)
