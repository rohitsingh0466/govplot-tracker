"""
GovPlot Tracker — LDA Lucknow Scraper
======================================
Rank: 2 | Demand: VERY_HIGH
Authority: Lucknow Development Authority
Tier: 1 (Static PHP) | Domain: ldalucknow.in (accessible, no proxy needed)
Known schemes: Anant Nagar Phase 1/2/3, Vrindavan Yojana
"""
from __future__ import annotations
import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme
from scraper.cities._city_mixin import CityScraperMixin


class LDAScraper(CityScraperMixin, BaseScraper):
    CITY = "Lucknow"
    AUTH = "LDA"
    BASE_URL = "https://www.ldalucknow.in"
    TIER1_URLS = [
        "https://www.ldalucknow.in/scheme",
        "https://www.ldalucknow.in/news-events",
        "https://www.ldalucknow.in",
    ]
    AGGREGATOR_URLS = [
        "https://www.eauctionsindia.com/blog-details/anant-nagar-yojana-phase2-lda-lucknow",
        "https://awaszone.com/lda-lucknow/",
    ]

    def __init__(self, config=None):
        super().__init__(self.CITY, self.AUTH, self.BASE_URL, config=config)

    def scrape_tier1(self) -> list[SchemeData]:
        for url in self.TIER1_URLS:
            soup = self.get_soup(url)
            if not soup:
                continue
            t = soup.get_text().lower()
            if not any(k in t for k in ("plot", "scheme", "yojna", "awas", "आवास")):
                continue
            schemes = self._parse(soup, url)
            if schemes:
                return schemes
        return []

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        rows = soup.select("table tr") or soup.select("ul.scheme-list li") or soup.select("div.notice-item")
        for row in rows:
            text = row.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "yojna", "awas", "residential", "आवासीय")):
                continue
            if any(k in text.lower() for k in ("lig", "ews", "flat", "e-auction", "commercial")):
                continue
            name_el = row.select_one("a, td, h3, h4")
            if not name_el:
                continue
            raw = name_el.get_text(strip=True)
            if len(raw) < 10:
                continue
            name = raw if raw.startswith("LDA") else f"LDA {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"
            link = row.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url
            schemes.append(make_scheme(
                self.AUTH, self.CITY, name, self.normalise_status(text), source_url,
                data_source="LIVE", apply_url=apply_url,
                open_date=self.parse_date(text), location_details="Lucknow",
            ))
        return schemes

    def scrape_aggregators(self) -> list[SchemeData]:
        schemes = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            parsed = self._parse_aggregator_generic(soup, url, self.AUTH, self.CITY, self.BASE_URL, "Lucknow")
            schemes.extend(parsed)
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        return self._load_static_fallback(self.CITY, self.BASE_URL, self.AUTH)
