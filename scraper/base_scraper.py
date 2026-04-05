"""
GovPlot Tracker — Base Scraper v3.0
All city scrapers inherit from this class.

CHANGES FROM v2.x:
  - Removed: raw_data field from SchemeData
  - Removed: Selenium dependency (all scrapers use static HTTP now)
  - Removed: verification-related imports
  - Simplified: _get_soup only (no _get_selenium_soup retained but kept for compat)
"""

import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Schemes must be from 2025-01-01 onwards
SCHEME_CUTOFF_DATE = "2025-01-01"


@dataclass
class SchemeData:
    """Standard schema for a government residential plot scheme."""
    scheme_id: str
    name: str                       # Format: "Authority + Scheme Name + Year"
    city: str
    authority: str                  # e.g. LDA, BDA, HSVP
    status: str                     # OPEN | CLOSED | ACTIVE | UPCOMING
    open_date: Optional[str] = None
    close_date: Optional[str] = None
    total_plots: Optional[int] = None
    price_min: Optional[float] = None   # in INR lakhs (minimum ₹25L)
    price_max: Optional[float] = None
    area_sqft_min: Optional[int] = None
    area_sqft_max: Optional[int] = None
    location_details: Optional[str] = None
    apply_url: Optional[str] = None
    source_url: str = ""
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())

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

    def __init__(
        self,
        city: str,
        authority: str,
        base_url: str,
        use_selenium: bool = False,   # Kept for API compat; ignored in v3
    ):
        self.city = city
        self.authority = authority
        self.base_url = base_url
        self.use_selenium = use_selenium  # Not used — all scrapers use static HTTP
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)

    # ------------------------------------------------------------------ #
    #  HTTP helper
    # ------------------------------------------------------------------ #
    def _get_soup(self, url: str, retries: int = 3) -> Optional[BeautifulSoup]:
        for attempt in range(retries):
            try:
                resp = self.session.get(url, timeout=15)
                resp.raise_for_status()
                return BeautifulSoup(resp.text, "html.parser")
            except Exception as exc:
                logger.warning(f"Attempt {attempt + 1} failed for {url}: {exc}")
                time.sleep(2 ** attempt)
        return None

    # Kept for API compatibility — now just calls _get_soup
    def _get_selenium_soup(self, url: str, wait_css: str = "body") -> Optional[BeautifulSoup]:
        return self._get_soup(url)

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
        logger.info(f"[{self.authority}] Scraping {self.city}...")
        try:
            schemes = self.scrape()
            logger.info(f"[{self.authority}] {len(schemes)} schemes found.")
            return [s.to_dict() for s in schemes]
        except Exception as exc:
            logger.error(f"[{self.authority}] Scrape failed: {exc}")
            return []
