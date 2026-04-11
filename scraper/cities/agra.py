"""
GovPlot Tracker — ADA Agra Scraper
=====================================
Rank: 4 | Demand: VERY_HIGH
Authority: Agra Development Authority
Tier: 1 (Static HTML) | Domain: adaagra.org.in (accessible)
Known schemes: Atalpuram Township Phase 1/2/3
"""
from __future__ import annotations
import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme
from scraper.cities._city_mixin import CityScraperMixin


class ADAScraper(CityScraperMixin, BaseScraper):
    CITY = "Agra"
    AUTH = "ADA"
    BASE_URL = "https://www.adaagra.org.in"
    TIER1_URLS = [
        "https://www.adaagra.org.in",
        "https://www.adaagra.org.in/scheme",
        "https://www.adaagra.org.in/news",
    ]
    AGGREGATOR_URLS = [
        "https://www.eauctionsindia.com/blog-details/ada-agra-atal-puram-lottery",
        "https://www.eauctionsindia.com/blog-details/agra-development-authority-plot-scheme",
        "https://awaszone.com/ada-agra-atalpuram-township/",
    ]

    def __init__(self):
        super().__init__(self.CITY, self.AUTH, self.BASE_URL)

    def scrape_tier1(self) -> list[SchemeData]:
        for url in self.TIER1_URLS:
            soup = self.get_soup(url)
            if soup:
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        candidates = (
            soup.select("table tr")
            or soup.select("div.scheme-item")
            or soup.select("div.notification")
            or soup.select("li")
            or soup.select("a")
        )
        for el in candidates:
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "awas", "yojana", "atalpuram", "residential", "भूखंड")):
                continue
            if any(k in text.lower() for k in ("lig", "ews", "flat", "e-auction", "commercial")):
                continue
            if len(text) < 10:
                continue
            raw = text[:150].strip()
            name = raw if raw.upper().startswith("ADA") else f"ADA {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"
            if "residential" not in name.lower() and "plot" not in name.lower():
                name += " Residential Plot Lottery"
            link = el if el.name == "a" else el.select_one("a[href]")
            apply_url = link["href"] if link and link.get("href") else source_url
            if apply_url and apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url
            plots = self.parse_plots(text)
            price_min = self.parse_price_lakh(text)
            schemes.append(make_scheme(
                self.AUTH, self.CITY, name, self.normalise_status(text), source_url,
                data_source="LIVE", apply_url=apply_url or self.BASE_URL,
                total_plots=plots, price_min=price_min,
                location_details="Atalpuram Township, Gwalior Highway, Agra",
            ))
        return schemes

    def scrape_aggregators(self) -> list[SchemeData]:
        schemes = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            parsed = self._parse_aggregator_generic(soup, url, self.AUTH, self.CITY, self.BASE_URL, "Atalpuram Township, Agra")
            schemes.extend(parsed)
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        return self._load_static_fallback(self.CITY, self.BASE_URL, self.AUTH)
