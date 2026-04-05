"""
GovPlot Tracker — Uttar Pradesh Scrapers
==========================================
Authorities: LDA, UPAVP, ADA, GDA, GNIDA, YEIDA, ADA-ALG, JDA-JHS

Each scraper:
  1. Hits the live government portal URL
  2. Parses scheme listings from HTML tables / divs / notification PDFs
  3. Falls back to hardcoded known schemes if site is unreachable
  4. Sets data_source="LIVE" or "STATIC" on every SchemeData

EXCLUDED (enforced by base_scraper filters):
  - LIG / EWS flats
  - eAuction sales
  - Commercial / industrial plots
  - Price < ₹25L
"""
from __future__ import annotations

import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme_id


# ── Helpers ────────────────────────────────────────────────────────────────

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


def _parse_price_lakh(text: str) -> float | None:
    """Extract price in lakhs from text like '₹45 Lakh' or '45,00,000'."""
    text = text.replace(",", "").strip()
    # Pattern: number followed by lakh/lac
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)", text, re.IGNORECASE)
    if m:
        return float(m.group(1))
    # Crore conversion
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:crore|cr)", text, re.IGNORECASE)
    if m:
        return float(m.group(1)) * 100
    # Raw number >= 100000 → convert to lakh
    m = re.search(r"(\d{6,})", text)
    if m:
        return round(int(m.group(1)) / 100000, 1)
    return None


def _parse_date(text: str) -> str | None:
    """Try to extract a date from messy text, return YYYY-MM-DD or None."""
    formats = [
        r"(\d{2})[/-](\d{2})[/-](\d{4})",      # DD/MM/YYYY or DD-MM-YYYY
        r"(\d{4})[/-](\d{2})[/-](\d{2})",      # YYYY-MM-DD
        r"(\d{1,2})\s+(\w+)\s+(\d{4})",        # 15 January 2026
    ]
    month_map = {
        "jan": "01", "feb": "02", "mar": "03", "apr": "04",
        "may": "05", "jun": "06", "jul": "07", "aug": "08",
        "sep": "09", "oct": "10", "nov": "11", "dec": "12",
    }
    for pat in formats:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            g = m.groups()
            if len(g) == 3:
                if g[2].isdigit() and len(g[2]) == 4:   # DD/MM/YYYY
                    d, mo, y = g
                    mo_str = month_map.get(mo.lower()[:3], mo.zfill(2)) if not mo.isdigit() else mo.zfill(2)
                    return f"{y}-{mo_str}-{d.zfill(2)}"
                elif g[0].isdigit() and len(g[0]) == 4:  # YYYY-MM-DD
                    return f"{g[0]}-{g[1].zfill(2)}-{g[2].zfill(2)}"
    return None


# ===========================================================================
# LDA — Lucknow Development Authority
# ===========================================================================

