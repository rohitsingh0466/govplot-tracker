"""
GovPlot Tracker — PDA Prayagraj Scraper
=========================================
Rank: 5 | Demand: HIGH | Tier: 1 (Static HTML, SSL may be expired)
Authority: Prayagraj Development Authority | Domain: pdaprayagraj.org (HTTP)
Known schemes: 206-plot lottery 2025, Maha Kumbh infrastructure zones
"""
from __future__ import annotations
import re
from datetime import datetime, timezone
from scraper.base_scraper import BaseScraper, SchemeData, make_scheme
from scraper.cities._city_mixin import CityScraperMixin

class PDAScraper(CityScraperMixin, BaseScraper):
    CITY = "Prayagraj"; AUTH = "PDA"; BASE_URL = "http://www.pdaprayagraj.org"
    TIER1_URLS = ["http://www.pdaprayagraj.org", "http://www.pdaprayagraj.org/scheme", "https://janhit.upda.in"]
    AGGREGATOR_URLS = ["https://www.eauctionsindia.com/blog-details/pda-invites-bids-via-e-auction-for-plots-across-prayagraj-apply-online-now", "https://awaszone.com/pda-prayagraj/"]
    def __init__(self, config=None): super().__init__(self.CITY, self.AUTH, self.BASE_URL, config=config)
    def scrape_tier1(self):
        for url in self.TIER1_URLS:
            soup = self.get_soup(url)  # SSL bypass auto-applied for pdaprayagraj.org
            if soup:
                s = self._parse(soup, url)
                if s: return s
        return []
    def _parse(self, soup, source_url):
        schemes = []
        for el in (soup.select("table tr") or soup.select("li") or soup.select("div.scheme")):
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "awas", "yojana", "residential", "भूखंड")): continue
            if any(k in text.lower() for k in ("lig", "ews", "flat", "e-auction", "commercial")): continue
            if len(text) < 10: continue
            name_el = el.select_one("a, td, strong, h4")
            raw = name_el.get_text(strip=True) if name_el else text[:120]
            if len(raw) < 8: continue
            name = raw if raw.startswith("PDA") else f"PDA {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name): name = f"{name} {datetime.now(timezone.utc).year}"
            if "residential" not in name.lower() and "plot" not in name.lower(): name += " Residential Plot Lottery"
            link = el.select_one("a[href]"); apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"): apply_url = "http://www.pdaprayagraj.org" + apply_url
            schemes.append(make_scheme(self.AUTH, self.CITY, name, self.normalise_status(text), source_url, data_source="LIVE", apply_url=apply_url, total_plots=self.parse_plots(text), location_details="Prayagraj, Uttar Pradesh"))
        return schemes
    def scrape_aggregators(self):
        s = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            s.extend(self._parse_aggregator_generic(soup, url, self.AUTH, self.CITY, self.BASE_URL, "Prayagraj"))
        return s
    def fallback_schemes(self): return self._load_static_fallback(self.CITY, self.BASE_URL, self.AUTH)
