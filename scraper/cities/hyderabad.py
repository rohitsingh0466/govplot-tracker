"""
GovPlot Tracker — HMDA Hyderabad Scraper
==========================================
Rank: 8 | Demand: HIGH | Tier: 2 (Playwright — Angular portal)
Authority: Hyderabad Metropolitan Development Authority
Known schemes: Dev Layout Plots (Miyapur, Keesara), RRR corridor
"""
from __future__ import annotations
import re
from datetime import datetime, timezone
from scraper.base_scraper import BaseScraper, SchemeData, make_scheme
from scraper.cities._city_mixin import CityScraperMixin

class HMDAScraper(CityScraperMixin, BaseScraper):
    CITY = "Hyderabad"; AUTH = "HMDA"; BASE_URL = "https://www.hmda.gov.in"
    TIER1_URLS = ["https://www.hmda.gov.in/hmda-dev-layout-plots/", "https://www.hmda.gov.in/plots/", "https://www.hmda.gov.in"]
    AGGREGATOR_URLS = ["https://www.eauctionsindia.com/blog-details/hmda", "https://www.99acres.com/articles/hyderabad-hmda-plot-scheme.html"]
    def __init__(self, config=None): super().__init__(self.CITY, self.AUTH, self.BASE_URL, config=config)
    def scrape_tier1(self):
        for url in self.TIER1_URLS:
            soup = self.get_soup(url)
            if soup and any(k in soup.get_text().lower() for k in ("plot", "layout", "residential")):
                s = self._parse(soup, url)
                if s: return s
        return []
    def scrape_tier2(self):
        for url in self.TIER1_URLS[:2]:
            soup = self.get_playwright_soup(url, wait_selector="table, .scheme-card, .layout-plots, main", wait_secs=12)
            if soup:
                s = self._parse(soup, url)
                if s: return s
        return []
    def _parse(self, soup, source_url):
        schemes = []
        for el in (soup.select("table tr, div.scheme-card, article, li") or []):
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "layout", "residential", "scheme")): continue
            if any(k in text.lower() for k in ("lig", "ews", "flat", "e-auction", "commercial")): continue
            if len(text) < 15: continue
            name_el = el.select_one("h2, h3, h4, .title, td, strong, a")
            raw = name_el.get_text(strip=True) if name_el else text[:120]
            if len(raw) < 10: continue
            name = raw if raw.startswith("HMDA") else f"HMDA {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name): name = f"{name} {datetime.now(timezone.utc).year}"
            if "residential" not in name.lower() and "plot" not in name.lower(): name += " Residential Plot Lottery"
            link = el.select_one("a[href]"); apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"): apply_url = self.BASE_URL + apply_url
            schemes.append(make_scheme(self.AUTH, self.CITY, name, self.normalise_status(text), source_url, data_source="LIVE", apply_url=apply_url, total_plots=self.parse_plots(text), price_min=self.parse_price_lakh(text), location_details="Hyderabad Metropolitan Region"))
        return schemes
    def scrape_aggregators(self):
        s = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            s.extend(self._parse_aggregator_generic(soup, url, self.AUTH, self.CITY, self.BASE_URL, "Hyderabad"))
        return s
    def fallback_schemes(self): return self._load_static_fallback(self.CITY, self.BASE_URL, self.AUTH)
