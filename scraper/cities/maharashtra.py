"""
GovPlot Tracker — Maharashtra Scrapers
========================================
Authorities: MHADA, CIDCO, PMRDA, NIT

MHADA and CIDCO have large lotteries with well-structured HTML tables.
CIDCO uses a dedicated housing portal at cidcohomes.com.
NIT (Nagpur Improvement Trust) has a simpler HTML site.
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


def _extract_year(text: str) -> str:
    m = re.search(r"20(2[4-9]|[3-9]\d)", text)
    if m:
        return m.group(0)
    return str(datetime.now(timezone.utc).year)


def _to_lakh(text: str) -> float | None:
    text = text.replace(",", "")
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b", text, re.IGNORECASE)
    if m:
        return float(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:crore|cr)\b", text, re.IGNORECASE)
    if m:
        return round(float(m.group(1)) * 100, 1)
    return None


# ===========================================================================
# MHADA — Maharashtra Housing and Area Development Authority
# ===========================================================================

class MHADAScraper(BaseScraper):
    """
    MHADA — covers Mumbai, Pune, Nashik, Nagpur, Aurangabad, Thane,
             Kolhapur, Kalyan, Vasai.
    Primary: https://mhada.gov.in/scheme-list
    MHADA has well-structured HTML tables with scheme name, dates, status.
    """

    BASE_URL     = "https://mhada.gov.in"
    SCHEME_URLS  = [
        "https://mhada.gov.in/scheme-list",
        "https://mhada.gov.in/ongoing-schemes",
        "https://mhada.gov.in/schemes",
    ]

    # City name → MHADA board name (for identifying which city a scheme belongs to)
    BOARD_CITY_MAP = {
        "mumbai": "Mumbai",      "konkan": "Mumbai",
        "pune":   "Pune",        "nashik": "Nashik",
        "nagpur": "Nagpur",      "aurangabad": "Aurangabad",
        "sambhajinagar": "Aurangabad",
        "thane":  "Thane",       "kolhapur": "Kolhapur",
        "kalyan": "Kalyan",      "vasai": "Vasai",
    }

    def __init__(self):
        super().__init__("Mumbai", "MHADA", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        for url in self.SCHEME_URLS:
            soup = self.get_soup(url)
            if soup and self._has_content(soup):
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def _has_content(self, soup) -> bool:
        t = soup.get_text().lower()
        return any(k in t for k in ("plot", "lottery", "scheme", "allot"))

    def _detect_city(self, text: str) -> str:
        t = text.lower()
        for keyword, city in self.BOARD_CITY_MAP.items():
            if keyword in t:
                return city
        return "Mumbai"

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        rows = (
            soup.select("table.scheme-table tbody tr")
            or soup.select("table tr")
            or soup.select("div.scheme-card")
            or soup.select("li.scheme-item")
        )

        for row in rows:
            text = row.get_text(separator=" ", strip=True)

            # Must be residential plot — not flat/LIG/EWS
            if not any(k in text.lower() for k in ("plot", "plot lottery", "residential plot")):
                continue
            if any(k in text.lower() for k in (
                "flat", "apartment", "lig", "ews", "mig",
                "e-auction", "eauction", "commercial",
            )):
                continue
            if len(text) < 15:
                continue

            cells = row.find_all(["td"])
            name_text = cells[0].get_text(strip=True) if cells else text[:100]
            if len(name_text) < 10:
                continue

            city = self._detect_city(text)
            name = name_text if name_text.startswith("MHADA") else f"MHADA {name_text}"
            year = _extract_year(name)
            if year not in name:
                name = f"{name} {year}"

            link = row.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            # Parse dates from cells
            open_date  = None
            close_date = None
            if len(cells) >= 3:
                date_pattern = r"\d{2}[/-]\d{2}[/-]\d{4}"
                for cell in cells[1:]:
                    dates = re.findall(date_pattern, cell.get_text())
                    if dates and not open_date:
                        parts = re.split(r"[/-]", dates[0])
                        open_date = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
                    elif dates and not close_date:
                        parts = re.split(r"[/-]", dates[0])
                        close_date = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"

            # Price from text
            price_min = _to_lakh(text)

            status = self.normalise_status(cells[-1].get_text() if cells else text)

            schemes.append(_scheme(
                "MHADA", city, name, status, source_url,
                data_source="LIVE",
                apply_url=apply_url,
                open_date=open_date,
                close_date=close_date,
                price_min=price_min,
            ))

        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(city="Mumbai",     name="MHADA Mumbai Board Residential Plot Lottery 2026",
                 status="OPEN",     open_date="2026-02-01", close_date="2026-05-31",
                 total_plots=3500,  price_min=60.0,  price_max=850.0,
                 area_sqft_min=300, area_sqft_max=900,
                 location_details="MMR Multiple Locations, Mumbai"),
            dict(city="Pune",       name="MHADA Pune Board Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-07-01", close_date="2026-09-30",
                 total_plots=5000,  price_min=35.0,  price_max=320.0,
                 area_sqft_min=270, area_sqft_max=900,
                 location_details="Pune, Pimpri Chinchwad"),
            dict(city="Nashik",     name="MHADA Nashik Board Residential Plot Lottery 2025",
                 status="CLOSED",   open_date="2025-05-01", close_date="2025-07-31",
                 total_plots=1000,  price_min=28.0,  price_max=80.0,
                 location_details="Nashik, Maharashtra"),
            dict(city="Nagpur",     name="MHADA Nagpur Board Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-08-01", close_date="2026-10-31",
                 total_plots=400,   price_min=30.0,  price_max=100.0,
                 location_details="Nagpur, Maharashtra"),
            dict(city="Aurangabad", name="MHADA Chhatrapati Sambhaji Nagar Board Residential Lottery 2026",
                 status="UPCOMING", open_date="2026-06-01", close_date="2026-08-31",
                 total_plots=800,   price_min=26.0,  price_max=70.0,
                 location_details="Aurangabad, Marathwada"),
            dict(city="Thane",      name="MHADA Thane District Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-09-01", close_date="2026-11-30",
                 total_plots=2500,  price_min=40.0,  price_max=200.0,
                 location_details="Thane District, MMR"),
            dict(city="Kalyan",     name="MHADA Konkan Board Kalyan Dombivli Residential Lottery 2026",
                 status="UPCOMING", open_date="2026-07-01", close_date="2026-09-30",
                 total_plots=1000,  price_min=45.0,  price_max=220.0,
                 location_details="Kalyan-Dombivli, MMR"),
            dict(city="Vasai",      name="MHADA Vasai Virar Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-10-01", close_date="2026-12-31",
                 total_plots=800,   price_min=35.0,  price_max=160.0,
                 location_details="Vasai-Virar, MMR North"),
            dict(city="Kolhapur",   name="MHADA Pune Board Kolhapur Residential Plot Lottery 2025",
                 status="CLOSED",   open_date="2025-06-01", close_date="2025-08-31",
                 total_plots=450,   price_min=25.0,  price_max=70.0,
                 location_details="Kolhapur, Western Maharashtra"),
        ]
        return [_scheme("MHADA", d["city"], d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name", "status", "city")})
                for d in data]


# ===========================================================================
# CIDCO — City and Industrial Development Corporation
# ===========================================================================

class CIDCOScraper(BaseScraper):
    """
    CIDCO — Navi Mumbai, Panvel, Kharghar, Dronagiri.
    Primary: https://cidcohomes.com/schemes
    CIDCO runs India's largest housing lotteries.
    """

    BASE_URL     = "https://cidcohomes.com"
    SCHEME_URLS  = [
        "https://cidcohomes.com/schemes",
        "https://cidcohomes.com/ongoing-scheme",
        "https://cidcohomes.com",
    ]

    def __init__(self):
        super().__init__("Navi Mumbai", "CIDCO", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        for url in self.SCHEME_URLS:
            soup = self.get_soup(url)
            if soup:
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        for el in (
            soup.select("div.scheme-card")
            or soup.select("table tr")
            or soup.select("article")
            or soup.select("li")
        ):
            text = el.get_text(separator=" ", strip=True)

            if not any(k in text.lower() for k in ("plot", "residential", "mass housing", "lottery")):
                continue
            if any(k in text.lower() for k in ("flat", "lig", "ews", "e-auction", "commercial")):
                continue
            if len(text) < 15:
                continue

            name_el = el.select_one("h2, h3, h4, .title, strong, a")
            raw_name = name_el.get_text(strip=True) if name_el else text[:100]
            if len(raw_name) < 10:
                continue

            name = raw_name if raw_name.startswith("CIDCO") else f"CIDCO {raw_name}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            # Detect city
            city = "Navi Mumbai"
            for kw, c in [("panvel", "Panvel"), ("kharghar", "Navi Mumbai"),
                           ("dronagiri", "Navi Mumbai"), ("taloja", "Navi Mumbai")]:
                if kw in text.lower():
                    city = c
                    break

            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            plots_m = re.search(r"(\d[\d,]+)\s*(?:plots?|units?)", text, re.IGNORECASE)
            total_plots = int(plots_m.group(1).replace(",", "")) if plots_m else None

            schemes.append(_scheme(
                "CIDCO", city, name, self.normalise_status(text),
                source_url, data_source="LIVE",
                apply_url=apply_url,
                total_plots=total_plots,
            ))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(city="Navi Mumbai", name="CIDCO Navi Mumbai Residential Plot Lottery 2026",
                 status="OPEN",     open_date="2026-01-01", close_date="2026-04-30",
                 total_plots=15000, price_min=45.0, price_max=200.0,
                 area_sqft_min=400, area_sqft_max=700,
                 location_details="Kharghar, Taloja, Dronagiri, Navi Mumbai"),
            dict(city="Panvel",     name="CIDCO Panvel Kharghar Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-07-01", close_date="2026-09-30",
                 total_plots=2000,  price_min=40.0, price_max=200.0,
                 location_details="Panvel-Kharghar, Navi Mumbai South"),
        ]
        return [_scheme("CIDCO", d["city"], d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name", "status", "city")})
                for d in data]


# ===========================================================================
# PMRDA — Pune Metropolitan Region Development Authority
# ===========================================================================

class PMRDAScraper(BaseScraper):
    """
    PMRDA — Pune metro region plots (Chakan, Urse, Mahalunge).
    Primary: https://pmrda.gov.in/residential-schemes
    """

    BASE_URL     = "https://pmrda.gov.in"
    SCHEME_URLS  = [
        "https://pmrda.gov.in/residential-schemes",
        "https://pmrda.gov.in/schemes",
        "https://pmrda.gov.in",
    ]

    def __init__(self):
        super().__init__("Pune", "PMRDA", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        for url in self.SCHEME_URLS:
            soup = self.get_soup(url)
            if soup:
                schemes = self._parse(soup, url)
                if schemes:
                    return schemes
        return []

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        for el in soup.select("table tr, div.scheme, article, li"):
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential")):
                continue
            if any(k in text.lower() for k in ("flat", "lig", "ews", "e-auction")):
                continue
            if len(text) < 15:
                continue

            name_el = el.select_one("h2, h3, td, a, .title")
            raw = name_el.get_text(strip=True) if name_el else text[:100]
            if len(raw) < 10:
                continue

            name = raw if raw.startswith("PMRDA") else f"PMRDA {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            schemes.append(_scheme(
                "PMRDA", "Pune", name, self.normalise_status(text),
                source_url, data_source="LIVE", apply_url=apply_url,
            ))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(name="PMRDA Chakan Integrated Township Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-07-01", close_date="2026-09-30",
                 total_plots=800,   price_min=30.0, price_max=95.0,
                 area_sqft_min=1080, area_sqft_max=3600,
                 location_details="Chakan, Pune"),
            dict(name="PMRDA Urse Node Residential Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-10-01", close_date="2026-12-31",
                 total_plots=1200,  price_min=28.0, price_max=85.0,
                 location_details="Urse Node, Pune Metropolitan Region"),
        ]
        return [_scheme("PMRDA", "Pune", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name", "status")})
                for d in data]


# ===========================================================================
# NIT — Nagpur Improvement Trust
# ===========================================================================

class NITScraper(BaseScraper):
    """
    Nagpur Improvement Trust — residential plot schemes near Hingna Road and MIHAN.
    Primary: https://nagpurimprovement.gov.in/schemes
    """

    BASE_URL    = "https://nagpurimprovement.gov.in"
    SCHEME_URL  = "https://nagpurimprovement.gov.in/schemes"

    def __init__(self):
        super().__init__("Nagpur", "NIT", self.BASE_URL)

    def scrape_live(self) -> list[SchemeData]:
        soup = self.get_soup(self.SCHEME_URL) or self.get_soup(self.BASE_URL)
        if not soup:
            return []
        return self._parse(soup, self.SCHEME_URL)

    def _parse(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        for el in soup.select("table tr, div.scheme, li, article"):
            text = el.get_text(separator=" ", strip=True)
            if not any(k in text.lower() for k in ("plot", "residential", "layout")):
                continue
            if any(k in text.lower() for k in ("flat", "lig", "ews", "e-auction", "commercial")):
                continue
            if len(text) < 15:
                continue

            name_el = el.select_one("h2, h3, td, a")
            raw = name_el.get_text(strip=True) if name_el else text[:100]
            if len(raw) < 8:
                continue

            name = raw if raw.startswith("NIT") else f"NIT {raw}"
            if not re.search(r"20(2[4-9]|[3-9]\d)", name):
                name = f"{name} {datetime.now(timezone.utc).year}"

            link = el.select_one("a[href]")
            apply_url = link["href"] if link else source_url
            if apply_url.startswith("/"):
                apply_url = self.BASE_URL + apply_url

            schemes.append(_scheme(
                "NIT", "Nagpur", name, self.normalise_status(text),
                source_url, data_source="LIVE", apply_url=apply_url,
            ))
        return schemes

    def fallback_schemes(self) -> list[SchemeData]:
        data = [
            dict(name="NIT Hingna Road Residential Plot Lottery 2026",
                 status="OPEN",     open_date="2026-02-01", close_date="2026-04-30",
                 total_plots=650,   price_min=28.0, price_max=80.0,
                 area_sqft_min=900, area_sqft_max=3600,
                 location_details="Hingna Road, Nagpur West"),
            dict(name="NIT MIHAN Residential Township Plot Lottery 2026",
                 status="UPCOMING", open_date="2026-08-01", close_date="2026-10-31",
                 total_plots=1500,  price_min=35.0, price_max=110.0,
                 location_details="MIHAN Nagpur Airport Zone"),
        ]
        return [_scheme("NIT", "Nagpur", d["name"], d["status"], self.BASE_URL,
                        data_source="STATIC",
                        **{k: v for k, v in d.items() if k not in ("name", "status")})
                for d in data]
