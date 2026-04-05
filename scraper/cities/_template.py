"""
GovPlot Tracker — STATE NAME Scrapers  ← replace this
==========================================
Authorities: AUTHORITY1, AUTHORITY2     ← list all authorities here

TEMPLATE — Copy this file, rename to <state>.py, and fill in:
  1. CLASS NAME (e.g., HMDAScraper)
  2. BASE_URL and SCHEME_URLS
  3. _parse() logic for the actual HTML structure of that portal
  4. fallback_schemes() with real known scheme data
  5. Add class to scraper/registry.py

RULES (enforced by base_scraper.py, but double-check here too):
  ✅ Residential Plot / Site lottery schemes ONLY
  ✅ Name format: "AUTHORITY City Scheme Name Year" e.g. "HMDA Adibatla Residential Plot Lottery 2026"
  ✅ price_min >= 25.0 (or None if unknown)
  ✅ No LIG / EWS / eAuction / commercial / flat schemes
  ✅ close_date in YYYY-MM-DD format, or None if unknown
  ✅ data_source = "LIVE" for scraped, "STATIC" for fallback
"""
from __future__ import annotations

import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme_id


# ── Helpers (copy these into your state file) ─────────────────────────────

def _sid(authority: str, name: str) -> str:
    return make_scheme_id(authority, name)


def _scheme(
    authority: str,
    city: str,
    name: str,
    status: str,
    source_url: str,
    data_source: str = "LIVE",
    **kwargs,
) -> SchemeData:
    return SchemeData(
        scheme_id=_sid(authority, name),
        name=name,
        city=city,
        authority=authority,
        status=status,
        source_url=source_url,
        apply_url=kwargs.pop("apply_url", source_url),
        data_source=data_source,
        scraper_status="ok" if data_source == "LIVE" else "fallback",
        **kwargs,
    )


# ===========================================================================
# AUTHORITY — Full Authority Name
# ===========================================================================

