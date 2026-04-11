"""
GovPlot Tracker — BDA Bengaluru Scraper
=========================================
Rank: 10 | Demand: VERY_HIGH
Authority: Bangalore Development Authority
Tier: 2 (Playwright — WordPress portal with JS filtering)
Known schemes: Arkavathy Layout 2E (5000 plots), Kempegowda Layout, JP Nagar 9th Phase
"""
from __future__ import annotations
import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme
from scraper.cities._city_mixin import CityScraperMixin


class BDAScraper(CityScraperMixin, BaseScraper):
    CITY = "Bengaluru"
    AUTH = "BDA"
    BASE_URL = "https://bdakarnataka.in"
    TIER1_URLS = [
        "https://bdakarnataka.in/site-allotment/",
        "https://bdakarnataka.in/schemes/",
        "https://bdakarnataka.in",
        "https://eng.bdabangalore.org",
    ]
    AGGREGATOR_URLS = [
        "https://www.eauctionsindia.com/blog-details/bda-bangalore",
        "https://booknewproperty.com/news/bda-commences-e-auction-for-residential-and-commercial-sites-in-bengaluru/",
        "https://housystan.com/article/unlocking-opportunities-how-to-apply-for-a-bda-site-in-bangalore",
    ]

    def __init__(self):
        super().__init__(self.CITY, self.AUTH, self.BASE_URL)

    def scrape_tier1(self) -> list[SchemeData]:
        for url in self.TIER1_URLS:
            soup = self.get_soup(url)
            if soup and self._has_content(soup):
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def scrape_tier2(self) -> list[SchemeData]:
        for url in self.TIER1_URLS[:3]:
            soup = self.get_playwright_soup(
                url,
                wait_selector=".scheme-list, table, .entry-content, article, .site-allotment",
                wait_secs=12, scroll=True,
            )
            if soup and self._has_content(soup):
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def _has_content(self, soup) -> bool:
        t = soup.get_text().lower()
        return any(k in t for k in ("site allot", "plot", "layout", "residential", "arkavathy", "kempegowda"))

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        candidates = (
            soup.select("article.post")
            or soup.select("div.scheme-card")
            or soup.select("table tr")
            or soup.select(".entry-content li")
            or soup.select("div.post-content li")
        )
        for el in candidates:
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in (
                "site allot", "plot", "residential site", "residential plot",
                "layout", "arkavathy", "jp nagar", "kempegowda"
            )):
                continue
            if any(k in text.lower() for k in (
                "flat", "apartment", "lig", "ews", "mig flat", "e-auction", "commercial", "industrial"
            )):
                continue
            if len(text) < 15:
                continue
            name_el = el.select_one("h2, h3, h4, .scheme-title, td.scheme-name, a.scheme-link, strong, a")
            raw = name_el.get_text(strip=True) if name_el else text[:120].strip()
            if len(raw) < 10:
                continue
            name = raw if raw.upper().startswith("BDA") else f"BDA {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"
            # Normalize BDA terminology: "Site Allotment" → "Residential Sites Lottery"
            if "site allot" in name.lower() and "residential" not in name.lower():
                name = name.replace("Site Allotment", "Residential Sites Lottery")
            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url
            plots = self.parse_plots(text)
            price_min = self.parse_price_lakh(text)
            area_m = re.search(r"(\d+)\s*(?:sq\.?\s*ft|sqft|sq\.mtr|sqm)", text, re.IGNORECASE)
            area = int(area_m.group(1)) if area_m else None
            schemes.append(make_scheme(
                self.AUTH, self.CITY, name, self.normalise_status(text), source_url,
                data_source="LIVE", apply_url=apply_url,
                total_plots=plots, price_min=price_min,
                area_sqft_min=area,
                location_details="Bangalore Development Authority Layout",
            ))
        seen = set()
        return [s for s in schemes if not (s.scheme_id in seen or seen.add(s.scheme_id))]

    def scrape_aggregators(self) -> list[SchemeData]:
        schemes = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            parsed = self._parse_aggregator_generic(
                soup, url, self.AUTH, self.CITY, self.BASE_URL,
                "Bangalore Development Authority Layout"
            )
            schemes.extend(parsed)
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        return self._load_static_fallback(self.CITY, self.BASE_URL, self.AUTH)