class LDAScraper(BaseScraper):
    """
    Lucknow Development Authority residential plot schemes.
    Live URL: https://lda.up.nic.in/scheme.htm
    Scheme listing is in HTML tables on /scheme.htm and /news_events.htm
    """

    BASE_URL   = "https://lda.up.nic.in"
    SCHEME_URL = "https://lda.up.nic.in/scheme.htm"
    NEWS_URL   = "https://lda.up.nic.in/news_events.htm"

    def __init__(self):
        super().__init__("Lucknow", "LDA", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        schemes = []
        for url in [self.SCHEME_URL, self.NEWS_URL]:
            soup = self.get_soup(url)
            if not soup:
                continue
            schemes.extend(self._parse(soup, url))

        # Deduplicate by scheme_id
        seen = set()
        unique = []
        for s in schemes:
            if s.scheme_id not in seen:
                seen.add(s.scheme_id)
                unique.append(s)
        return unique

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        # LDA uses <table> rows or <li> items with notification links
        rows = (
            soup.select("table tr")
            or soup.select("ul.scheme-list li")
            or soup.select("div.notification-item")
        )
        for row in rows:
            text = row.get_text(separator=" ", strip=True)
            # Must mention "plot" or "residential"
            if not any(k in text.lower() for k in ("plot", "residential", "awasiya")):
                continue
            # Must not be EWS/LIG/eAuction
            if any(k in text.lower() for k in ("lig", "ews", "e-auction", "flat")):
                continue

            name_el = row.select_one("a, td, h3, h4")
            if not name_el:
                continue
            raw_name = name_el.get_text(strip=True)
            if len(raw_name) < 10:
                continue

            # Enforce naming convention: must contain year
            if not re.search(r"20(2[4-9]|[3-9]\d)", raw_name):
                raw_name = f"{raw_name} {datetime.now(timezone.utc).year}"

            name = raw_name if raw_name.startswith("LDA") else f"LDA {raw_name}"

            link = row.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            status_text = row.get_text().lower()
            status = self.normalise_status(status_text)

            schemes.append(_scheme(
                "LDA", "Lucknow", name, status, source_url,
                data_source="LIVE",
                apply_url=apply_url,
            ))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(
                name="LDA Gomti Nagar Extension Residential Plot Lottery 2026",
                status="OPEN",
                open_date="2026-01-15", close_date="2026-04-30",
                total_plots=600, price_min=40.0, price_max=120.0,
                area_sqft_min=900, area_sqft_max=3600,
                location_details="Gomti Nagar Extension, Lucknow",
            ),
            dict(
                name="LDA Vrindavan Yojana Residential Plot Lottery 2026",
                status="UPCOMING",
                open_date="2026-06-01", close_date="2026-08-31",
                total_plots=480, price_min=35.0, price_max=95.0,
                area_sqft_min=900, area_sqft_max=3600,
                location_details="Vrindavan Yojana, Lucknow",
            ),
            dict(
                name="LDA Amar Shaheed Path Residential Plot Lottery 2025",
                status="CLOSED",
                open_date="2025-06-01", close_date="2025-09-30",
                total_plots=320, price_min=45.0, price_max=130.0,
                area_sqft_min=1200, area_sqft_max=4800,
                location_details="Amar Shaheed Path, Lucknow",
            ),
        ]
        return [_scheme("LDA", "Lucknow", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC", **{k: v for k, v in d.items()
                                                  if k not in ("name", "status")})
                for d in data]


# ===========================================================================
# UPAVP — UP Awas Vikas Parishad (multiple cities)
# ===========================================================================

