"""
GovPlot Tracker — Base Scraper v3.2
=====================================
Every city scraper inherits from this class.

KEY FEATURES:
  - Live HTTP scraping via requests + BeautifulSoup (primary)
  - Selenium fallback for JS-heavy portals (secondary)
  - Hardcoded fallback data when live scrape fails (tertiary)
  - data_source flag: "LIVE" | "STATIC" on every SchemeData
  - Structured error recording for failure alert emails
  - All filters enforced at base level:
      * No LIG / EWS / eAuction / commercial / flats
      * Residential Plot lottery schemes ONLY
      * price_min >= 25.0 (or null/unknown)
      * close_date within last 365 days, OR null
      * Naming: "Authority Name + Scheme Name + Year of Launch"
"""

from __future__ import annotations

import hashlib
import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────

MIN_PRICE_LAKH = 25.0

# Keywords that identify EXCLUDED scheme types
EXCLUDED_TYPE_KEYWORDS = [
    "e-auction", "eauction", "e auction",
    "lig ",   " lig",   " lig,",
    "lower income group",
    "ews ",   " ews",   " ews,",
    "economically weaker",
    "affordable housing",   # EWS/LIG umbrella term
    "commercial plot",
    "industrial plot",
    "shop",
    "flat scheme",
    "apartment scheme",
    "housing scheme",       # catches "MHADA Housing Scheme" (flats) — not plots
]

# Keywords that must appear (at least one) for a valid residential plot scheme
REQUIRED_PLOT_KEYWORDS = [
    "residential plot",
    "plot scheme",
    "plot lottery",
    "land scheme",
    "plot allot",
    "sites lottery",        # BDA uses "sites"
    "residential site",
    "plot draw",
]


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _cutoff_date() -> str:
    """365 days ago from today."""
    return (datetime.now(timezone.utc) - timedelta(days=365)).strftime("%Y-%m-%d")


# ── SchemeData dataclass ───────────────────────────────────────────────────

@dataclass
class SchemeData:
    """
    Standard schema for one government residential plot scheme.
    data_source: "LIVE" = scraped from live website | "STATIC" = fallback hardcoded data
    """
    scheme_id:        str
    name:             str
    city:             str
    authority:        str
    status:           str           # OPEN | ACTIVE | UPCOMING | CLOSED
    source_url:       str
    data_source:      str = "STATIC"   # "LIVE" or "STATIC"
    open_date:        Optional[str] = None
    close_date:       Optional[str] = None
    total_plots:      Optional[int] = None
    price_min:        Optional[float] = None
    price_max:        Optional[float] = None
    area_sqft_min:    Optional[int] = None
    area_sqft_max:    Optional[int] = None
    location_details: Optional[str] = None
    apply_url:        Optional[str] = None
    last_updated:     str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    scraper_status:   str = "ok"    # "ok" | "fallback" | "failed"

    def to_dict(self) -> dict:
        return {
            "scheme_id":        self.scheme_id,
            "name":             self.name,
            "city":             self.city,
            "authority":        self.authority,
            "status":           self.status,
            "open_date":        self.open_date,
            "close_date":       self.close_date,
            "total_plots":      self.total_plots,
            "price_min":        self.price_min,
            "price_max":        self.price_max,
            "area_sqft_min":    self.area_sqft_min,
            "area_sqft_max":    self.area_sqft_max,
            "location_details": self.location_details,
            "apply_url":        self.apply_url,
            "source_url":       self.source_url,
            "last_updated":     self.last_updated,
            "data_source":      self.data_source,
            "scraper_status":   self.scraper_status,
        }


# ── ScraperError dataclass ─────────────────────────────────────────────────

@dataclass
class ScraperError:
    """Recorded when a live scrape fails — used in failure summary email."""
    authority:    str
    city:         str
    url:          str
    error_type:   str    # "HTTP_ERROR" | "TIMEOUT" | "PARSE_ERROR" | "SELENIUM_ERROR" | "NO_RESULTS"
    error_detail: str
    timestamp:    str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    used_fallback: bool = True


# ── Filter helpers ─────────────────────────────────────────────────────────

