"""
GovPlot Tracker — Delhi Scrapers
==================================
Authority: DDA (Delhi Development Authority)

DDA's scheme list is on dda.gov.in/housing-schemes
JS-heavy pages → USE_SELENIUM = True
Fallback: known 2026 DDA scheme data
"""
from __future__ import annotations

import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme_id


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
# DDA — Delhi Development Authority
# ===========================================================================

class DDAScraper(BaseScraper):
    """
    Delhi Development Authority residential plot schemes.
    Primary: https://dda.gov.in/housing-schemes
    Also checks: https://dda.gov.in/current-schemes and notifications page.
    USE_SELENIUM = True — DDA uses React/Angular rendering.
    """

    USE_SELENIUM = True
    BASE_URL     = "https://dda.gov.in"

    URLS = [
        "https://dda.gov.in/housing-schemes",
        "https://dda.gov.in/current-schemes",
        "https://dda.gov.in/dda-schemes",
    ]

    def __init__(self):
        super().__init__("Delhi", "DDA", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        schemes = []

        for url in self.URLS:
            # Try static first (faster)
            soup = self.get_soup(url)

            # If nothing found, try Selenium
            if not soup or not self._has_scheme_content(soup):
                soup = self.get_selenium_soup(
                    url,
                    wait_css=".scheme-list, table, .MuiCard-root, .scheme-card, #schemeList",
                    wait_secs=10,
                )

            if soup and self._has_scheme_content(soup):
                parsed = self._parse(soup, url)
                schemes.extend(parsed)
                if parsed:
                    break  # Found schemes — no need to try other URLs

        seen = set()
        return [s for s in schemes if not (s.scheme_id in seen or seen.add(s.scheme_id))]

    def _has_scheme_content(self, soup) -> bool:
        text = soup.get_text().lower()
        return any(k in text for k in ("plot", "residential", "scheme", "lottery", "allot"))

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []

        # Try various selectors DDA has used over the years
        candidates = (
            soup.select(".scheme-card")
            or soup.select("table tr")
            or soup.select("div.scheme-item")
            or soup.select("article")
            or soup.select(".MuiCard-root")
            or soup.select("li")
        )

        for el in candidates:
            text = el.get_text(separator=" ", strip=True)

            # Must be a residential plot scheme
            if not any(k in text.lower() for k in ("plot", "residential plot", "awasiya")):
                continue

            # Exclude non-plot types
            if any(k in text.lower() for k in (
                "lig", "ews", "mig", "hig flat", "flat scheme",
                "e-auction", "eauction", "commercial",
            )):
                continue

            if len(text) < 15:
                continue

            # Extract name
            name_el = el.select_one("h2, h3, h4, .title, .scheme-name, strong, a, td")
            raw_name = name_el.get_text(strip=True) if name_el else text[:100].strip()

            if len(raw_name) < 10:
                continue

            # Enforce naming convention
            name = raw_name if raw_name.upper().startswith("DDA") else f"DDA {raw_name}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            # Get apply link
            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            # Extract dates if present
            open_date  = None
            close_date = None
            date_pattern = r"\d{2}[/-]\d{2}[/-]\d{4}"
            dates_found = re.findall(date_pattern, text)
            if len(dates_found) >= 2:
                # Assume first = open, second = close
                def _fmt(d: str) -> str:
                    parts = re.split(r"[/-]", d)
                    return f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
                open_date  = _fmt(dates_found[0])
                close_date = _fmt(dates_found[1])
            elif len(dates_found) == 1:
                close_date = _fmt(dates_found[0])

            # Extract total plots if mentioned
            total_plots = None
            plots_match = re.search(r"(\d[\d,]+)\s*(?:plots?|units?|flats?)", text, re.IGNORECASE)
            if plots_match:
                total_plots = int(plots_match.group(1).replace(",", ""))

            status = self.normalise_status(text)

            schemes.append(_scheme(
                "DDA", "Delhi", name, status, source_url,
                data_source="LIVE",
                apply_url=apply_url,
                open_date=open_date,
                close_date=close_date,
                total_plots=total_plots,
            ))

        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(
                name="DDA Dwarka Extension Residential Plot Lottery 2026",
                status="UPCOMING",
                open_date="2026-06-01", close_date="2026-08-31",
                total_plots=6000,   price_min=60.0,  price_max=600.0,
                area_sqft_min=540,  area_sqft_max=3600,
                location_details="Dwarka Extension, South West Delhi",
                apply_url="https://dda.gov.in",
            ),
            dict(
                name="DDA Narela Residential Plot Lottery 2025",
                status="CLOSED",
                open_date="2025-06-01", close_date="2025-08-31",
                total_plots=4500,   price_min=45.0,  price_max=320.0,
                area_sqft_min=450,  area_sqft_max=2700,
                location_details="Narela, North Delhi",
                apply_url="https://dda.gov.in",
            ),
            dict(
                name="DDA Rohini Residential Plot Lottery 2026",
                status="UPCOMING",
                open_date="2026-10-01", close_date="2026-12-31",
                total_plots=2800,   price_min=55.0,  price_max=450.0,
                area_sqft_min=540,  area_sqft_max=3600,
                location_details="Rohini, North West Delhi",
                apply_url="https://dda.gov.in",
            ),
        ]
        return [_scheme("DDA", "Delhi", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name", "status")})
                for d in data]
