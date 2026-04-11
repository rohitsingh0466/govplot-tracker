"""
GovPlot Tracker — DDA Delhi Scraper
=====================================
Rank: 16 | Demand: EXTREME
Authority: Delhi Development Authority
Tier: 3 (CAPTCHA/Cloudflare-protected lottery portal)

STRATEGY:
  - DO NOT scrape eservices.dda.org.in (CAPTCHA-protected)
  - DO scrape dda.gov.in public notice pages (accessible)
  - Aggregators are PRIMARY source — most reliable for DDA
  - Playwright for JS-heavy sections of dda.gov.in
Known schemes: Dwarka Extension (6000 plots), Narela, Rohini, Jan Sadharan Awaas Yojana
"""
from __future__ import annotations
import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme
from scraper.cities._city_mixin import CityScraperMixin


class DDAScraper(CityScraperMixin, BaseScraper):
    CITY = "Delhi"
    AUTH = "DDA"
    BASE_URL = "https://dda.gov.in"

    # Public notice pages — NO CAPTCHA
    TIER1_URLS = [
        "https://dda.gov.in/housing",
        "https://dda.gov.in/scheme",
        "https://dda.gov.in/residential-scheme",
        "https://dda.gov.in",
    ]

    # Aggregators are PRIMARY for DDA (most reliable)
    AGGREGATOR_URLS = [
        "https://housiey.com/blogs/dda-housing-scheme-2025-key-details-registration-online-price",
        "https://www.eauctionsindia.com/blog-details/dda-housing-scheme",
        "https://www.99acres.com/articles/how-to-apply-for-dda-housing-scheme-2020-online.html",
    ]

    def __init__(self):
        super().__init__(self.CITY, self.AUTH, self.BASE_URL)

    def scrape_tier1(self) -> list[SchemeData]:
        """
        Tier 3 strategy: only scrape public-facing pages.
        ScraperAPI proxy auto-applied for dda.gov.in.
        """
        for url in self.TIER1_URLS:
            soup = self.get_soup(url)
            if soup and self._has_content(soup):
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def scrape_tier2(self) -> list[SchemeData]:
        """Playwright for JS sections of DDA portal."""
        for url in self.TIER1_URLS[:3]:
            soup = self.get_playwright_soup(
                url,
                wait_selector="table, .scheme-list, .scheme-card, main, article, #content",
                wait_secs=15,
                scroll=True,
            )
            if soup and self._has_content(soup):
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def _has_content(self, soup) -> bool:
        if not soup:
            return False
        t = soup.get_text().lower()
        return any(k in t for k in (
            "plot", "residential", "scheme", "lottery", "allot",
            "awas", "awasiya", "housing", "narela", "dwarka", "rohini"
        ))

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        candidates = (
            soup.select(".scheme-card")
            or soup.select("table tr")
            or soup.select("div.scheme-item")
            or soup.select("article")
            or soup.select(".MuiCard-root")
            or soup.select("li")
            or soup.select(".news-item a")
        )
        for el in candidates:
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in (
                "plot", "residential plot", "awasiya", "residential site",
                "jan sadharan", "housing scheme"
            )):
                continue
            if any(k in text.lower() for k in (
                "lig", "ews", "mig", "hig flat", "flat scheme",
                "e-auction", "commercial", "industrial"
            )):
                continue
            if len(text) < 15:
                continue
            name_el = el.select_one("h2, h3, h4, .title, .scheme-name, strong, a, td")
            raw = name_el.get_text(strip=True) if name_el else text[:120].strip()
            if len(raw) < 10:
                continue
            name = raw if raw.upper().startswith("DDA") else f"DDA {raw}"
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
            open_d = close_d = None
            date_matches = re.findall(r"\d{1,2}[/\-]\d{1,2}[/\-]\d{4}", text)
            if len(date_matches) >= 2:
                open_d = self.parse_date(date_matches[0])
                close_d = self.parse_date(date_matches[1])
            elif len(date_matches) == 1:
                close_d = self.parse_date(date_matches[0])
            # Detect location from text
            location = "Delhi"
            for loc in ("Narela", "Dwarka", "Rohini", "Jasola", "Siraspur", "Loknayakpuram"):
                if loc.lower() in text.lower():
                    location = f"{loc}, Delhi"
                    break
            schemes.append(make_scheme(
                self.AUTH, self.CITY, name, self.normalise_status(text), source_url,
                data_source="LIVE", apply_url=apply_url,
                open_date=open_d, close_date=close_d,
                total_plots=plots, price_min=price_min,
                location_details=location,
            ))
        seen = set()
        return [s for s in schemes if not (s.scheme_id in seen or seen.add(s.scheme_id))]

    def scrape_aggregators(self) -> list[SchemeData]:
        """Aggregators are PRIMARY source for DDA — most reliable."""
        schemes = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            parsed = self._parse_aggregator_generic(
                soup, url, self.AUTH, self.CITY, self.BASE_URL, "Delhi"
            )
            schemes.extend(parsed)
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        return self._load_static_fallback(self.CITY, self.BASE_URL, self.AUTH)
