"""
GovPlot Tracker — JDA Jaipur Scraper
======================================
Rank: 3 | Demand: EXTREME
Authority: Jaipur Development Authority
Tier: 2 (Playwright) — Rajasthan gov portal has JS sections
Known schemes: Govind Vihar, Atal Vihar, Ganga/Yamuna/Saraswati Vihar
"""
from __future__ import annotations
import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme
from scraper.cities._city_mixin import CityScraperMixin


class JDAScraper(CityScraperMixin, BaseScraper):
    CITY = "Jaipur"
    AUTH = "JDA"
    BASE_URL = "https://jda.rajasthan.gov.in"
    TIER1_URLS = [
        "https://jda.rajasthan.gov.in/content/raj/udh/jda---jaipur/en/notice-board/schemes.html",
        "https://jda.rajasthan.gov.in/content/raj/udh/jda---jaipur/en/notice-board/lottery-result.html",
        "https://jda.rajasthan.gov.in",
    ]
    AGGREGATOR_URLS = [
        "https://www.eauctionsindia.com/blog-details/jda-residential-plot-scheme",
        "https://sarkariyojana.com/jda-residential-plot-scheme-lottery-draw/",
        "https://awaszone.com/jda-jaipur/",
    ]

    def __init__(self, config=None):
        super().__init__(self.CITY, self.AUTH, self.BASE_URL, config=config)

    def scrape_tier1(self) -> list[SchemeData]:
        for url in self.TIER1_URLS:
            soup = self.get_soup(url)
            if soup:
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def scrape_tier2(self) -> list[SchemeData]:
        for url in self.TIER1_URLS[:2]:
            soup = self.get_playwright_soup(
                url,
                wait_selector="table, .notice-list, .scheme-list, main",
                wait_secs=12, scroll=True,
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
            or soup.select("ul li")
            or soup.select("div.item")
            or soup.select("div.notice")
        )
        for row in rows:
            text = row.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential", "yojana", "vihar", "awasiya", "भूखंड")):
                continue
            if any(k in text.lower() for k in ("lig", "ews", "flat", "e-auction", "commercial", "eauction")):
                continue
            name_el = row.select_one("a, td, strong, h4, .title")
            if not name_el:
                continue
            raw = name_el.get_text(strip=True)
            if len(raw) < 10:
                continue
            name = raw if raw.startswith("JDA") else f"JDA {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"
            if "residential" not in name.lower() and "plot" not in name.lower():
                name += " Residential Plot Lottery"
            link = row.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url
            plots = self.parse_plots(text)
            schemes.append(make_scheme(
                self.AUTH, self.CITY, name, self.normalise_status(text), source_url,
                data_source="LIVE", apply_url=apply_url,
                total_plots=plots, location_details="Jaipur, Rajasthan",
            ))
        return schemes

    def scrape_aggregators(self) -> list[SchemeData]:
        schemes = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            parsed = self._parse_aggregator_generic(soup, url, self.AUTH, self.CITY, self.BASE_URL, "Jaipur")
            schemes.extend(parsed)
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        return self._load_static_fallback(self.CITY, self.BASE_URL, self.AUTH)