class UPAVPScraper(BaseScraper):
    """
    UP Awas Vikas Parishad — covers Kanpur, Varanasi, Prayagraj, Meerut,
    Bareilly, Gorakhpur, Mathura, Moradabad, Saharanpur, Muzaffarnagar.
    Live URL: https://awasvikas.gov.in/avp-schemes.htm
    """

    BASE_URL   = "https://awasvikas.gov.in"
    SCHEME_URL = "https://awasvikas.gov.in/avp-schemes.htm"

    def __init__(self):
        super().__init__("Kanpur", "UPAVP", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        soup = self.get_soup(self.SCHEME_URL)
        if not soup:
            return []
        return self._parse(soup, self.SCHEME_URL)

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        rows = soup.select("table tr") or soup.select("div.scheme-row") or []
        for row in rows:
            text = row.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential", "awasiya")):
                continue
            if any(k in text.lower() for k in ("lig", "ews", "e-auction")):
                continue

            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue

            name_text = cells[0].get_text(strip=True) or cells[1].get_text(strip=True)
            if len(name_text) < 8:
                continue

            # Detect city from name or location cell
            city = "Kanpur"
            city_candidates = [
                "Varanasi", "Prayagraj", "Meerut", "Bareilly", "Gorakhpur",
                "Mathura", "Moradabad", "Saharanpur", "Muzaffarnagar", "Kanpur",
            ]
            for c in city_candidates:
                if c.lower() in text.lower():
                    city = c
                    break

            name = name_text if name_text.startswith("UPAVP") else f"UPAVP {name_text}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            link = row.select_one("a[href]")
            apply_url = (self.BASE_URL + link["href"] if link and link["href"].startswith("/")
                         else (link["href"] if link else source_url))

            status = self.normalise_status(cells[-1].get_text(strip=True) if cells else "")
            schemes.append(_scheme(
                "UPAVP", city, name, status, source_url,
                data_source="LIVE", apply_url=apply_url,
            ))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(city="Kanpur",     name="UPAVP Govind Nagar Residential Plot Lottery 2026",
                 status="OPEN",     open_date="2026-02-01", close_date="2026-04-30",
                 total_plots=750,   price_min=28.0, price_max=90.0,
                 area_sqft_min=900, area_sqft_max=3600,
                 location_details="Govind Nagar, Kanpur"),
            dict(city="Varanasi",   name="UPAVP Panchwati Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-07-01", close_date="2026-09-30",
                 total_plots=500,   price_min=30.0, price_max=75.0,
                 location_details="Panchwati, Varanasi"),
            dict(city="Prayagraj",  name="UPAVP Civil Lines Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-08-01", close_date="2026-10-31",
                 total_plots=400,   price_min=32.0, price_max=85.0,
                 location_details="Civil Lines, Prayagraj"),
            dict(city="Gorakhpur",  name="UPAVP AIIMS Road Residential Plot Lottery 2026",
                 status="OPEN",     open_date="2026-03-01", close_date="2026-05-31",
                 total_plots=550,   price_min=27.0, price_max=60.0,
                 location_details="AIIMS Road, Gorakhpur"),
            dict(city="Bareilly",   name="UPAVP Pilibhit Bypass Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-05-01", close_date="2026-07-31",
                 total_plots=420,   price_min=28.0, price_max=65.0,
                 location_details="Pilibhit Bypass, Bareilly"),
            dict(city="Mathura",    name="UPAVP Vrindavan Corridor Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-09-01", close_date="2026-11-30",
                 total_plots=320,   price_min=30.0, price_max=80.0,
                 location_details="Vrindavan Corridor, Mathura"),
            dict(city="Meerut",     name="UPAVP Shatabdi Nagar Residential Plot Lottery 2025",
                 status="CLOSED",   open_date="2025-08-01", close_date="2025-10-31",
                 total_plots=600,   price_min=30.0, price_max=85.0,
                 location_details="Shatabdi Nagar, Meerut"),
        ]
        return [_scheme("UPAVP", d["city"], d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC", **{k: v for k, v in d.items()
                                                  if k not in ("name", "status", "city")})
                for d in data]


# ===========================================================================
# ADA — Agra Development Authority
# ===========================================================================

class ADAScraper(BaseScraper):
    """
    Agra Development Authority.
    Live URL: https://adaagra.gov.in
    """
    BASE_URL = "https://adaagra.gov.in"

    def __init__(self):
        super().__init__("Agra", "ADA", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        soup = self.get_soup(self.BASE_URL)
        if not soup:
            return []
        schemes = []
        for el in soup.select("a, li, td"):
            text = el.get_text(strip=True)
            if any(k in text.lower() for k in ("plot", "residential")) and len(text) > 15:
                if any(k in text.lower() for k in ("lig", "ews", "flat", "e-auction")):
                    continue
                name = text if text.startswith("ADA") else f"ADA {text}"
                if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                    name = f"{name} {datetime.now(timezone.utc).year}"
                link = el if el.name == "a" else el.find("a")
                apply_url = (self.BASE_URL + link["href"] if link and link.get("href", "").startswith("/")
                             else (link["href"] if link and link.get("href") else self.BASE_URL))
                schemes.append(_scheme("ADA", "Agra", name,
                                       self.normalise_status(text),
                                       self.BASE_URL, data_source="LIVE",
                                       apply_url=apply_url))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(name="ADA Kalindi Vihar Phase 3 Residential Plot Lottery 2026",
                 status="OPEN",     open_date="2026-01-15", close_date="2026-04-15",
                 total_plots=580,   price_min=28.0, price_max=75.0,
                 location_details="Kalindi Vihar, Agra"),
            dict(name="ADA Taj Nagari Phase 2 Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-09-01", close_date="2026-11-30",
                 total_plots=300,   price_min=35.0, price_max=100.0,
                 location_details="Taj Nagari Zone, Agra"),
        ]
        return [_scheme("ADA", "Agra", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC", **{k: v for k, v in d.items()
                                                  if k not in ("name", "status")})
                for d in data]


