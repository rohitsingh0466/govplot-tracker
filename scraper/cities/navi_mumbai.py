"""
GovPlot Tracker — CIDCO Navi Mumbai Scraper
============================================
Rank: 7 | Demand: VERY_HIGH | Tier: 3 (CAPTCHA-gated lottery portal)
Authority: City and Industrial Development Corporation
Strategy: Scrape public notice page (no CAPTCHA). Aggregators are primary.
Known schemes: My Preferred Home 2024 (26,502 units), NMIA plots
"""
from __future__ import annotations
import re
from datetime import datetime, timezone
from scraper.base_scraper import BaseScraper, SchemeData, make_scheme
from scraper.cities._city_mixin import CityScraperMixin

class CIDCOScraper(CityScraperMixin, BaseScraper):
    CITY = "Navi Mumbai"; AUTH = "CIDCO"; BASE_URL = "https://www.cidco.maharashtra.gov.in"
    TIER1_URLS = ["https://www.cidco.maharashtra.gov.in", "https://cidcohomes.com", "https://cidcohomes.com/schemes"]
    AGGREGATOR_URLS = [
        "https://nayeghar.com/cidco-lottery-2025-complete-guide-to-22000-affordable-homes-in-navi-mumbai-eligibility-documents-registration-pricing/",
        "https://www.99acres.com/articles/cidco-lottery-2019-online-application-eligibility-results-draw-date-winner-list.html",
        "https://www.eauctionsindia.com/blog-details/cidco-lottery",
    ]
    def __init__(self): super().__init__(self.CITY, self.AUTH, self.BASE_URL)
    def scrape_tier1(self):
        # Tier 3 strategy: only scrape public notice page
        soup = self.get_soup(self.BASE_URL)
        if soup: return self._parse(soup, self.BASE_URL)
        soup = self.get_soup("https://cidcohomes.com")
        if soup: return self._parse(soup, "https://cidcohomes.com")
        return []
    def _parse(self, soup, source_url):
        schemes = []
        for el in (soup.select("div.scheme-card, table tr, article, li") or []):
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential", "lottery", "scheme", "home")): continue
            if any(k in text.lower() for k in ("lig", "ews", "e-auction", "commercial", "industrial")): continue
            if len(text) < 15: continue
            name_el = el.select_one("h2, h3, h4, .title, strong, a")
            raw = name_el.get_text(strip=True) if name_el else text[:120]
            if len(raw) < 10: continue
            name = raw if raw.startswith("CIDCO") else f"CIDCO {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name): name = f"{name} {datetime.now(timezone.utc).year}"
            if "residential" not in name.lower() and "plot" not in name.lower(): name += " Residential Plot Lottery"
            link = el.select_one("a[href]"); apply_url = link["href"] if link else "https://cidcohomes.com"
            if apply_url.startswith("/"): apply_url = self.BASE_URL + apply_url
            schemes.append(make_scheme(self.AUTH, self.CITY, name, self.normalise_status(text), source_url, data_source="LIVE", apply_url=apply_url, total_plots=self.parse_plots(text), location_details="Kharghar, Taloja, Panvel — Navi Mumbai"))
        return schemes
    def scrape_aggregators(self):
        s = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            s.extend(self._parse_aggregator_generic(soup, url, self.AUTH, self.CITY, "https://cidcohomes.com", "Navi Mumbai"))
        return s
    def fallback_schemes(self): return self._load_static_fallback(self.CITY, self.BASE_URL, self.AUTH)
