"""
GovPlot Tracker - Base Scraper
All city scrapers inherit from this class.
"""

import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


@dataclass
class SchemeData:
    """Standard schema for a government plot scheme."""
    scheme_id: str
    name: str
    city: str
    authority: str          # e.g. LDA, BDA, HSVP
    status: str             # OPEN | CLOSED | ACTIVE | UPCOMING
    open_date: Optional[str] = None
    close_date: Optional[str] = None
    total_plots: Optional[int] = None
    price_min: Optional[float] = None   # in INR lakhs
    price_max: Optional[float] = None
    area_sqft_min: Optional[int] = None
    area_sqft_max: Optional[int] = None
    location_details: Optional[str] = None
    apply_url: Optional[str] = None
    source_url: str = ""
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    raw_data: dict = field(default_factory=dict)

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
        }


class BaseScraper(ABC):
    """Abstract base class for all city scrapers."""

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-IN,en;q=0.9",
    }

    def __init__(self, city: str, authority: str, base_url: str, use_selenium: bool = False):
        self.city = city
        self.authority = authority
        self.base_url = base_url
        self.use_selenium = use_selenium
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)
        self.driver = None

    # ------------------------------------------------------------------ #
    #  Selenium helpers
    # ------------------------------------------------------------------ #
    def _get_driver(self) -> webdriver.Chrome:
        if self.driver is None:
            opts = Options()
            opts.add_argument("--headless")
            opts.add_argument("--no-sandbox")
            opts.add_argument("--disable-dev-shm-usage")
            opts.add_argument("--disable-blink-features=AutomationControlled")
            opts.add_argument(f"user-agent={self.HEADERS['User-Agent']}")
            self.driver = webdriver.Chrome(options=opts)
        return self.driver

    def _close_driver(self):
        if self.driver:
            self.driver.quit()
            self.driver = None

    # ------------------------------------------------------------------ #
    #  HTTP helpers
    # ------------------------------------------------------------------ #
    def _get_soup(self, url: str, retries: int = 3) -> Optional[BeautifulSoup]:
        for attempt in range(retries):
            try:
                resp = self.session.get(url, timeout=15)
                resp.raise_for_status()
                return BeautifulSoup(resp.text, "html.parser")
            except Exception as exc:
                logger.warning(f"Attempt {attempt+1} failed for {url}: {exc}")
                time.sleep(2 ** attempt)
        return None

    def _get_selenium_soup(self, url: str, wait_css: str = "body") -> Optional[BeautifulSoup]:
        driver = self._get_driver()
        try:
            driver.get(url)
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located(("css selector", wait_css))
            )
            time.sleep(2)
            return BeautifulSoup(driver.page_source, "html.parser")
        except Exception as exc:
            logger.error(f"Selenium error on {url}: {exc}")
            return None

    # ------------------------------------------------------------------ #
    #  Status normalisation
    # ------------------------------------------------------------------ #
    @staticmethod
    def normalise_status(raw: str) -> str:
        raw = raw.lower().strip()
        if any(k in raw for k in ["open", "accept", "available", "active", "live"]):
            return "OPEN"
        if any(k in raw for k in ["close", "ended", "expired", "over", "sold"]):
            return "CLOSED"
        if any(k in raw for k in ["upcoming", "soon", "announce", "forthcoming"]):
            return "UPCOMING"
        return "ACTIVE"

    # ------------------------------------------------------------------ #
    #  Abstract interface
    # ------------------------------------------------------------------ #
    @abstractmethod
    def scrape(self) -> list[SchemeData]:
        """Return a list of SchemeData objects for this city/authority."""
        ...

    def run(self) -> list[dict]:
        logger.info(f"[{self.authority}] Starting scrape for {self.city}...")
        try:
            schemes = self.scrape()
            logger.info(f"[{self.authority}] Found {len(schemes)} schemes.")
            return [s.to_dict() for s in schemes]
        finally:
            self._close_driver()