def is_excluded_scheme(name: str) -> bool:
    """Return True if this scheme name indicates an excluded type (LIG/EWS/eAuction/flat)."""
    n = name.lower()
    return any(kw in n for kw in EXCLUDED_TYPE_KEYWORDS)


def is_valid_plot_scheme(name: str) -> bool:
    """Return True if this scheme name indicates a valid residential plot scheme."""
    n = name.lower()
    return any(kw in n for kw in REQUIRED_PLOT_KEYWORDS)


def is_within_date_window(close_date: Optional[str]) -> bool:
    """
    Return True if:
    - close_date is None/null (unknown — include, refresh will handle)
    - close_date >= (today - 365 days)
    """
    if not close_date:
        return True
    return close_date >= _cutoff_date()


def passes_all_filters(scheme: SchemeData) -> bool:
    """Apply all filters. Returns True if scheme should be included."""
    # Excluded type check
    if is_excluded_scheme(scheme.name):
        logger.debug(f"⛔ Excluded type: {scheme.scheme_id} — {scheme.name}")
        return False

    # Must be a plot scheme
    if not is_valid_plot_scheme(scheme.name):
        logger.debug(f"⛔ Not a plot scheme: {scheme.scheme_id} — {scheme.name}")
        return False

    # Date window
    if not is_within_date_window(scheme.close_date):
        logger.debug(f"⛔ Too old: {scheme.scheme_id} close_date={scheme.close_date}")
        return False

    # Price
    if scheme.price_min and scheme.price_min < MIN_PRICE_LAKH:
        logger.debug(f"⛔ Price too low ({scheme.price_min}L): {scheme.scheme_id}")
        return False

    return True


# ── scheme_id generator ────────────────────────────────────────────────────

def make_scheme_id(authority: str, name: str) -> str:
    """Deterministic scheme_id — same scheme always gets same ID."""
    return f"{authority}-{hashlib.md5(f'{authority}-{name}'.encode()).hexdigest()[:12]}"


# ── BaseScraper ────────────────────────────────────────────────────────────