# ===========================================================================
# GDA — Ghaziabad Development Authority
# ===========================================================================

class GDAScraper(BaseScraper):
    """
    Ghaziabad Development Authority.
    Live URL: https://gdaghaziabad.com/schemes
    """
    BASE_URL   = "https://gdaghaziabad.com"
    SCHEME_URL = "https://gdaghaziabad.com/schemes"

    def __init__(self):
        super().__init__("Ghaziabad", "GDA", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        soup = self.get_soup(self.SCHEME_URL) or self.get_soup(self.BASE_URL)
        if not soup:
            return []
        schemes = []
        for el in soup.select("table tr, div.scheme-item, li"):
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential")):
                continue
            if any(k in text.lower() for k in ("lig", "ews", "flat", "e-auction")):
                continue
            if len(text) < 15:
                continue
            name = text[:120].strip()
            name = name if name.startswith("GDA") else f"GDA {name}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"
            schemes.append(_scheme("GDA", "Ghaziabad", name,
                                   self.normalise_status(text),
                                   self.SCHEME_URL, data_source="LIVE"))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(name="GDA Kaushambi Residential Plot Lottery 2026",
                 status="OPEN",     open_date="2026-02-01", close_date="2026-04-30",
                 total_plots=680,   price_min=38.0, price_max=130.0,
                 area_sqft_min=900, area_sqft_max=3600,
                 location_details="Kaushambi, Ghaziabad"),
            dict(name="GDA Raj Nagar Extension Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-07-01", close_date="2026-09-30",
                 total_plots=450,   price_min=42.0, price_max=160.0,
                 location_details="Raj Nagar Extension, Ghaziabad"),
        ]
        return [_scheme("GDA", "Ghaziabad", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC", **{k: v for k, v in d.items()
                                                  if k not in ("name", "status")})
                for d in data]


# ===========================================================================
# Noida — GNIDA + YEIDA + NUDA
# ===========================================================================

class NoidaScraper(BaseScraper):
    """
    Greater Noida / YEIDA / Noida Authority — multiple portals.
    USE_SELENIUM = True for YEIDA (JS-rendered scheme list).
    """
    USE_SELENIUM = True

    BASE_URL = "https://noidaauthorityonline.in"

    PORTALS = [
        ("GNIDA", "Noida", "https://greaternoida.in/schemes"),
        ("YEIDA", "Noida", "https://yamunaexpresswayauthority.com/residentialPlot"),
        ("NUDA",  "Noida", "https://noidaauthorityonline.in/scheme"),
    ]

    def __init__(self):
        super().__init__("Noida", "GNIDA", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        schemes = []
        for authority, city, url in self.PORTALS:
            soup = self.get_soup(url)
            if not soup and self.USE_SELENIUM:
                soup = self.get_selenium_soup(url, wait_css="table, .scheme-list, #scheme")
            if soup:
                schemes.extend(self._parse(soup, authority, city, url))
        return schemes

    def _parse(self, soup, authority: str, city: str, source_url: str) -> list[SchemeData]:
        schemes = []
        for el in soup.select("table tr, div.scheme-card, li.scheme-item, article"):
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential", "sector")):
                continue
            if any(k in text.lower() for k in ("flat", "lig", "ews", "commercial", "e-auction")):
                continue
            if len(text) < 15:
                continue

            name_el = el.select_one("h2, h3, h4, td, a, .title")
            raw_name = name_el.get_text(strip=True) if name_el else text[:100]
            if len(raw_name) < 10:
                continue

            name = (raw_name if raw_name.upper().startswith(authority)
                    else f"{authority} {raw_name}")
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = source_url.split("/")[0] + "//" + source_url.split("/")[2] + apply_url

            schemes.append(_scheme(
                authority, city, name,
                self.normalise_status(text),
                source_url, data_source="LIVE", apply_url=apply_url,
            ))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(auth="GNIDA", city="Noida",
                 name="GNIDA Sector Omega Residential Plot Lottery 2026",
                 status="OPEN",     open_date="2026-01-15", close_date="2026-04-15",
                 total_plots=900,   price_min=45.0, price_max=180.0,
                 location_details="Sector Omega, Greater Noida",
                 url="https://greaternoida.in"),
            dict(auth="YEIDA", city="Noida",
                 name="YEIDA Sector 18 Yamuna Expressway Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-06-01", close_date="2026-08-31",
                 total_plots=2000,  price_min=30.0, price_max=90.0,
                 location_details="Sector 18, Yamuna Expressway",
                 url="https://yamunaexpresswayauthority.com"),
            dict(auth="YEIDA", city="Noida",
                 name="YEIDA Noida International Airport Zone Residential Plot Lottery 2025",
                 status="CLOSED",   open_date="2025-10-01", close_date="2025-12-31",
                 total_plots=3500,  price_min=28.0, price_max=90.0,
                 location_details="Near Noida International Airport, Jewar",
                 url="https://yamunaexpresswayauthority.com"),
            dict(auth="NUDA", city="Noida",
                 name="NUDA Sector 122 Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-08-01", close_date="2026-10-31",
                 total_plots=380,   price_min=75.0, price_max=280.0,
                 location_details="Sector 122, Noida",
                 url="https://noidaauthorityonline.in"),
        ]
        return [_scheme(d["auth"], d["city"], d["name"], d["status"], d["url"],
                        data_source="STATIC",
                        apply_url=d["url"],
                        **{k: v for k, v in d.items()
                           if k not in ("auth", "city", "name", "status", "url")})
                for d in data]