class TemplateScraper(BaseScraper):
    """
    Replace with actual authority name and details.

    Steps:
    1. Visit BASE_URL in a browser — inspect the HTML for scheme listings
    2. Note the CSS selectors for: scheme name, status, dates, plots, price
    3. Fill in _parse() to extract those fields
    4. Run locally: python -c "from scraper.cities.<state> import TemplateScraper; s=TemplateScraper(); print(s.run())"
    5. Verify output — check data_source is "LIVE" and name format is correct

    Set USE_SELENIUM = True if the site requires JavaScript rendering.
    """

    # USE_SELENIUM = True   ← uncomment if JS-rendered

    BASE_URL    = "https://authority.gov.in"           # ← replace with actual URL
    SCHEME_URLS = [
        "https://authority.gov.in/schemes",            # ← replace with scheme listing page
        "https://authority.gov.in/plot-allotment",     # ← add additional URLs if needed
        "https://authority.gov.in",                    # ← homepage as last fallback
    ]

    AUTHORITY = "AUTH"   # ← replace with your authority code, e.g. "HMDA"

    def __init__(self):
        super().__init__(
            "CityName",      # ← primary city this authority covers
            self.AUTHORITY,
            self.BASE_URL,
        )

    def scrape_live(self) -> list[SchemeData]:
        """
        Try each URL until we get scheme results.
        For JS-rendered sites, use get_selenium_soup() instead of get_soup().
        """
        for url in self.SCHEME_URLS:
            soup = self.get_soup(url)

            # Uncomment for Selenium:
            # if not soup or not self._has_content(soup):
            #     soup = self.get_selenium_soup(url, wait_css="table, .scheme-list", wait_secs=10)

            if soup:
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def _has_content(self, soup) -> bool:
        """Return True if the page has scheme-related content."""
        text = soup.get_text().lower()
        return any(k in text for k in ("plot", "residential", "scheme", "lottery", "allot"))

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        """
        Parse the HTML and return a list of SchemeData objects.

        Common selector patterns to try:
          soup.select("table tr")           ← HTML tables (most govt sites)
          soup.select("div.scheme-card")    ← card-based layouts
          soup.select("li.scheme-item")     ← list-based layouts
          soup.select("article")            ← WordPress-style sites
          soup.select(".MuiCard-root")      ← Material UI (React)
        """
        schemes = []

        for el in soup.select("table tr"):  # ← replace with correct selector
            text = el.get_text(separator=" ", strip=True)

            # ── FILTER: must be residential plot ──────────────────────────
            if not any(k in text.lower() for k in ("plot", "residential", "site")):
                continue

            # ── FILTER: exclude LIG/EWS/eAuction/flats ───────────────────
            if any(k in text.lower() for k in (
                "lig", "ews", "flat", "apartment", "e-auction", "eauction",
                "commercial", "industrial",
            )):
                continue

            if len(text) < 15:
                continue

            # ── Extract name ──────────────────────────────────────────────
            name_el = el.select_one("td, h3, a, .title")
            raw_name = name_el.get_text(strip=True) if name_el else text[:100]
            if len(raw_name) < 10:
                continue

            # Enforce naming: "AUTHORITY CityName Scheme Description Year"
            name = (raw_name if raw_name.upper().startswith(self.AUTHORITY)
                    else f"{self.AUTHORITY} {raw_name}")
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            # ── Extract apply URL ─────────────────────────────────────────
            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            # ── Extract status ────────────────────────────────────────────
            # Option A: from a dedicated status column
            cells = el.find_all("td")
            status_text = cells[-1].get_text(strip=True) if cells else text
            status = self.normalise_status(status_text)

            # ── Extract dates (optional) ──────────────────────────────────
            # open_date = "2026-04-01"   ← hardcode if needed
            # close_date = "2026-06-30"
            open_date  = None
            close_date = None
            date_pattern = r"\d{2}[/-]\d{2}[/-]\d{4}"
            dates = re.findall(date_pattern, text)
            if len(dates) >= 2:
                def _fmt(d):
                    p = re.split(r"[/-]", d)
                    return f"{p[2]}-{p[1].zfill(2)}-{p[0].zfill(2)}"
                open_date, close_date = _fmt(dates[0]), _fmt(dates[1])

            # ── Extract total plots (optional) ────────────────────────────
            plots_m = re.search(r"(\d[\d,]+)\s*(?:plots?|sites?|units?)", text, re.IGNORECASE)
            total_plots = int(plots_m.group(1).replace(",", "")) if plots_m else None

            # ── Build SchemeData ──────────────────────────────────────────
            schemes.append(_scheme(
                self.AUTHORITY,
                "CityName",     # ← replace or detect from text
                name,
                status,
                source_url,
                data_source="LIVE",
                apply_url=apply_url,
                open_date=open_date,
                close_date=close_date,
                total_plots=total_plots,
                # price_min=...,   ← add if you can parse it
                # location_details=...,
            ))

        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        """
        Hardcoded known schemes — used when live scrape fails.
        Fill this in with real data from the authority's press releases / brochures.
        Always include at least 1-2 schemes so the fallback isn't empty.
        """
        data = [
            dict(
                name="AUTHORITY CityName Scheme Name Residential Plot Lottery 2026",
                status="UPCOMING",
                open_date="2026-07-01",    # real date from authority announcement
                close_date="2026-09-30",
                total_plots=500,
                price_min=30.0,
                price_max=100.0,
                area_sqft_min=900,
                area_sqft_max=3600,
                location_details="Location, City",
            ),
            # Add more known schemes here...
        ]
        return [
            _scheme(
                self.AUTHORITY,
                "CityName",     # ← replace
                d["name"],
                d["status"],
                self.BASE_URL,
                data_source="STATIC",
                **{k: v for k, v in d.items() if k not in ("name", "status")},
            )
            for d in data
        ]


# ── CHECKLIST before adding to registry.py ───────────────────────────────
# □ Rename class to e.g. HMDAScraper
# □ Set correct BASE_URL and SCHEME_URLS
# □ Set AUTHORITY = "HMDA" (or correct code)
# □ Update __init__ city name
# □ Fill in _parse() with correct CSS selectors
# □ Fill in fallback_schemes() with real data
# □ Test locally: python -c "from scraper.cities.telangana import HMDAScraper; s=HMDAScraper(); r,e=s.run(); print(len(r), 'schemes,', len(e), 'errors')"
# □ Uncomment the import in scraper/registry.py
# □ Add to ALL_SCRAPERS list in registry.py
