"""
GovPlot Tracker — Base Scraper v3.3
=====================================
KEY CHANGES FROM v3.2:

  FIX 1 — Playwright is now PRIMARY JS scraper
    Selenium kept as secondary fallback.
    Playwright downloads its own Chromium via `playwright install` —
    no dependency on system Chrome path. Always works on GitHub Actions.

  FIX 2 — ScraperAPI proxy for .gov.in / .nic.in domains
    Indian government portals block GitHub Actions runner IPs (Azure US).
    When SCRAPER_API_KEY env var is set, requests to .gov.in and .nic.in
    are automatically routed through ScraperAPI's Indian proxy pool.
    Without the key: direct requests still attempted (will likely get
    DNS/connection errors on blocked domains, fallback kicks in cleanly).

  FIX 3 — httpx added as second HTTP client
    Some sites that block requests.Session work with httpx.
    get_soup() tries requests first, then httpx on failure.

  FIX 4 — Retry logic improved
    Exponential backoff with jitter. Separate timeout for Playwright.

EXISTING CODE UNCHANGED:
  - SchemeData dataclass — identical
  - ScraperError dataclass — identical
  - All filter logic (is_excluded_scheme, is_valid_plot_scheme, etc.) — identical
  - make_scheme_id() — identical
  - passes_all_filters() — identical
  - BaseScraper abstract interface (scrape_live, fallback_schemes) — identical
  - run() entry point — identical
"""

from __future__ import annotations

import hashlib
import logging
import os
import random
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Optional
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

MIN_PRICE_LAKH = 25.0

EXCLUDED_TYPE_KEYWORDS = [
    "e-auction", "eauction", "e auction",
    "lig ",   " lig",   " lig,",
    "lower income group",
    "ews ",   " ews",   " ews,",
    "economically weaker",
    "affordable housing",
    "commercial plot",
    "industrial plot",
    "shop",
    "flat scheme",
    "apartment scheme",
    "housing scheme",
]

REQUIRED_PLOT_KEYWORDS = [
    "residential plot",
    "plot scheme",
    "plot lottery",
    "land scheme",
    "plot allot",
    "sites lottery",
    "residential site",
    "plot draw",
]

# Domains that are blocked by NIC India firewall on GitHub Actions runners
# Requests to these go via ScraperAPI when SCRAPER_API_KEY is set
_BLOCKED_DOMAINS = (
    ".gov.in",
    ".nic.in",
    "lda.up.",
    "awasvikas.",
    "hsvphry.",
    "adaagra.",
    "gdaghaziabad.",
)


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _cutoff_date() -> str:
    return (datetime.now(timezone.utc) - timedelta(days=365)).strftime("%Y-%m-%d")


def _needs_proxy(url: str) -> bool:
    """Return True if this URL is likely blocked on GitHub Actions runners."""
    return any(d in url for d in _BLOCKED_DOMAINS)


def _scraper_api_url(url: str) -> str:
    """
    Wrap a URL with ScraperAPI proxy.
    ScraperAPI handles bot detection, CAPTCHAs, and geo-restrictions.
    country_code=in routes through Indian residential IPs.
    """
    key = os.getenv("SCRAPER_API_KEY", "")
    if not key:
        return url  # no key → direct request (will likely fail for .gov.in)
    params = {
        "api_key": key,
        "url": url,
        "country_code": "in",
        "render": "false",   # HTML only (faster). Set "true" for JS sites.
    }
    return f"https://api.scraperapi.com/?{urlencode(params)}"


# ── SchemeData — UNCHANGED from v3.2 ──────────────────────────────────────────

@dataclass
class SchemeData:
    scheme_id:        str
    name:             str
    city:             str
    authority:        str
    status:           str
    source_url:       str
    data_source:      str = "STATIC"
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
    scraper_status:   str = "ok"

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


# ── ScraperError — UNCHANGED from v3.2 ────────────────────────────────────────