# ===========================================================================
# ADA-ALG + JDA-JHS — Aligarh + Jhansi (shared scraper)
# ===========================================================================

class AliJhansiScraper(BaseScraper):
    """
    ADA Aligarh + JDA Jhansi — both under awasvikas.gov.in.
    """
    BASE_URL   = "https://awasvikas.gov.in"
    SCHEME_URL = "https://awasvikas.gov.in/avp-schemes.htm"

    def __init__(self):
        super().__init__("Aligarh", "ADA-ALG", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        soup = self.get_soup(self.SCHEME_URL)
        if not soup:
            return []
        schemes = []
        city_authority_map = {
            "aligarh": ("ADA-ALG", "Aligarh"),
            "jhansi":  ("JDA-JHS", "Jhansi"),
        }
        for row in soup.select("table tr, li"):
            text = row.get_text(separator=" ", strip=True).lower()
            if not any(k in text for k in ("plot", "residential")):
                continue
            if any(k in text for k in ("lig", "ews", "flat", "e-auction")):
                continue

            matched_city = None
            matched_auth = None
            for keyword, (auth, city) in city_authority_map.items():
                if keyword in text:
                    matched_city = city
                    matched_auth = auth
                    break
            if not matched_city:
                continue

            name_el = row.select_one("a, td")
            raw_name = name_el.get_text(strip=True) if name_el else text[:80]
            if len(raw_name) < 10:
                continue

            name = (raw_name if raw_name.upper().startswith(matched_auth.split("-")[0])
                    else f"{matched_auth} {raw_name}")
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            schemes.append(_scheme(
                matched_auth, matched_city, name,
                self.normalise_status(text),
                self.SCHEME_URL, data_source="LIVE",
            ))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(auth="ADA-ALG", city="Aligarh",
                 name="ADA Aligarh Dhanipur Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-06-01", close_date="2026-08-31",
                 total_plots=400, price_min=25.0, price_max=65.0,
                 location_details="Dhanipur, Aligarh"),
            dict(auth="JDA-JHS", city="Jhansi",
                 name="JDA Jhansi Sipri Bazar Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-10-01", close_date="2026-12-31",
                 total_plots=300, price_min=26.0, price_max=55.0,
                 location_details="Sipri Bazar, Jhansi"),
        ]
        return [_scheme(d["auth"], d["city"], d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items()
                           if k not in ("auth", "city", "name", "status")})
                for d in data]
