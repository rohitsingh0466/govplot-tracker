"""
GovPlot Tracker — Base Scraper v4.0
=====================================
4-tier scraping strategy per city:
  Tier 1 → Static HTML → requests + BeautifulSoup (+ ScraperAPI proxy for .gov.in)
  Tier 2 → JS-rendered → Playwright bundled Chromium
  Tier 3 → CAPTCHA/auth-gated → public notice page only
  Tier 4 → Aggregator fallback → eauctionsindia.com, 99acres.com, awaszone.com

KEY ANTI-SCRAPING BYPASS TECHNIQUES:
  1. ScraperAPI proxy for .gov.in / .nic.in (blocked from GitHub Actions Azure runners)
  2. Random User-Agent rotation (15+ real browser UAs)
  3. Playwright stealth mode — removes navigator.webdriver fingerprint
  4. httpx as alternate TLS fingerprint (bypasses some WAFs)
  5. SSL verify=False for sites with expired certs (MDDA, PDA)
  6. Random delay between requests (1.5–4.5s jitter)
  7. Hindi/Devanagari keyword detection for UP authority sites
  8. Aggregator fallback — aggregators cache scheme data within hours of launch
"""

from __future__ import annotations

import hashlib
import logging
import os
import random
import re
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Optional
from urllib.parse import urlencode
from scraper.scm_config_loader import ScraperConfig

import requests
from bs4 import BeautifulSoup

from scraper.cities.city_config import (
    PROXY_REQUIRED_DOMAINS,
    SSL_VERIFY_FALSE_DOMAINS,
    PLAYWRIGHT_WAIT_SELECTORS,
    HINDI_SCHEME_KEYWORDS,
    SCHEME_KEYWORDS_INCLUDE,
    SCHEME_KEYWORDS_EXCLUDE,
)

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
MIN_PRICE_LAKH = 25.0

# Random User-Agent pool — rotate per request
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
]

ACCEPT_LANGUAGES = [
    "en-IN,en;q=0.9,hi;q=0.8",
    "hi-IN,hi;q=0.9,en;q=0.8",
    "en-US,en;q=0.9,hi;q=0.7",
    "en-GB,en;q=0.9,en-IN;q=0.8",
]


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _cutoff_date() -> str:
    return (datetime.now(timezone.utc) - timedelta(days=365)).strftime("%Y-%m-%d")


def _random_delay(min_s: float = 1.5, max_s: float = 4.5) -> None:
    """Random delay to avoid rate limiting."""
    time.sleep(min_s + random.random() * (max_s - min_s))


def _needs_proxy(url: str) -> bool:
    """Return True if URL domain is blocked from GitHub Actions Azure runners."""
    return any(d in url for d in PROXY_REQUIRED_DOMAINS)


def _needs_ssl_bypass(url: str) -> bool:
    """Return True if URL has expired/self-signed SSL cert."""
    return any(d in url for d in SSL_VERIFY_FALSE_DOMAINS)


def _scraper_api_url(url: str, render_js: bool = False) -> str:
    """Wrap URL with ScraperAPI Indian proxy."""
    key = os.getenv("SCRAPER_API_KEY", "")
    if not key:
        return url
    params = {
        "api_key": key,
        "url": url,
        "country_code": "in",
        "render": "true" if render_js else "false",
    }
    return f"https://api.scraperapi.com/?{urlencode(params)}"


def _random_headers() -> dict:
    """Return randomized browser-like headers."""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": random.choice(ACCEPT_LANGUAGES),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
    }


# ── SchemeData ────────────────────────────────────────────────────────────────

@dataclass
class SchemeData:
    scheme_id: str
    name: str
    city: str
    authority: str
    status: str
    source_url: str
    data_source: str = "STATIC"
    open_date: Optional[str] = None
    close_date: Optional[str] = None
    total_plots: Optional[int] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    area_sqft_min: Optional[int] = None
    area_sqft_max: Optional[int] = None
    location_details: Optional[str] = None
    apply_url: Optional[str] = None
    last_updated: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    scraper_status: str = "ok"
    # Admin-editable fields (set via Supabase dashboard)
    is_manually_edited: bool = False
    manual_notes: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "scheme_id": self.scheme_id,
            "name": self.name,
            "city": self.city,
            "authority": self.authority,
            "status": self.status,
            "open_date": self.open_date,
            "close_date": self.close_date,
            "total_plots": self.total_plots,
            "price_min": self.price_min,
            "price_max": self.price_max,
            "area_sqft_min": self.area_sqft_min,
            "area_sqft_max": self.area_sqft_max,
            "location_details": self.location_details,
            "apply_url": self.apply_url,
            "source_url": self.source_url,
            "last_updated": self.last_updated,
            "data_source": self.data_source,
            "scraper_status": self.scraper_status,
            "is_active": True,
        }


