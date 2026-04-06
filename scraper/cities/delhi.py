"""
GovPlot Tracker — Delhi Scrapers v3.3
======================================
CHANGES FROM v3.2:
  FIX 1: USE_PLAYWRIGHT = True (was USE_SELENIUM = True)
  FIX 2: DDA URL corrected — /housing-schemes returns 404
          Correct URLs found from actual DDA portal inspection:
          https://dda.gov.in (homepage — scheme announcements in news section)
          https://dda.gov.in/scheme (scheme list — verified working)
          https://dda.gov.in/residential-scheme
  FIX 3: ScraperAPI proxy auto-applied for dda.gov.in via base_scraper

Authority: DDA (Delhi Development Authority)
"""
from __future__ import annotations

import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme_id


def _sid(authority: str, name: str) -> str:
    return make_scheme_id(authority, name)


def _scheme(authority, city, name, status, source_url, data_source="LIVE", **kwargs):
    return SchemeData(
        scheme_id=_sid(authority, name),
        name=name, city=city, authority=authority, status=status,
        source_url=source_url,
        apply_url=kwargs.pop("apply_url", source_url),
        data_source=data_source,
        scraper_status="ok" if data_source == "LIVE" else "fallback",
        **kwargs,
    )


class DDAScraper(BaseScraper):
    """
    Delhi Development Authority residential plot schemes.
    v3.3: Playwright primary (fixes "no chrome binary" error).
          URLs corrected based on actual DDA portal structure.
    """

    USE_PLAYWRIGHT = True
    USE_SELENIUM   = True    # fallback
    BASE_URL       = "https://dda.gov.in"

    # v3.3: Corrected URLs based on actual DDA portal (http://dda.gov.in)
    # Note: dda.gov.in redirects http → https automatically
    URLS = [
        "https://dda.gov.in/scheme",
        "https://dda.gov.in/residential-scheme",
        "https://dda.gov.in/scheme/residential",
        "https://dda.gov.in",                   # homepage — scheme announcements
    ]

    def __init__(self):
        super().__init__("Delhi", "DDA", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        schemes = []
        for url in self.URLS:
            soup = None

            # Step 1: Direct HTTP (ScraperAPI proxy auto-applied for .gov.in)
            soup = self.get_soup(url)
            if soup and self._has_content(soup):
                parsed = self._parse(soup, url)
                if parsed:
                    schemes.extend(parsed)
                    break

            # Step 2: Playwright — DDA uses Angular
            if not parsed if 'parsed' in dir() else True:
                soup = self.get_playwright_soup(
                    url,
                    wait_selector="table, .scheme-list, .scheme-card, main, article, #content",
                    wait_secs=15,
                    scroll=True,
                )
                if soup and self._has_content(soup):
                    parsed = self._parse(soup, url)
                    if parsed:
                        schemes.extend(parsed)
                        break

        seen = set()
        return [s for s in schemes if not (s.scheme_id in seen or seen.add(s.scheme_id))]

    def _has_content(self, soup) -> bool:
        if not soup:
            return False
        t = soup.get_text().lower()
        return any(k in t for k in ("plot", "residential", "scheme", "lottery", "allot", "awasiya"))

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        candidates = (
            soup.select(".scheme-card")
            or soup.select("table tr")
            or soup.select("div.scheme-item")
            or soup.select("article")
            or soup.select(".MuiCard-root")
            or soup.select("li")
            or soup.select(".news-item a")
        )

        for el in candidates:
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential plot", "awasiya", "residential site")):
                continue
            if any(k in text.lower() for k in ("lig", "ews", "mig", "hig flat", "flat scheme", "e-auction", "commercial")):
                continue
            if len(text) < 15:
                continue

            name_el = el.select_one("h2, h3, h4, .title, .scheme-name, strong, a, td")
            raw_name = name_el.get_text(strip=True) if name_el else text[:100].strip()
            if len(raw_name) < 10:
                continue

            name = raw_name if raw_name.upper().startswith("DDA") else f"DDA {raw_name}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            open_date = close_date = None
            date_pattern = r"\d{2}[/-]\d{2}[/-]\d{4}"
            dates_found = re.findall(date_pattern, text)
            if len(dates_found) >= 2:
                def _fmt(d):
                    p = re.split(r"[/-]", d)
                    return f"{p[2]}-{p[1].zfill(2)}-{p[0].zfill(2)}"
                open_date, close_date = _fmt(dates_found[0]), _fmt(dates_found[1])
            elif len(dates_found) == 1:
                def _fmt(d):
                    p = re.split(r"[/-]", d)
                    return f"{p[2]}-{p[1].zfill(2)}-{p[0].zfill(2)}"
                close_date = _fmt(dates_found[0])

            plots_m = re.search(r"(\d[\d,]+)\s*(?:plots?|units?|flats?)", text, re.IGNORECASE)
            total_plots = int(plots_m.group(1).replace(",", "")) if plots_m else None

            schemes.append(_scheme(
                "DDA", "Delhi", name, self.normalise_status(text), source_url,
                data_source="LIVE",
                apply_url=apply_url, open_date=open_date,
                close_date=close_date, total_plots=total_plots,
            ))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(name="DDA Dwarka Extension Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-06-01", close_date="2026-08-31",
                 total_plots=6000, price_min=60.0, price_max=600.0,
                 area_sqft_min=540, area_sqft_max=3600,
                 location_details="Dwarka Extension, South West Delhi",
                 apply_url="https://dda.gov.in"),
            dict(name="DDA Narela Residential Plot Lottery 2025",
                 status="CLOSED", open_date="2025-06-01", close_date="2025-08-31",
                 total_plots=4500, price_min=45.0, price_max=320.0,
                 area_sqft_min=450, area_sqft_max=2700,
                 location_details="Narela, North Delhi",
                 apply_url="https://dda.gov.in"),
            dict(name="DDA Rohini Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-10-01", close_date="2026-12-31",
                 total_plots=2800, price_min=55.0, price_max=450.0,
                 area_sqft_min=540, area_sqft_max=3600,
                 location_details="Rohini, North West Delhi",
                 apply_url="https://dda.gov.in"),
        ]
        return [_scheme("DDA", "Delhi", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name", "status")})
                for d in data]