class BaseScraper(ABC):
    """
    Abstract base class for all city/authority scrapers.

    Subclasses must implement:
      - scrape_live() → list[SchemeData]   — attempts live HTTP scraping
      - fallback_schemes() → list[SchemeData]  — hardcoded known schemes

    Optionally override:
      - scrape_selenium() → list[SchemeData]  — JS-rendered page scraping
    """

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept-Language":  "en-IN,en;q=0.9,hi;q=0.8",
        "Accept":           "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding":  "gzip, deflate, br",
    }

    # Override in subclass if Selenium is needed for this portal
    USE_SELENIUM = False

    def __init__(
        self,
        city:      str,
        authority: str,
        base_url:  str,
    ):
        self.city      = city
        self.authority = authority
        self.base_url  = base_url
        self.errors: list[ScraperError] = []

        self._session = requests.Session()
        self._session.headers.update(self.HEADERS)

    # ── HTTP helpers ───────────────────────────────────────────────────────

    def get_soup(self, url: str, retries: int = 2, timeout: int = 15) -> Optional[BeautifulSoup]:
        """
        GET a URL and return a BeautifulSoup object.
        Returns None on failure (caller decides whether to try Selenium or fallback).
        """
        for attempt in range(retries):
            try:
                resp = self._session.get(url, timeout=timeout)
                resp.raise_for_status()
                return BeautifulSoup(resp.text, "html.parser")

            except requests.exceptions.Timeout:
                self._record_error(url, "TIMEOUT", f"Attempt {attempt+1}: timed out after {timeout}s")

            except requests.exceptions.HTTPError as e:
                self._record_error(url, "HTTP_ERROR", f"HTTP {e.response.status_code}: {e}")
                break   # Don't retry 4xx/5xx

            except requests.exceptions.ConnectionError as e:
                self._record_error(url, "CONNECTION_ERROR", f"Attempt {attempt+1}: {e}")

            except Exception as e:
                self._record_error(url, "UNKNOWN", f"Attempt {attempt+1}: {e}")
                break

            time.sleep(2 ** attempt)

        return None

    def get_selenium_soup(self, url: str, wait_css: str = "body", wait_secs: int = 8) -> Optional[BeautifulSoup]:
        """
        Load a page with headless Chromium and return BeautifulSoup.
        Only called when USE_SELENIUM = True and get_soup() failed or returned no results.
        """
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC

            opts = Options()
            opts.add_argument("--headless")
            opts.add_argument("--no-sandbox")
            opts.add_argument("--disable-dev-shm-usage")
            opts.add_argument("--disable-gpu")
            opts.add_argument(f"user-agent={self.HEADERS['User-Agent']}")

            driver = webdriver.Chrome(options=opts)
            try:
                driver.get(url)
                WebDriverWait(driver, wait_secs).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_css))
                )
                return BeautifulSoup(driver.page_source, "html.parser")
            finally:
                driver.quit()

        except Exception as e:
            self._record_error(url, "SELENIUM_ERROR", str(e))
            return None

    # ── Status normalisation ───────────────────────────────────────────────

    @staticmethod
    def normalise_status(raw: str) -> str:
        r = raw.lower().strip()
        if any(k in r for k in ("open", "accept", "available", "live", "active")):
            return "OPEN"
        if any(k in r for k in ("close", "ended", "expired", "over", "sold out")):
            return "CLOSED"
        if any(k in r for k in ("upcoming", "soon", "announced", "forthcoming", "notified")):
            return "UPCOMING"
        return "ACTIVE"

    # ── scheme_id helper ──────────────────────────────────────────────────

    def make_id(self, name: str) -> str:
        return make_scheme_id(self.authority, name)

    # ── Error recording ────────────────────────────────────────────────────

    def _record_error(self, url: str, error_type: str, detail: str):
        err = ScraperError(
            authority=self.authority,
            city=self.city,
            url=url,
            error_type=error_type,
            error_detail=detail,
        )
        self.errors.append(err)
        logger.warning(f"[{self.authority}] {error_type}: {detail}")

    # ── Abstract interface ─────────────────────────────────────────────────

    @abstractmethod
    def scrape_live(self) -> list[SchemeData]:
        """
        Attempt to scrape live data from the government portal.
        Return empty list if nothing found (triggers fallback).
        Set data_source="LIVE" on each returned SchemeData.
        """
        ...

    @abstractmethod
    def fallback_schemes(self) -> list[SchemeData]:
        """
        Hardcoded known schemes — used when live scrape fails or returns nothing.
        Set data_source="STATIC" and scraper_status="fallback" on each SchemeData.
        """
        ...

    # ── Main run entry point ───────────────────────────────────────────────

    def run(self) -> tuple[list[dict], list[ScraperError]]:
        """
        Execute scraping with full fallback chain:
          1. Try scrape_live()
          2. If USE_SELENIUM and live returned nothing, try get_selenium_soup()
             (subclass can call it inside scrape_live)
          3. If still nothing, use fallback_schemes()
          4. Apply all filters
          5. Return (valid_scheme_dicts, errors)
        """
        logger.info(f"[{self.authority}] Scraping {self.city} (url={self.base_url}) ...")
        self.errors = []   # reset per run

        schemes: list[SchemeData] = []
        used_fallback = False

        # Step 1 — live scrape
        try:
            schemes = self.scrape_live()
        except Exception as e:
            self._record_error(self.base_url, "SCRAPE_EXCEPTION", str(e))
            schemes = []

        # Step 2 — fallback if live returned nothing
        if not schemes:
            logger.warning(
                f"[{self.authority}] Live scrape returned 0 results → using fallback data"
            )
            self._record_error(
                self.base_url,
                "NO_RESULTS",
                "Live scrape returned 0 schemes — switched to static fallback data"
            )
            used_fallback = True
            try:
                schemes = self.fallback_schemes()
                for s in schemes:
                    s.data_source    = "STATIC"
                    s.scraper_status = "fallback"
            except Exception as e:
                self._record_error(self.base_url, "FALLBACK_FAILED", str(e))
                schemes = []

        # Step 3 — apply all filters
        valid = [s for s in schemes if passes_all_filters(s)]
        filtered_out = len(schemes) - len(valid)

        logger.info(
            f"[{self.authority}] "
            f"{'STATIC' if used_fallback else 'LIVE'}: "
            f"{len(valid)} valid / {len(schemes)} total "
            f"({filtered_out} filtered out)"
        )

        return [s.to_dict() for s in valid], self.errors
