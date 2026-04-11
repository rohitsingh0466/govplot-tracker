"""
GovPlot Tracker — YEIDA Scraper (Greater Noida / Yamuna Expressway)
====================================================================
Rank: 1 (EXTREME demand — Jewar Airport, F1 Track, Film City)
Authority: Yamuna Expressway Industrial Development Authority
Tier: 2 (JS-rendered Angular portal) + Aggregators

Scheme naming: "YEIDA Sector-XX Yamuna Expressway Residential Plot Lottery YYYY"
Typical plots: 162–290 sqm (RPS series schemes)
Key aggregators: 99acres.com, awaszone.com, eauctionsindia.com
"""

from __future__ import annotations
import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme, make_scheme_id
from scraper.cities.city_config import CITY_BY_NAME
from scraper.cities.static_schemes import get_schemes_for_city


class YEIDAScraper(BaseScraper):
    """
    YEIDA residential plot schemes.
    Tier 1: Direct HTTP to scheme list page (sometimes works)
    Tier 2: Playwright for Angular portal
    Aggregators: 99acres, awaszone, eauctionsindia
    """

    CITY = "Greater Noida"
    AUTH = "YEIDA"
    BASE_URL = "https://yamunaexpresswayauthority.com"

    TIER1_URLS = [
        "https://yamunaexpresswayauthority.com/scheme",
        "https://yamunaexpresswayauthority.com/residential-plot",
        "https://yamunaexpresswayauthority.com",
    ]

    AGGREGATOR_URLS = [
        "https://www.99acres.com/articles/yamuna-expressway-authority-yeida-plot-scheme-2020-online-application-eligibility-last-date-and-draw-date.html",
        "https://awaszone.com/yeida-plot-scheme/",
        "https://www.eauctionsindia.com/blog-details/yeida-plot-scheme",
    ]

    def __init__(self):
        super().__init__(self.CITY, self.AUTH, self.BASE_URL)

    def scrape_tier1(self) -> list[SchemeData]:
        schemes = []
        for url in self.TIER1_URLS:
            soup = self.get_soup(url)
            if soup and self._has_plot_content(soup):
                parsed = self._parse_html(soup, url)
                if parsed:
                    schemes.extend(parsed)
                    break
        return schemes

    def scrape_tier2(self) -> list[SchemeData]:
        """Playwright for Angular-rendered YEIDA portal."""
        schemes = []
        for url in self.TIER1_URLS:
            soup = self.get_playwright_soup(
                url,
                wait_selector="table, .scheme-list, #schemeList, .scheme-card, .residential",
                wait_secs=15,
                scroll=True,
            )
            if soup and self._has_plot_content(soup):
                parsed = self._parse_html(soup, url)
                if parsed:
                    schemes.extend(parsed)
                    break
        return schemes

    def scrape_aggregators(self) -> list[SchemeData]:
        """
        Aggregator sites (99acres, awaszone, eauctionsindia).
        These publish within hours of YEIDA scheme launch.
        Marked as data_source="LIVE" since they reflect real current data.
        """
        schemes = []
        for url in self.AGGREGATOR_URLS:
            soup = self.get_soup(url)
            if not soup:
                continue
            parsed = self._parse_aggregator(soup, url)
            if parsed:
                schemes.extend(parsed)
        return schemes

    def _has_plot_content(self, soup) -> bool:
        if not soup:
            return False
        text = soup.get_text().lower()
        return any(k in text for k in ("plot", "residential", "rps", "scheme", "sector", "yeida"))

    def _parse_html(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        candidates = (
            soup.select("table tr")
            or soup.select(".scheme-card")
            or soup.select(".scheme-item")
            or soup.select("div.scheme")
            or soup.select("li")
        )
        for el in candidates:
            text = el.get_text(separator=" ", strip=True)
            if not self._is_plot_text(text):
                continue
            name_el = el.select_one("h2, h3, h4, td, a, .title, strong")
            raw = name_el.get_text(strip=True) if name_el else text[:120]
            if len(raw) < 10:
                continue
            name = self._normalize_name(raw)
            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url
            open_d = self.parse_date(text.split("open")[1][:30]) if "open" in text.lower() else None
            close_d = self.parse_date(text.split("close")[1][:30]) if "close" in text.lower() else None
            plots = self.parse_plots(text)
            price_min = self.parse_price_lakh(text)
            schemes.append(make_scheme(
                self.AUTH, self.CITY, name, self.normalise_status(text), source_url,
                data_source="LIVE", apply_url=apply_url,
                open_date=open_d, close_date=close_d,
                total_plots=plots, price_min=price_min,
                location_details="Yamuna Expressway, Greater Noida",
            ))
        return schemes

    def _parse_aggregator(self, soup, source_url: str) -> list[SchemeData]:
        """Parse aggregator news pages for YEIDA scheme info."""
        schemes = []
        text_full = soup.get_text()
        # Look for YEIDA scheme mentions in article text
        for block in soup.select("article, .post-content, .entry-content, main, section"):
            text = block.get_text(separator=" ", strip=True)
            if not self._is_plot_text(text):
                continue
            # Extract scheme name from headings
            for heading in block.select("h1, h2, h3"):
                h_text = heading.get_text(strip=True)
                if self._is_plot_text(h_text) and len(h_text) > 15:
                    name = self._normalize_name(h_text)
                    # Extract close date
                    close_d = None
                    date_patterns = re.findall(
                        r"(?:last date|close|apply|deadline)[^\d]{0,20}(\d{1,2}[/\-]\d{1,2}[/\-]\d{4}|\d{1,2}\s+\w+\s+\d{4})",
                        text, re.IGNORECASE
                    )
                    if date_patterns:
                        close_d = self.parse_date(date_patterns[0])
                    plots = self.parse_plots(text)
                    status = "OPEN" if any(k in text.lower() for k in ("now open", "apply now", "last date")) else "UPCOMING"
                    schemes.append(make_scheme(
                        self.AUTH, self.CITY, name, status, source_url,
                        data_source="LIVE", apply_url=self.BASE_URL,
                        close_date=close_d, total_plots=plots,
                        location_details="Yamuna Expressway, Greater Noida",
                    ))
                    break  # One scheme per aggregator page
        return schemes

    def _is_plot_text(self, text: str) -> bool:
        t = text.lower()
        if any(k in t for k in ("e-auction", "lig", "ews", "flat", "commercial")):
            return False
        return any(k in t for k in ("plot", "residential", "rps", "sector", "yeida"))

    def _normalize_name(self, raw: str) -> str:
        name = raw if raw.upper().startswith("YEIDA") else f"YEIDA {raw}"
        # Add year if missing
        if not re.search(r"20(2[4-9]|[3-9]\d)", name):
            name = f"{name} {datetime.now(timezone.utc).year}"
        # Ensure "Residential Plot" is in name
        if "residential" not in name.lower() and "plot" not in name.lower():
            name = name + " Residential Plot Lottery"
        return name

    def fallback_schemes(self) -> list[SchemeData]:
        raw = get_schemes_for_city(self.CITY)
        result = []
        for s in raw:
            result.append(SchemeData(
                scheme_id=s["scheme_id"], name=s["name"], city=s["city"],
                authority=s["authority"], status=s["status"],
                open_date=s.get("open_date"), close_date=s.get("close_date"),
                total_plots=s.get("total_plots"), price_min=s.get("price_min"),
                price_max=s.get("price_max"), area_sqft_min=s.get("area_sqft_min"),
                area_sqft_max=s.get("area_sqft_max"),
                location_details=s.get("location_details"),
                apply_url=s.get("apply_url", self.BASE_URL),
                source_url=s.get("source_url", self.BASE_URL),
                data_source="STATIC", scraper_status="fallback",
            ))
        return result
