"""
GovPlot Tracker — Karnataka Scrapers
======================================
Authorities: BDA (Bangalore), KHB (Mysuru, Hubballi, Mangalore, Belgaum, Tumkur)

BDA's site is React-rendered → USE_SELENIUM = True
KHB uses standard HTML tables — requests + BeautifulSoup works.
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
# BDA — Bangalore Development Authority
# ===========================================================================

class BDAScraper(BaseScraper):
    """
    Bangalore Development Authority residential plot / site schemes.
    BDA calls them "sites" not "plots" — we accept both.
    Primary: https://bdabangalore.org/site-allotment/
    USE_SELENIUM = True — BDA portal is Angular/React.
    """

    USE_SELENIUM = True
    BASE_URL     = "https://bdabangalore.org"

    URLS = [
        "https://bdabangalore.org/site-allotment/",
        "https://bdabangalore.org/schemes/",
        "https://bdabangalore.org/",
    ]

    def __init__(self):
        super().__init__("Bangalore", "BDA", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        for url in self.URLS:
            # Try static first
            soup = self.get_soup(url)
            if not soup or not self._has_content(soup):
                # BDA is Angular — Selenium needed
                soup = self.get_selenium_soup(
                    url,
                    wait_css=".scheme-list, table, .entry-content, article, .scheme-card",
                    wait_secs=12,
                )
            if soup and self._has_content(soup):
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def _has_content(self, soup) -> bool:
        t = soup.get_text().lower()
        return any(k in t for k in ("site allot", "plot", "layout", "residential", "scheme"))

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        candidates = (
            soup.select("article.post")
            or soup.select("div.scheme-card")
            or soup.select("table.scheme-table tr")
            or soup.select("li.scheme-item")
            or soup.select("table tr")
            or soup.select(".entry-content li")
        )

        for el in candidates:
            text = el.get_text(separator=" ", strip=True)

            # BDA uses "site" — accept site allotment as residential plots
            if not any(k in text.lower() for k in (
                "site allot", "plot", "residential site", "residential plot",
                "layout", "arkavathy", "jp nagar", "kempegowda",
            )):
                continue

            # Strict exclusions
            if any(k in text.lower() for k in (
                "flat", "apartment", "lig", "ews", "mig flat",
                "e-auction", "commercial", "industrial",
            )):
                continue

            if len(text) < 15:
                continue

            name_el = el.select_one("h2, h3, h4, .scheme-title, td.scheme-name, a.scheme-link, strong")
            raw_name = name_el.get_text(strip=True) if name_el else text[:120].strip()

            if len(raw_name) < 10:
                continue

            # BDA naming convention: "BDA + Layout/Scheme Name + Year"
            name = raw_name if raw_name.upper().startswith("BDA") else f"BDA {raw_name}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            # Normalize: "site" → use "Residential Sites" in name
            if "site allot" in name.lower() and "residential" not in name.lower():
                name = name.replace("Site Allotment", "Residential Sites Lottery")
                name = name.replace("site allotment", "Residential Sites Lottery")

            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            # Extract total plots / sites
            plots_m = re.search(r"(\d[\d,]+)\s*(?:plots?|sites?|units?)", text, re.IGNORECASE)
            total_plots = int(plots_m.group(1).replace(",", "")) if plots_m else None

            # Extract price
            price_m = re.search(r"(?:₹|Rs\.?)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b", text, re.IGNORECASE)
            price_min = float(price_m.group(1)) if price_m else None

            # Extract area
            area_m = re.search(r"(\d+)\s*(?:sq\.?\s*ft|sqft)", text, re.IGNORECASE)
            area_sqft_min = int(area_m.group(1)) if area_m else None

            status_el = el.select_one(".status, .badge, span.tag")
            status_text = status_el.get_text(strip=True) if status_el else text
            status = self.normalise_status(status_text)

            schemes.append(_scheme(
                "BDA", "Bangalore", name, status, source_url,
                data_source="LIVE",
                apply_url=apply_url,
                total_plots=total_plots,
                price_min=price_min,
                area_sqft_min=area_sqft_min,
            ))

        # Deduplicate
        seen = set()
        return [s for s in schemes if not (s.scheme_id in seen or seen.add(s.scheme_id))]

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(name="BDA Arkavathy Layout 2E Residential Sites Lottery 2026",
                 status="OPEN",      open_date="2026-01-01", close_date="2026-04-30",
                 total_plots=5000,   price_min=55.0, price_max=350.0,
                 area_sqft_min=600,  area_sqft_max=4800,
                 location_details="Arkavathy Layout, North Bangalore"),
            dict(name="BDA JP Nagar 9th Phase Residential Plot Lottery 2026",
                 status="UPCOMING",  open_date="2026-07-01", close_date="2026-09-30",
                 total_plots=800,    price_min=90.0, price_max=500.0,
                 area_sqft_min=1200, area_sqft_max=6000,
                 location_details="JP Nagar 9th Phase, South Bangalore"),
            dict(name="BDA Kempegowda Layout Residential Sites Lottery 2026",
                 status="UPCOMING",  open_date="2026-10-01", close_date="2026-12-31",
                 total_plots=3200,   price_min=60.0, price_max=280.0,
                 area_sqft_min=600,  area_sqft_max=2400,
                 location_details="Kempegowda Layout, Bangalore"),
        ]
        return [_scheme("BDA", "Bangalore", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        apply_url="https://bdabangalore.org/site-allotment/",
                        **{k: v for k, v in d.items() if k not in ("name", "status")})
                for d in data]


# ===========================================================================
# KHB — Karnataka Housing Board
# ===========================================================================

class KHBScraper(BaseScraper):
    """
    Karnataka Housing Board — Mysuru, Hubballi, Mangalore, Belgaum, Tumkur,
    Davangere, Shimoga, Gulbarga.
    Primary: https://khb.kar.nic.in/schemes.aspx
    KHB uses standard HTML — requests + BeautifulSoup works.
    """

    BASE_URL    = "https://khb.kar.nic.in"
    SCHEME_URLS = [
        "https://khb.kar.nic.in/schemes.aspx",
        "https://khb.kar.nic.in/plot-allotment",
        "https://khb.kar.nic.in",
    ]

    # City keywords in scheme name → canonical city name
    CITY_MAP = {
        "mysur": "Mysuru",    "mysore": "Mysuru",
        "hubbal": "Hubballi", "dharwad": "Hubballi",
        "mangal": "Mangalore","manglore": "Mangalore",
        "belagav": "Belgaum", "belgaum": "Belgaum",
        "tumak": "Tumkur",    "tumkur": "Tumkur",
        "davanag": "Davangere",
        "shimog": "Shimoga",  "shivamog": "Shimoga",
        "gulbarg": "Gulbarga","kalaburg": "Gulbarga",
    }

    def __init__(self):
        super().__init__("Mysuru", "KHB", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        for url in self.SCHEME_URLS:
            soup = self.get_soup(url)
            if soup:
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def _detect_city(self, text: str) -> str:
        t = text.lower()
        for keyword, city in self.CITY_MAP.items():
            if keyword in t:
                return city
        return "Mysuru"  # default to first city if undetected

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        rows = (
            soup.select("table tr")
            or soup.select("div.scheme-item")
            or soup.select("li")
        )

        for row in rows:
            text = row.get_text(separator=" ", strip=True)

            if not any(k in text.lower() for k in ("plot", "residential", "layout", "site")):
                continue
            if any(k in text.lower() for k in ("flat", "lig", "ews", "e-auction", "commercial")):
                continue
            if len(text) < 15:
                continue

            cells = row.find_all(["td"])
            name_text = (cells[0].get_text(strip=True)
                         if cells else text[:100])
            if len(name_text) < 10:
                continue

            city = self._detect_city(text)
            name = name_text if name_text.startswith("KHB") else f"KHB {name_text}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            link = row.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            # Parse plots count
            plots_m = re.search(r"(\d[\d,]+)\s*(?:plots?|sites?|units?)", text, re.IGNORECASE)
            total_plots = int(plots_m.group(1).replace(",", "")) if plots_m else None

            status = self.normalise_status(
                cells[-1].get_text(strip=True) if cells else text
            )

            schemes.append(_scheme(
                "KHB", city, name, status, source_url,
                data_source="LIVE",
                apply_url=apply_url,
                total_plots=total_plots,
            ))

        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(city="Mysuru",    name="KHB Mysuru Outer Ring Road Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-06-01", close_date="2026-08-31",
                 total_plots=750,   price_min=35.0, price_max=150.0,
                 area_sqft_min=1200, area_sqft_max=4800,
                 location_details="ORR Extension, Mysuru"),
            dict(city="Hubballi",  name="KHB Hubballi Dharwad Smart City Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-08-01", close_date="2026-10-31",
                 total_plots=550,   price_min=28.0, price_max=90.0,
                 location_details="Smart City Zone, Hubballi-Dharwad"),
            dict(city="Mangalore", name="KHB Mangalore Deralakatte Residential Plot Lottery 2025",
                 status="CLOSED",   open_date="2025-07-01", close_date="2025-09-30",
                 total_plots=420,   price_min=40.0, price_max=180.0,
                 location_details="Deralakatte, Mangalore"),
            dict(city="Belgaum",   name="KHB Belagavi Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-09-01", close_date="2026-11-30",
                 total_plots=500,   price_min=26.0, price_max=75.0,
                 location_details="Belagavi, North Karnataka"),
            dict(city="Tumkur",    name="KHB Tumakuru Bangalore Periphery Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-07-01", close_date="2026-09-30",
                 total_plots=480,   price_min=28.0, price_max=80.0,
                 location_details="Tumakuru, Bangalore Periphery"),
        ]
        return [_scheme("KHB", d["city"], d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name", "status", "city")})
                for d in data]