@dataclass
class ScraperError:
    authority: str
    city: str
    url: str
    error_type: str
    error_detail: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    used_fallback: bool = True


# ── Filter helpers ────────────────────────────────────────────────────────────

def is_excluded_scheme(name: str) -> bool:
    n = name.lower()
    return any(kw in n for kw in SCHEME_KEYWORDS_EXCLUDE)


def is_valid_plot_scheme(name: str) -> bool:
    n = name.lower()
    # Check English keywords
    if any(kw in n for kw in SCHEME_KEYWORDS_INCLUDE):
        return True
    # Check Hindi keywords
    if any(kw in name for kw in HINDI_SCHEME_KEYWORDS):
        return True
    return False


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


def make_scheme(
    authority: str, city: str, name: str, status: str,
    source_url: str, data_source: str = "LIVE", **kwargs
) -> SchemeData:
    """Convenience factory for SchemeData."""
    return SchemeData(
        scheme_id=make_scheme_id(authority, name),
        name=name, city=city, authority=authority, status=status,
        source_url=source_url,
        apply_url=kwargs.pop("apply_url", source_url),
        data_source=data_source,
        scraper_status="ok" if data_source == "LIVE" else "fallback",
        **kwargs,
    )


# ── BaseScraper ───────────────────────────────────────────────────────────────