@dataclass
class ScraperError:
    authority:    str
    city:         str
    url:          str
    error_type:   str
    error_detail: str
    timestamp:    str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    used_fallback: bool = True


# ── Filter helpers — UNCHANGED from v3.2 ──────────────────────────────────────

def is_excluded_scheme(name: str) -> bool:
    n = name.lower()
    return any(kw in n for kw in EXCLUDED_TYPE_KEYWORDS)


def is_valid_plot_scheme(name: str) -> bool:
    n = name.lower()
    return any(kw in n for kw in REQUIRED_PLOT_KEYWORDS)


def is_within_date_window(close_date: Optional[str]) -> bool:
    if not close_date:
        return True
    return close_date >= _cutoff_date()


def passes_all_filters(scheme: SchemeData) -> bool:
    if is_excluded_scheme(scheme.name):
        logger.debug(f"⛔ Excluded: {scheme.scheme_id} — {scheme.name}")
        return False
    if not is_valid_plot_scheme(scheme.name):
        logger.debug(f"⛔ Not a plot scheme: {scheme.scheme_id}")
        return False
    if not is_within_date_window(scheme.close_date):
        logger.debug(f"⛔ Too old: {scheme.scheme_id}")
        return False
    if scheme.price_min and scheme.price_min < MIN_PRICE_LAKH:
        logger.debug(f"⛔ Price too low: {scheme.scheme_id}")
        return False
    return True


def make_scheme_id(authority: str, name: str) -> str:
    return f"{authority}-{hashlib.md5(f'{authority}-{name}'.encode()).hexdigest()[:12]}"


# ── BaseScraper ────────────────────────────────────────────────────────────────

