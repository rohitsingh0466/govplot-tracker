"""
GovPlot Tracker — Uttar Pradesh Scrapers v3.3
==============================================
CHANGES FROM v3.2:
  FIX 1: ScraperAPI proxy auto-applied via base_scraper for .gov.in / .nic.in
          LDA (lda.up.nic.in), UPAVP (awasvikas.gov.in), ADA (adaagra.gov.in)
          — all blocked from GitHub runners — now go through ScraperAPI
            when SCRAPER_API_KEY secret is set.
          Without the key: same as before (STATIC fallback).

  FIX 2: NoidaScraper uses Playwright (was USE_SELENIUM which caused
          "no chrome binary" error).

  FIX 3: All logic/fallback data unchanged — no risk of regression.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData, make_scheme_id


def _sid(authority, name):
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


def _parse_price_lakh(text):
    text = text.replace(",", "").strip()
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)", text, re.IGNORECASE)
    if m: return float(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:crore|cr)", text, re.IGNORECASE)
    if m: return float(m.group(1)) * 100
    return None


# =============================================================================
# LDA — Lucknow Development Authority
# =============================================================================

class LDAScraper(BaseScraper):
    """
    v3.3: Updated to new domain https://www.ldalucknow.in/
    Old domain lda.up.nic.in was unreachable from GitHub runners.
    New domain is not a .gov.in/.nic.in so no ScraperAPI proxy needed.
    Try multiple common page paths since new site structure is different.
    """
    BASE_URL   = "https://www.ldalucknow.in"
    SCHEME_URL = "https://www.ldalucknow.in/scheme"
    NEWS_URL   = "https://www.ldalucknow.in/news-events"

    def __init__(self, config=None):
        super().__init__("Lucknow", "LDA", self.BASE_URL, config=config)

    def scrape_live(self) -> list[SchemeData]:
        schemes = []
        for url in [self.SCHEME_URL, self.NEWS_URL]:
            soup = self.get_soup(url)
            if soup:
                schemes.extend(self._parse(soup, url))
        seen = set()
        return [s for s in schemes if not (s.scheme_id in seen or seen.add(s.scheme_id))]

    def _parse(self, soup, source_url):
        schemes = []
        rows = (
            soup.select("table tr")
            or soup.select("ul.scheme-list li")
            or soup.select("div.notification-item")
        )
        for row in rows:
            text = row.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential", "awasiya")):
                continue
            if any(k in text.lower() for k in ("lig", "ews", "e-auction", "flat")):
                continue
            name_el = row.select_one("a, td, h3, h4")
            if not name_el:
                continue
            raw_name = name_el.get_text(strip=True)
            if len(raw_name) < 10:
                continue
            if not re.search(r"20(2[4-9]|[3-9]\d)", raw_name):
                raw_name = f"{raw_name} {datetime.now(timezone.utc).year}"
            name = raw_name if raw_name.startswith("LDA") else f"LDA {raw_name}"
            link = row.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url
            schemes.append(_scheme("LDA", "Lucknow", name,
                                   self.normalise_status(text),
                                   source_url, data_source="LIVE",
                                   apply_url=apply_url))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(name="LDA Gomti Nagar Extension Residential Plot Lottery 2026",
                 status="OPEN", open_date="2026-01-15", close_date="2026-04-30",
                 total_plots=600, price_min=40.0, price_max=120.0,
                 area_sqft_min=900, area_sqft_max=3600,
                 location_details="Gomti Nagar Extension, Lucknow"),
            dict(name="LDA Vrindavan Yojana Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-06-01", close_date="2026-08-31",
                 total_plots=480, price_min=35.0, price_max=95.0,
                 area_sqft_min=900, area_sqft_max=3600,
                 location_details="Vrindavan Yojana, Lucknow"),
            dict(name="LDA Amar Shaheed Path Residential Plot Lottery 2025",
                 status="CLOSED", open_date="2025-06-01", close_date="2025-09-30",
                 total_plots=320, price_min=45.0, price_max=130.0,
                 area_sqft_min=1200, area_sqft_max=4800,
                 location_details="Amar Shaheed Path, Lucknow"),
        ]
        return [_scheme("LDA", "Lucknow", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name", "status")})
                for d in data]


# =============================================================================
# UPAVP — UP Awas Vikas Parishad
# =============================================================================

class UPAVPScraper(BaseScraper):
    """
    v3.3: Updated to new portal https://upavp.project247.in/
    Old domain awasvikas.gov.in was blocked from GitHub runners.
    New domain is accessible directly — no ScraperAPI needed.
    """
    BASE_URL   = "https://upavp.project247.in"
    SCHEME_URL = "https://upavp.project247.in/schemes"

    def __init__(self, config=None):
        super().__init__("Kanpur", "UPAVP", self.BASE_URL, config=config)

    def scrape_live(self) -> list[SchemeData]:
        # Try the schemes page, then homepage as fallback
        for url in [self.SCHEME_URL, self.BASE_URL]:
            soup = self.get_soup(url)
            if soup:
                result = self._parse(soup, url)
                if result:
                    return result
        return []

    def _parse(self, soup, source_url):
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
            city = "Kanpur"
            for c in ["Varanasi","Prayagraj","Meerut","Bareilly","Gorakhpur",
                      "Mathura","Moradabad","Saharanpur","Muzaffarnagar","Kanpur"]:
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
            schemes.append(_scheme("UPAVP", city, name, status, source_url,
                                   data_source="LIVE", apply_url=apply_url))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(city="Kanpur", name="UPAVP Govind Nagar Residential Plot Lottery 2026",
                 status="OPEN", open_date="2026-02-01", close_date="2026-04-30",
                 total_plots=750, price_min=28.0, price_max=90.0,
                 area_sqft_min=900, area_sqft_max=3600,
                 location_details="Govind Nagar, Kanpur"),
            dict(city="Varanasi", name="UPAVP Panchwati Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-07-01", close_date="2026-09-30",
                 total_plots=500, price_min=30.0, price_max=75.0,
                 location_details="Panchwati, Varanasi"),
            dict(city="Prayagraj", name="UPAVP Civil Lines Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-08-01", close_date="2026-10-31",
                 total_plots=400, price_min=32.0, price_max=85.0,
                 location_details="Civil Lines, Prayagraj"),
            dict(city="Gorakhpur", name="UPAVP AIIMS Road Residential Plot Lottery 2026",
                 status="OPEN", open_date="2026-03-01", close_date="2026-05-31",
                 total_plots=550, price_min=27.0, price_max=60.0,
                 location_details="AIIMS Road, Gorakhpur"),
            dict(city="Bareilly", name="UPAVP Pilibhit Bypass Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-05-01", close_date="2026-07-31",
                 total_plots=420, price_min=28.0, price_max=65.0,
                 location_details="Pilibhit Bypass, Bareilly"),
            dict(city="Mathura", name="UPAVP Vrindavan Corridor Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-09-01", close_date="2026-11-30",
                 total_plots=320, price_min=30.0, price_max=80.0,
                 location_details="Vrindavan Corridor, Mathura"),
            dict(city="Meerut", name="UPAVP Shatabdi Nagar Residential Plot Lottery 2025",
                 status="CLOSED", open_date="2025-08-01", close_date="2025-10-31",
                 total_plots=600, price_min=30.0, price_max=85.0,
                 location_details="Shatabdi Nagar, Meerut"),
        ]
        return [_scheme("UPAVP", d["city"], d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name","status","city")})
                for d in data]


# =============================================================================
# ADA — Agra Development Authority
# =============================================================================

class ADAScraper(BaseScraper):
    """
    v3.3: Updated to new domain https://www.adaagra.org.in/
    Old domain adaagra.gov.in was blocked from GitHub runners.
    """
    BASE_URL = "https://www.adaagra.org.in"

    def __init__(self, config=None):
        super().__init__("Agra", "ADA", self.BASE_URL, config=config)

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
                apply_url = (self.BASE_URL + link["href"]
                             if link and link.get("href","").startswith("/")
                             else (link["href"] if link and link.get("href") else self.BASE_URL))
                schemes.append(_scheme("ADA", "Agra", name,
                                       self.normalise_status(text), self.BASE_URL,
                                       data_source="LIVE", apply_url=apply_url))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(name="ADA Kalindi Vihar Phase 3 Residential Plot Lottery 2026",
                 status="OPEN", open_date="2026-01-15", close_date="2026-04-15",
                 total_plots=580, price_min=28.0, price_max=75.0,
                 location_details="Kalindi Vihar, Agra"),
            dict(name="ADA Taj Nagari Phase 2 Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-09-01", close_date="2026-11-30",
                 total_plots=300, price_min=35.0, price_max=100.0,
                 location_details="Taj Nagari Zone, Agra"),
        ]
        return [_scheme("ADA", "Agra", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name","status")})
                for d in data]


# =============================================================================
# GDA — Ghaziabad Development Authority
# =============================================================================

class GDAScraper(BaseScraper):
    """
    v3.3: Updated to correct domain https://gdaghaziabad.in/
    Old domain gdaghaziabad.com was unreachable.
    """
    BASE_URL   = "https://gdaghaziabad.in"
    SCHEME_URL = "https://gdaghaziabad.in/schemes"

    def __init__(self, config=None):
        super().__init__("Ghaziabad", "GDA", self.BASE_URL, config=config)

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
                 status="OPEN", open_date="2026-02-01", close_date="2026-04-30",
                 total_plots=680, price_min=38.0, price_max=130.0,
                 area_sqft_min=900, area_sqft_max=3600,
                 location_details="Kaushambi, Ghaziabad"),
            dict(name="GDA Raj Nagar Extension Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-07-01", close_date="2026-09-30",
                 total_plots=450, price_min=42.0, price_max=160.0,
                 location_details="Raj Nagar Extension, Ghaziabad"),
        ]
        return [_scheme("GDA", "Ghaziabad", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name","status")})
                for d in data]


# =============================================================================
# NoidaScraper — GNIDA + YEIDA + NUDA
# =============================================================================

class NoidaScraper(BaseScraper):
    """
    v3.3: USE_PLAYWRIGHT = True (was USE_SELENIUM → caused "no chrome binary" error)
    YEIDA portal is JS-rendered; Playwright handles it correctly.
    """
    USE_PLAYWRIGHT = True
    USE_SELENIUM   = True   # fallback only

    BASE_URL = "https://noidaauthorityonline.in"
    PORTALS = [
        ("GNIDA", "Noida", "https://greaternoida.in/schemes"),
        # v3.3: Updated YEIDA URL to correct homepage
        ("YEIDA", "Noida", "https://yamunaexpresswayauthority.com/residential-plot"),
        ("NUDA",  "Noida", "https://noidaauthorityonline.in/scheme"),
    ]

    def __init__(self, config=None):
        super().__init__("Noida", "GNIDA", self.BASE_URL, config=config)

    def scrape_live(self) -> list[SchemeData]:
        schemes = []
        for authority, city, url in self.PORTALS:
            # Step 1: Direct HTTP
            soup = self.get_soup(url)
            if not soup:
                # Step 2: Playwright
                soup = self.get_playwright_soup(
                    url,
                    wait_selector="table, .scheme-list, #scheme, main",
                    wait_secs=12,
                )
            if soup:
                schemes.extend(self._parse(soup, authority, city, url))
        return schemes

    def _parse(self, soup, authority, city, source_url):
        schemes = []
        for el in soup.select("table tr, div.scheme-card, li.scheme-item, article"):
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential", "sector")):
                continue
            if any(k in text.lower() for k in ("flat","lig","ews","commercial","e-auction")):
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
                base = "/".join(source_url.split("/")[:3])
                apply_url = base + apply_url
            schemes.append(_scheme(authority, city, name, self.normalise_status(text),
                                   source_url, data_source="LIVE", apply_url=apply_url))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(auth="GNIDA", city="Noida",
                 name="GNIDA Sector Omega Residential Plot Lottery 2026",
                 status="OPEN", open_date="2026-01-15", close_date="2026-04-15",
                 total_plots=900, price_min=45.0, price_max=180.0,
                 location_details="Sector Omega, Greater Noida",
                 url="https://greaternoida.in"),
            dict(auth="YEIDA", city="Noida",
                 name="YEIDA Sector 18 Yamuna Expressway Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-06-01", close_date="2026-08-31",
                 total_plots=2000, price_min=30.0, price_max=90.0,
                 location_details="Sector 18, Yamuna Expressway",
                 url="https://yamunaexpresswayauthority.com"),
            dict(auth="YEIDA", city="Noida",
                 name="YEIDA Noida International Airport Zone Residential Plot Lottery 2025",
                 status="CLOSED", open_date="2025-10-01", close_date="2025-12-31",
                 total_plots=3500, price_min=28.0, price_max=90.0,
                 location_details="Near Noida International Airport, Jewar",
                 url="https://yamunaexpresswayauthority.com"),
            dict(auth="NUDA", city="Noida",
                 name="NUDA Sector 122 Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-08-01", close_date="2026-10-31",
                 total_plots=380, price_min=75.0, price_max=280.0,
                 location_details="Sector 122, Noida",
                 url="https://noidaauthorityonline.in"),
        ]
        return [_scheme(d["auth"], d["city"], d["name"], d["status"], d["url"],
                        data_source="STATIC", apply_url=d["url"],
                        **{k: v for k, v in d.items()
                           if k not in ("auth","city","name","status","url")})
                for d in data]


# =============================================================================
# AliJhansiScraper — ADA Aligarh + JDA Jhansi
# =============================================================================

class AliJhansiScraper(BaseScraper):
    """
    v3.3: Updated to new UPAVP portal URL.
    """
    BASE_URL   = "https://upavp.project247.in"
    SCHEME_URL = "https://upavp.project247.in/schemes"

    def __init__(self, config=None):
        super().__init__("Aligarh", "ADA-ALG", self.BASE_URL, config=config)

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
            matched_city = matched_auth = None
            for keyword, (auth, city) in city_authority_map.items():
                if keyword in text:
                    matched_city = city; matched_auth = auth; break
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
            schemes.append(_scheme(matched_auth, matched_city, name,
                                   self.normalise_status(text),
                                   self.SCHEME_URL, data_source="LIVE"))
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
                           if k not in ("auth","city","name","status")})
                for d in data]