class BaseScraper(ABC):
    """
    Abstract base class for all 20 GovPlot city scrapers.

    Subclasses must implement:
      scrape_tier1()       → Try static HTML (requests + BS4)
      scrape_tier2()       → Try JS-rendered (Playwright)
      scrape_aggregators() → Try aggregator sites (always added)
      fallback_schemes()   → Hardcoded static data

    run() calls them in order: tier1 → tier2 → aggregators → fallback
    Aggregators are ALWAYS tried alongside tiers 1–3, not just as last resort.
    """

    def __init__(self, city: str, authority: str, base_url: str, config=None):
        self.city      = city
        self.authority = authority
        self.base_url  = base_url
        self.errors:   list[ScraperError] = []
        self.config    = config

        # ── SCM Phase 3: DB-driven URL config ────────────────────────────────
        # When config is provided (loaded from Supabase SCM), use DB URLs.
        # When config is None (Supabase unreachable), fall back to hardcoded
        # SCHEME_URLS / PORTALS defined in each city subclass — zero behaviour change.
        if config:
            self._db_primary_urls    = config.all_primary_and_scheme_urls()
            self._db_fallback_urls   = config.all_fallback_urls()
            self._db_aggregator_urls = config.aggregator_urls
            if config.requires_playwright:
                self.USE_PLAYWRIGHT = True
            if config.primary_urls:
                self.base_url = config.primary_urls[0]
        else:
            self._db_primary_urls    = []
            self._db_fallback_urls   = []
            self._db_aggregator_urls = []

        # Tracking fields for run logger
        self._last_url_attempted  = None
        self._last_url_type       = None
        self._last_tier_attempted = None
        self._used_playwright     = False
        self._used_proxy          = False

    # u2500u2500 SCM Phase 3: DB-driven URL helpers u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

    # ── SCM Phase 3: DB-driven URL helpers ──────────────────────────────────────

    def get_urls_to_try(self) -> list:
        """
        Returns the ordered list of URLs to attempt for this authority.
        DB URLs (from admin portal) take priority over hardcoded SCHEME_URLS.
        City scrapers replace:
            for url in self.SCHEME_URLS:
        with:
            for url in self.get_urls_to_try():
        """
        if self._db_primary_urls:
            seen = set()
            urls = []
            for u in self._db_primary_urls:
                if u not in seen:
                    seen.add(u)
                    urls.append(u)
            for u in getattr(self, "SCHEME_URLS", []):
                if u not in seen:
                    seen.add(u)
                    urls.append(u)
            for u in self._db_fallback_urls:
                if u not in seen:
                    seen.add(u)
                    urls.append(u)
            return urls
        return list(getattr(self, "SCHEME_URLS", [self.base_url]))

    def get_sub_pages(self, parent_url: str) -> list:
        """Returns enabled sub-page URLs for a given parent URL (DB-driven)."""
        if self.config:
            return self.config.get_sub_pages(parent_url)
        return []

    def get_aggregator_urls(self) -> list:
        """Returns aggregator URLs. DB takes priority over hardcoded PORTALS."""
        if self._db_aggregator_urls:
            return self._db_aggregator_urls
        return list(getattr(self, "PORTALS", []))

    # ── Tier 1: Static HTML via requests ─────────────────────────────────────

    def get_soup(
        self,
        url: str,
        retries: int = 2,
        timeout: int = 20,
        use_proxy: Optional[bool] = None,
    ) -> Optional[BeautifulSoup]:
        """
        GET → BeautifulSoup. Auto-applies:
        - ScraperAPI proxy for .gov.in/.nic.in domains
        - SSL verify=False for known expired-cert domains
        - Random headers and delays
        Falls back to httpx on failure.
        """
        # Auto-detect proxy need
        if use_proxy is None:
            use_proxy = _needs_proxy(url) and bool(os.getenv("SCRAPER_API_KEY", ""))

        verify_ssl = not _needs_ssl_bypass(url)
        fetch_url = _scraper_api_url(url) if use_proxy else url

        if use_proxy:
            logger.debug(f"[{self.authority}] ScraperAPI proxy → {url}")

        for attempt in range(retries):
            try:
                _random_delay(0.8, 2.5)
                headers = _random_headers()
                resp = requests.get(
                    fetch_url,
                    headers=headers,
                    timeout=timeout,
                    verify=verify_ssl,
                )
                resp.raise_for_status()
                # Try UTF-8 first, then detect encoding
                try:
                    text = resp.content.decode("utf-8")
                except UnicodeDecodeError:
                    text = resp.content.decode(resp.apparent_encoding or "utf-8", errors="replace")
                return BeautifulSoup(text, "html.parser")

            except requests.exceptions.Timeout:
                self._record_error(url, "TIMEOUT", f"Attempt {attempt + 1}: timeout after {timeout}s")
            except requests.exceptions.HTTPError as e:
                code = e.response.status_code if e.response else "?"
                self._record_error(url, "HTTP_ERROR", f"HTTP {code}")
                break
            except requests.exceptions.ConnectionError as e:
                msg = str(e)
                err_type = "DNS_BLOCKED" if "NameResolutionError" in msg or "Name or service" in msg else "CONNECTION_ERROR"
                self._record_error(url, err_type, msg[:200])
                if err_type == "DNS_BLOCKED":
                    break
            except Exception as e:
                self._record_error(url, "UNKNOWN", str(e)[:200])
                break

            time.sleep((2 ** attempt) + random.uniform(0, 1.5))

        # Fallback: try httpx (different TLS fingerprint)
        return self._get_via_httpx(url)

    def _get_via_httpx(self, url: str, timeout: int = 20) -> Optional[BeautifulSoup]:
        """httpx — different TLS fingerprint, bypasses some WAFs."""
        try:
            import httpx
            verify = not _needs_ssl_bypass(url)
            with httpx.Client(
                headers=_random_headers(),
                follow_redirects=True,
                timeout=timeout,
                verify=verify,
            ) as client:
                resp = client.get(url)
                resp.raise_for_status()
                return BeautifulSoup(resp.text, "html.parser")
        except Exception as e:
            logger.debug(f"[{self.authority}] httpx failed {url}: {e}")
            return None

    # ── Tier 2: Playwright (JS-rendered) ─────────────────────────────────────

    def get_playwright_soup(
        self,
        url: str,
        wait_selector: Optional[str] = None,
        wait_secs: int = 12,
        scroll: bool = False,
        stealth: bool = True,
    ) -> Optional[BeautifulSoup]:
        """
        Playwright with stealth mode.
        - Removes navigator.webdriver fingerprint
        - Randomizes viewport
        - Blocks images/fonts for speed
        - Scrolls if needed for lazy-loaded content
        """
        if wait_selector is None:
            wait_selector = PLAYWRIGHT_WAIT_SELECTORS.get(self.authority, "body")

        try:
            from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

            with sync_playwright() as pw:
                browser = pw.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-blink-features=AutomationControlled",
                        "--disable-features=IsolateOrigins,site-per-process",
                        "--disable-extensions",
                        "--disable-infobars",
                        f"--window-size={random.randint(1200, 1440)},{random.randint(800, 900)}",
                    ],
                )
                ua = random.choice(USER_AGENTS)
                context = browser.new_context(
                    user_agent=ua,
                    locale=random.choice(["en-IN", "hi-IN"]),
                    viewport={"width": random.randint(1200, 1440), "height": random.randint(800, 900)},
                    extra_http_headers={"Accept-Language": random.choice(ACCEPT_LANGUAGES)},
                )

                # Stealth: remove webdriver fingerprint
                if stealth:
                    context.add_init_script("""
                        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                        Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                        Object.defineProperty(navigator, 'languages', {get: () => ['en-IN', 'hi-IN', 'en']});
                        window.chrome = {runtime: {}};
                    """)

                page = context.new_page()

                # Block images/fonts/media for speed
                def handle_route(route):
                    if route.request.resource_type in ("image", "font", "media", "stylesheet"):
                        route.abort()
                    else:
                        route.continue_()

                page.route("**/*", handle_route)

                _random_delay(0.5, 1.5)
                page.goto(url, wait_until="domcontentloaded", timeout=wait_secs * 1000)

                try:
                    page.wait_for_selector(wait_selector, timeout=wait_secs * 1000)
                except PWTimeout:
                    logger.debug(f"[{self.authority}] Playwright: selector '{wait_selector}' timeout — using page as-is")

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

    # ── Tier 3 helper: PDF text extraction ───────────────────────────────────

    def get_pdf_text(self, url: str) -> Optional[str]:
        """Download and extract text from a PDF scheme notice."""
        try:
            import io
            resp = requests.get(url, headers=_random_headers(), timeout=30, verify=False)
            resp.raise_for_status()
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(resp.content))
                return "\n".join(p.extract_text() or "" for p in reader.pages)
            except ImportError:
                return None
        except Exception as e:
            logger.debug(f"[{self.authority}] PDF extract failed {url}: {e}")
            return None

    # ── Shared helpers ────────────────────────────────────────────────────────

    @staticmethod
    def normalise_status(raw: str) -> str:
        r = raw.lower().strip()
        if any(k in r for k in ("open", "accept", "available", "live", "active", "ongoing", "current")):
            return "OPEN"
        if any(k in r for k in ("close", "ended", "expired", "over", "sold", "complet", "last date passed")):
            return "CLOSED"
        if any(k in r for k in ("upcoming", "soon", "announced", "forthcoming", "notified", "proposed", "आगामी")):
            return "UPCOMING"
        return "ACTIVE"

    @staticmethod
    def parse_date(text: str) -> Optional[str]:
        """Parse DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD."""
        m = re.search(r"(\d{2})[/\-](\d{2})[/\-](\d{4})", text)
        if m:
            return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"
        # Try Month-name format: 15 April 2026
        months = {"jan": "01", "feb": "02", "mar": "03", "apr": "04", "may": "05",
                  "jun": "06", "jul": "07", "aug": "08", "sep": "09", "oct": "10",
                  "nov": "11", "dec": "12"}
        m2 = re.search(r"(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})", text, re.IGNORECASE)
        if m2:
            return f"{m2.group(3)}-{months[m2.group(2).lower()]}-{m2.group(1).zfill(2)}"
        return None

    @staticmethod
    def parse_price_lakh(text: str) -> Optional[float]:
        """Parse price as lakhs from text."""
        text = text.replace(",", "")
        m = re.search(r"(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b", text, re.IGNORECASE)
        if m:
            return float(m.group(1))
        m2 = re.search(r"(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d+)?)\s*(?:crore|cr)\b", text, re.IGNORECASE)
        if m2:
            return round(float(m2.group(1)) * 100, 1)
        return None

    @staticmethod
    def parse_plots(text: str) -> Optional[int]:
        """Parse plot count from text."""
        m = re.search(r"(\d[\d,]+)\s*(?:plots?|sites?|units?|भूखंड)", text, re.IGNORECASE)
        if m:
            return int(m.group(1).replace(",", ""))
        return None

    def make_id(self, name: str) -> str:
        return make_scheme_id(self.authority, name)

    def _record_error(self, url: str, error_type: str, detail: str):
        self.errors.append(ScraperError(
            authority=self.authority, city=self.city,
            url=url, error_type=error_type, error_detail=detail,
        ))
        logger.warning(f"[{self.authority}] {error_type}: {detail[:120]}")

    # ── Abstract interface ────────────────────────────────────────────────────

    @abstractmethod
    def scrape_tier1(self) -> list[SchemeData]:
        """Attempt 1: Static HTML via requests."""
        ...

    def scrape_tier2(self) -> list[SchemeData]:
        """Attempt 2: JS-rendered via Playwright. Override if needed."""
        return []

    @abstractmethod
    def scrape_aggregators(self) -> list[SchemeData]:
        """Attempt 4: Aggregator sites (always run alongside tiers 1-3)."""
        ...

    @abstractmethod
    def fallback_schemes(self) -> list[SchemeData]:
        """Static hardcoded data. Last resort."""
        ...

    # ── run() — Orchestrates all tiers ───────────────────────────────────────

    def run(self) -> tuple[list[dict], list[ScraperError]]:
        logger.info(f"[{self.authority}] Scraping {self.city} ...")
        self.errors = []
        schemes: list[SchemeData] = []
        used_fallback = False

        # Tier 1: Static HTML
        try:
            t1 = self.scrape_tier1()
            if t1:
                logger.info(f"[{self.authority}] Tier 1 (HTML): {len(t1)} schemes")
                schemes.extend(t1)
        except Exception as e:
            self._record_error(self.base_url, "TIER1_EXCEPTION", str(e))

        # Tier 2: JS-rendered (if tier 1 got nothing)
        if not schemes:
            try:
                t2 = self.scrape_tier2()
                if t2:
                    logger.info(f"[{self.authority}] Tier 2 (Playwright): {len(t2)} schemes")
                    schemes.extend(t2)
            except Exception as e:
                self._record_error(self.base_url, "TIER2_EXCEPTION", str(e))

        # Aggregators: ALWAYS run — adds/updates schemes from public aggregators
        try:
            agg = self.scrape_aggregators()
            if agg:
                # Merge: don't duplicate scheme_ids already found
                existing_ids = {s.scheme_id for s in schemes}
                new_agg = [s for s in agg if s.scheme_id not in existing_ids]
                logger.info(f"[{self.authority}] Aggregators: {len(new_agg)} new schemes")
                schemes.extend(new_agg)
        except Exception as e:
            self._record_error(self.base_url, "AGGREGATOR_EXCEPTION", str(e))

        # Fallback: if nothing found at all
        if not schemes:
            logger.warning(f"[{self.authority}] All tiers failed → static fallback")
            self._record_error(self.base_url, "NO_RESULTS", "All tiers returned 0 schemes")
            used_fallback = True
            try:
                fb = self.fallback_schemes()
                for s in fb:
                    s.data_source = "STATIC"
                    s.scraper_status = "fallback"
                schemes.extend(fb)
            except Exception as e:
                self._record_error(self.base_url, "FALLBACK_FAILED", str(e))

        # Filter and deduplicate
        seen: set[str] = set()
        valid: list[SchemeData] = []
        for s in schemes:
            if s.scheme_id in seen:
                continue
            seen.add(s.scheme_id)
            if passes_all_filters(s):
                valid.append(s)

        filtered_out = len(schemes) - len(valid)
        icon = "🟡 STATIC" if used_fallback else "🟢 LIVE  "
        logger.info(
            f"{icon} [{self.authority}] "
            f"{len(valid)} valid / {len(schemes)} total "
            f"({filtered_out} filtered out)"
        )
        return [s.to_dict() for s in valid], self.errors