class BaseScraper(ABC):
    """
    Abstract base class for all GovPlot scrapers.

    Scraping priority chain per URL:
      1. requests + ScraperAPI proxy (if SCRAPER_API_KEY set and domain is blocked)
      2. requests direct (fast, works for non-blocked domains)
      3. httpx (different TLS fingerprint — bypasses some bot detection)
      4. Playwright (JS-rendered pages — BDA, DDA, YEIDA portals)
      5. Selenium with Google Chrome (legacy fallback, USE_SELENIUM=True)
      6. fallback_schemes() (hardcoded known data)

    Subclasses must implement:
      scrape_live() → list[SchemeData]
      fallback_schemes() → list[SchemeData]
    """

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language":  "en-IN,en;q=0.9,hi;q=0.8",
        "Accept":           "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding":  "gzip, deflate, br",
    }

    # Set True in subclass if portal needs JS rendering
    USE_SELENIUM  = False
    USE_PLAYWRIGHT = False  # preferred over Selenium for JS

    def __init__(self, city: str, authority: str, base_url: str):
        self.city      = city
        self.authority = authority
        self.base_url  = base_url
        self.errors: list[ScraperError] = []
        self._session = requests.Session()
        self._session.headers.update(self.HEADERS)

    # ── HTTP: requests + ScraperAPI proxy ─────────────────────────────────────

    def get_soup(
        self,
        url: str,
        retries: int = 2,
        timeout: int = 20,
    ) -> Optional[BeautifulSoup]:
        """
        GET a URL and return BeautifulSoup.
        Automatically routes .gov.in / .nic.in through ScraperAPI proxy when
        SCRAPER_API_KEY is set in environment.
        Falls back to httpx on requests failure.
        """
        # Try requests (with proxy if needed)
        soup = self._get_via_requests(url, retries=retries, timeout=timeout)
        if soup:
            return soup

        # Try httpx as a second HTTP client (different TLS fingerprint)
        soup = self._get_via_httpx(url, timeout=timeout)
        if soup:
            return soup

        return None

    def _get_via_requests(
        self,
        url: str,
        retries: int = 2,
        timeout: int = 20,
    ) -> Optional[BeautifulSoup]:
        """requests.Session with optional ScraperAPI proxy routing."""
        fetch_url = url
        use_proxy = _needs_proxy(url) and os.getenv("SCRAPER_API_KEY", "")
        if use_proxy:
            fetch_url = _scraper_api_url(url)
            logger.debug(f"[{self.authority}] Using ScraperAPI proxy for {url}")

        for attempt in range(retries):
            try:
                resp = self._session.get(fetch_url, timeout=timeout)
                resp.raise_for_status()
                return BeautifulSoup(resp.text, "html.parser")

            except requests.exceptions.Timeout:
                self._record_error(url, "TIMEOUT", f"Attempt {attempt+1}: timed out after {timeout}s")

            except requests.exceptions.HTTPError as e:
                code = e.response.status_code if e.response else "?"
                self._record_error(url, "HTTP_ERROR", f"HTTP {code}: {e}")
                break  # Don't retry 4xx/5xx

            except requests.exceptions.ConnectionError as e:
                msg = str(e)
                # Classify DNS failures separately — they won't recover with retry
                err_type = "DNS_BLOCKED" if "NameResolutionError" in msg or "Name or service not known" in msg else "CONNECTION_ERROR"
                self._record_error(url, err_type, f"Attempt {attempt+1}: {msg[:200]}")
                if err_type == "DNS_BLOCKED":
                    break  # DNS failure won't fix with retry

            except Exception as e:
                self._record_error(url, "UNKNOWN", f"Attempt {attempt+1}: {e}")
                break

            # Exponential backoff with jitter
            time.sleep((2 ** attempt) + random.uniform(0, 1))

        return None

    def _get_via_httpx(self, url: str, timeout: int = 20) -> Optional[BeautifulSoup]:
        """
        httpx as alternative HTTP client.
        Has a different TLS fingerprint than requests — bypasses some WAFs.
        """
        try:
            import httpx
            with httpx.Client(
                headers=self.HEADERS,
                follow_redirects=True,
                timeout=timeout,
                verify=False,  # some .gov.in sites have expired certs
            ) as client:
                resp = client.get(url)
                resp.raise_for_status()
                return BeautifulSoup(resp.text, "html.parser")
        except Exception as e:
            logger.debug(f"[{self.authority}] httpx failed for {url}: {e}")
            return None

    # ── Playwright: PRIMARY JS scraper (NEW in v3.3) ───────────────────────────

    def get_playwright_soup(
        self,
        url: str,
        wait_selector: str = "body",
        wait_secs: int = 10,
        scroll: bool = False,
    ) -> Optional[BeautifulSoup]:
        """
        Render a page with Playwright's bundled Chromium.
        This is now the PRIMARY JS scraper — replaces Selenium.
        Playwright installs its OWN Chromium via `playwright install chromium`
        so it NEVER has the "no chrome binary" problem.

        Args:
            url:           Page to load
            wait_selector: CSS selector to wait for before extracting HTML
            wait_secs:    Max seconds to wait for selector
            scroll:       If True, scroll to bottom to trigger lazy loading
        """
        try:
            from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

            with sync_playwright() as pw:
                browser = pw.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-blink-features=AutomationControlled",
                        "--disable-extensions",
                    ],
                )
                context = browser.new_context(
                    user_agent=self.HEADERS["User-Agent"],
                    locale="en-IN",
                    viewport={"width": 1280, "height": 900},
                )
                page = context.new_page()

                # Block images and fonts to speed up load
                page.route(
                    "**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf}",
                    lambda r: r.abort()
                )

                page.goto(url, wait_until="domcontentloaded", timeout=wait_secs * 1000)

                try:
                    page.wait_for_selector(wait_selector, timeout=wait_secs * 1000)
                except PWTimeout:
                    logger.debug(f"[{self.authority}] Playwright: selector '{wait_selector}' not found — using page as-is")

                if scroll:
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    time.sleep(1.5)

                html = page.content()
                browser.close()
                return BeautifulSoup(html, "html.parser")

        except Exception as e:
            self._record_error(url, "PLAYWRIGHT_ERROR", str(e)[:300])
            logger.warning(f"[{self.authority}] Playwright failed: {e}")
            return None

    # ── Selenium: SECONDARY JS scraper (legacy, kept for compatibility) ─────────

    def get_selenium_soup(
        self,
        url: str,
        wait_css: str = "body",
        wait_secs: int = 10,
    ) -> Optional[BeautifulSoup]:
        """
        Selenium with Google Chrome (installed via official Google repo in CI).
        USE_SELENIUM = True in subclass to enable.
        Now used only as fallback if Playwright is unavailable.
        Binary path: /usr/bin/google-chrome (fixed from v3.2 snap issue).
        """
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.chrome.service import Service
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC

            opts = Options()
            opts.add_argument("--headless=new")        # new headless mode
            opts.add_argument("--no-sandbox")
            opts.add_argument("--disable-dev-shm-usage")
            opts.add_argument("--disable-gpu")
            opts.add_argument("--window-size=1280,900")
            opts.add_argument(f"--user-agent={self.HEADERS['User-Agent']}")
            opts.add_argument("--disable-blink-features=AutomationControlled")
            opts.add_experimental_option("excludeSwitches", ["enable-automation"])
            opts.add_experimental_option("useAutomationExtension", False)

            # Use explicit binary path — set by workflow, fallback to standard location
            chrome_bin = os.getenv("CHROME_BIN", "/usr/bin/google-chrome")
            if os.path.exists(chrome_bin):
                opts.binary_location = chrome_bin

            driver = webdriver.Chrome(options=opts)
            driver.set_page_load_timeout(wait_secs + 10)

            try:
                driver.get(url)
                WebDriverWait(driver, wait_secs).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_css))
                )
                return BeautifulSoup(driver.page_source, "html.parser")
            finally:
                driver.quit()

        except Exception as e:
            self._record_error(url, "SELENIUM_ERROR", str(e)[:300])
            logger.warning(f"[{self.authority}] Selenium failed: {e}")
            return None

    # ── Status normalisation — UNCHANGED ──────────────────────────────────────

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

    def make_id(self, name: str) -> str:
        return make_scheme_id(self.authority, name)

    def _record_error(self, url: str, error_type: str, detail: str):
        err = ScraperError(
            authority=self.authority,
            city=self.city,
            url=url,
            error_type=error_type,
            error_detail=detail,
        )
        self.errors.append(err)
        logger.warning(f"[{self.authority}] {error_type}: {detail[:120]}")

    # ── Abstract interface — UNCHANGED from v3.2 ──────────────────────────────

    @abstractmethod
    def scrape_live(self) -> list[SchemeData]:
        ...

    @abstractmethod
    def fallback_schemes(self) -> list[SchemeData]:
        ...

    # ── run() — UNCHANGED from v3.2 ───────────────────────────────────────────

    def run(self) -> tuple[list[dict], list[ScraperError]]:
        logger.info(f"[{self.authority}] Scraping {self.city} (url={self.base_url}) ...")
        self.errors = []
        schemes: list[SchemeData] = []
        used_fallback = False

        try:
            schemes = self.scrape_live()
        except Exception as e:
            self._record_error(self.base_url, "SCRAPE_EXCEPTION", str(e))
            schemes = []

        if not schemes:
            logger.warning(f"[{self.authority}] Live scrape returned 0 results → using fallback data")
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

        valid = [s for s in schemes if passes_all_filters(s)]
        filtered_out = len(schemes) - len(valid)
        logger.info(
            f"[{self.authority}] "
            f"{'STATIC' if used_fallback else 'LIVE'}: "
            f"{len(valid)} valid / {len(schemes)} total "
            f"({filtered_out} filtered out)"
        )
        return [s.to_dict() for s in valid], self.errors
