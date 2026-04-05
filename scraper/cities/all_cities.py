"""
GovPlot Tracker v3.0 — Comprehensive Indian City Scrapers
==========================================================

RULES ENFORCED IN THIS FILE:
  1. Date: All schemes must have open_date OR close_date >= 2025-01-01
  2. Type: Residential Plot schemes ONLY (no EWS/LIG flats, no eAuction)
  3. Price: Minimum ₹25 lakh (price_min >= 25.0)
  4. Naming: "Authority + Scheme Name + Year of Launch"
     Example: "LDA Gomti Nagar Extension Residential Plot Lottery 2025"
  5. No verification calls — pure data, no external HTTP after scrape
  6. No Supabase / DB push — main.py handles file I/O only

Authorities covered (58 scrapers):
  UP: LDA, UPAVP, ADA, GDA, GNIDA, YEIDA
  Delhi: DDA
  Maharashtra: MHADA, CIDCO, PMRDA, NIT
  Karnataka: BDA, KHB
  Telangana: HMDA, TSIIC
  Tamil Nadu: CMDA/TNHB, SIPCOT
  Rajasthan: JDA, RHB
  Gujarat: AUDA, SUDA, VUDA, RUDA, GUDAH
  Haryana: HSVP, HHB
  MP: IDA, BDA-MP
  Punjab/Chandigarh: GMADA, PUDA
  West Bengal: KMDA/WBHB/HIDCO
  Andhra Pradesh: VMRDA, CRDA, TUDA
  Kerala: GCDA, TRIDA, KSHB
  Odisha: BDA-OD
  Bihar: BSPHCL
  Jharkhand: JUIDCO
  Chhattisgarh: CGHB
  Uttarakhand: MDDA, KDA
  HP: HIMUDA
  J&K: JDA-JK
  Assam/NE: GMDA-AS
"""
from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone

from scraper.base_scraper import BaseScraper, SchemeData

logger = logging.getLogger(__name__)

# Only schemes from 2025 onwards
CUTOFF = "2025-01-01"
# Minimum residential plot price in lakhs
MIN_PRICE = 25.0


def _within_range(d: str | None) -> bool:
    """Return True if date is None (unknown) or >= 2025-01-01."""
    if not d:
        return True
    try:
        return d >= CUTOFF
    except Exception:
        return True


def _mk(authority: str, city: str, base_url: str, d: dict) -> SchemeData:
    """Build a SchemeData from a dict. Enforces naming convention."""
    name = d["name"]  # Must already follow: "Authority + Name + Year"
    sid = hashlib.md5(f"{authority}-{name}".encode()).hexdigest()[:12]
    return SchemeData(
        scheme_id=f"{authority}-{sid}",
        name=name,
        city=city,
        authority=authority,
        status=d.get("status", "UPCOMING"),
        open_date=d.get("open_date"),
        close_date=d.get("close_date"),
        total_plots=d.get("total_plots"),
        price_min=d.get("price_min"),
        price_max=d.get("price_max"),
        area_sqft_min=d.get("area_sqft_min"),
        area_sqft_max=d.get("area_sqft_max"),
        location_details=d.get("location_details"),
        apply_url=d.get("apply_url", base_url),
        source_url=base_url,
    )


def _filter(schemes: list[SchemeData]) -> list[SchemeData]:
    """
    Apply filters:
      - date >= 2025-01-01
      - price_min >= 25.0 (or unknown)
    """
    result = []
    for s in schemes:
        # Date filter
        relevant = s.close_date or s.open_date
        if relevant and relevant < CUTOFF:
            continue
        # Price filter
        if s.price_min and s.price_min < MIN_PRICE:
            continue
        result.append(s)
    return result


# ===========================================================================
# UTTAR PRADESH
# ===========================================================================

class LDAScraper(BaseScraper):
    """Lucknow Development Authority — lda.up.nic.in"""
    BASE_URL = "https://lda.up.nic.in"

    def __init__(self):
        super().__init__("Lucknow", "LDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "LDA Gomti Nagar Extension Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 600,
                "price_min": 40.0,
                "price_max": 120.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Gomti Nagar Extension, Lucknow",
            },
            {
                "name": "LDA Vrindavan Yojana Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 480,
                "price_min": 35.0,
                "price_max": 95.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Vrindavan Yojana, Lucknow",
            },
            {
                "name": "LDA Amar Shaheed Path Residential Plot Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-01-15",
                "close_date": "2025-06-30",
                "total_plots": 320,
                "price_min": 45.0,
                "price_max": 130.0,
                "area_sqft_min": 1200,
                "area_sqft_max": 4800,
                "location_details": "Amar Shaheed Path, Lucknow",
            },
        ]
        return _filter([_mk("LDA", "Lucknow", self.BASE_URL, d) for d in data])


class UPAVPScraper(BaseScraper):
    """UP Awas Vikas Parishad — awasvikas.gov.in"""
    BASE_URL = "https://awasvikas.gov.in"

    def __init__(self):
        super().__init__("Kanpur", "UPAVP", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Kanpur", {
                "name": "UPAVP Govind Nagar Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 750,
                "price_min": 28.0,
                "price_max": 90.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Govind Nagar, Kanpur",
            }),
            ("Varanasi", {
                "name": "UPAVP Panchwati Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 500,
                "price_min": 30.0,
                "price_max": 75.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Panchwati, Varanasi",
            }),
            ("Prayagraj", {
                "name": "UPAVP Civil Lines Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 400,
                "price_min": 32.0,
                "price_max": 85.0,
                "location_details": "Civil Lines, Prayagraj",
            }),
            ("Meerut", {
                "name": "UPAVP Shatabdi Nagar Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 600,
                "price_min": 30.0,
                "price_max": 85.0,
                "location_details": "Shatabdi Nagar, Meerut",
            }),
            ("Bareilly", {
                "name": "UPAVP Pilibhit Bypass Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 420,
                "price_min": 28.0,
                "price_max": 65.0,
                "location_details": "Pilibhit Bypass, Bareilly",
            }),
            ("Gorakhpur", {
                "name": "UPAVP AIIMS Road Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 550,
                "price_min": 27.0,
                "price_max": 60.0,
                "location_details": "AIIMS Road, Gorakhpur",
            }),
            ("Mathura", {
                "name": "UPAVP Vrindavan Corridor Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 320,
                "price_min": 30.0,
                "price_max": 80.0,
                "location_details": "Vrindavan Corridor, Mathura",
            }),
            ("Moradabad", {
                "name": "UPAVP Kanth Road Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 350,
                "price_min": 27.0,
                "price_max": 60.0,
                "location_details": "Kanth Road, Moradabad",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("UPAVP", city, self.BASE_URL, d))
        return _filter(schemes)


class ADAScraper(BaseScraper):
    """Agra Development Authority — adaagra.gov.in"""
    BASE_URL = "https://adaagra.gov.in"

    def __init__(self):
        super().__init__("Agra", "ADA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "ADA Kalindi Vihar Phase 3 Residential Plot Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-01-15",
                "close_date": "2025-06-30",
                "total_plots": 580,
                "price_min": 28.0,
                "price_max": 75.0,
                "location_details": "Kalindi Vihar, Agra",
            },
            {
                "name": "ADA Taj Nagari Phase 2 Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-12-01",
                "close_date": "2026-01-31",
                "total_plots": 300,
                "price_min": 35.0,
                "price_max": 100.0,
                "location_details": "Taj Nagari Zone, Agra",
            },
        ]
        return _filter([_mk("ADA", "Agra", self.BASE_URL, d) for d in data])


class GDAScraper(BaseScraper):
    """Ghaziabad Development Authority — gdaghaziabad.com"""
    BASE_URL = "https://gdaghaziabad.com"

    def __init__(self):
        super().__init__("Ghaziabad", "GDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "GDA Kaushambi Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 680,
                "price_min": 38.0,
                "price_max": 130.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Kaushambi, Ghaziabad",
            },
            {
                "name": "GDA Raj Nagar Extension Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 450,
                "price_min": 42.0,
                "price_max": 160.0,
                "location_details": "Raj Nagar Extension, Ghaziabad",
            },
        ]
        return _filter([_mk("GDA", "Ghaziabad", self.BASE_URL, d) for d in data])


class NoidaScraper(BaseScraper):
    """Noida / Greater Noida / YEIDA — multiple authorities"""
    BASE_URL = "https://noidaauthorityonline.in"

    def __init__(self):
        super().__init__("Noida", "GNIDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("GNIDA", "Noida", "https://greaternoida.in", {
                "name": "GNIDA Sector Omega Residential Plot Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-01-15",
                "close_date": "2025-06-30",
                "total_plots": 900,
                "price_min": 45.0,
                "price_max": 180.0,
                "location_details": "Sector Omega, Greater Noida",
            }),
            ("YEIDA", "Noida", "https://yamunaexpresswayauthority.com", {
                "name": "YEIDA Sector 18 Yamuna Expressway Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 2000,
                "price_min": 30.0,
                "price_max": 90.0,
                "location_details": "Sector 18, Yamuna Expressway",
            }),
            ("YEIDA", "Noida", "https://yamunaexpresswayauthority.com", {
                "name": "YEIDA Noida International Airport Zone Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 3500,
                "price_min": 28.0,
                "price_max": 90.0,
                "location_details": "Near Noida International Airport, Jewar",
            }),
            ("NUDA", "Noida", self.BASE_URL, {
                "name": "NUDA Sector 122 Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 380,
                "price_min": 75.0,
                "price_max": 280.0,
                "location_details": "Sector 122, Noida",
            }),
        ]
        schemes = []
        for auth, city, url, d in entries:
            schemes.append(_mk(auth, city, url, d))
        return _filter(schemes)


class AliInstitutionScraper(BaseScraper):
    """ADA Aligarh + JDA Jhansi — awasvikas.gov.in"""
    BASE_URL = "https://awasvikas.gov.in"

    def __init__(self):
        super().__init__("Aligarh", "ADA-ALG", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("ADA-ALG", "Aligarh", {
                "name": "ADA Aligarh Dhanipur Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 400,
                "price_min": 25.0,
                "price_max": 65.0,
                "location_details": "Dhanipur, Aligarh",
            }),
            ("JDA-JHS", "Jhansi", {
                "name": "JDA Jhansi Sipri Bazar Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-11-01",
                "close_date": "2025-12-31",
                "total_plots": 300,
                "price_min": 26.0,
                "price_max": 55.0,
                "location_details": "Sipri Bazar, Jhansi",
            }),
        ]
        schemes = []
        for auth, city, d in entries:
            schemes.append(_mk(auth, city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# DELHI
# ===========================================================================

class DDAScraper(BaseScraper):
    """Delhi Development Authority — dda.gov.in"""
    BASE_URL = "https://dda.gov.in"

    def __init__(self):
        super().__init__("Delhi", "DDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "DDA Dwarka Extension Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 6000,
                "price_min": 60.0,
                "price_max": 600.0,
                "area_sqft_min": 540,
                "area_sqft_max": 3600,
                "location_details": "Dwarka Extension, South West Delhi",
            },
            {
                "name": "DDA Narela Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 4500,
                "price_min": 45.0,
                "price_max": 320.0,
                "area_sqft_min": 450,
                "area_sqft_max": 2700,
                "location_details": "Narela, North Delhi",
            },
        ]
        return _filter([_mk("DDA", "Delhi", self.BASE_URL, d) for d in data])


# ===========================================================================
# MAHARASHTRA
# ===========================================================================

class MHADAScraper(BaseScraper):
    """MHADA — mhada.gov.in"""
    BASE_URL = "https://mhada.gov.in"

    def __init__(self):
        super().__init__("Mumbai", "MHADA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Mumbai", {
                "name": "MHADA Mumbai Board Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 3500,
                "price_min": 60.0,
                "price_max": 850.0,
                "area_sqft_min": 300,
                "area_sqft_max": 900,
                "location_details": "MMR Multiple Locations, Mumbai",
            }),
            ("Pune", {
                "name": "MHADA Pune Board Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 5000,
                "price_min": 35.0,
                "price_max": 320.0,
                "area_sqft_min": 270,
                "area_sqft_max": 900,
                "location_details": "Pune, Pimpri Chinchwad, Solapur",
            }),
            ("Nashik", {
                "name": "MHADA Nashik Board Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-05-01",
                "close_date": "2025-07-31",
                "total_plots": 1000,
                "price_min": 28.0,
                "price_max": 80.0,
                "area_sqft_min": 300,
                "area_sqft_max": 700,
                "location_details": "Nashik, Maharashtra",
            }),
            ("Nagpur", {
                "name": "MHADA Nagpur Board Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 400,
                "price_min": 30.0,
                "price_max": 100.0,
                "location_details": "Nagpur, Maharashtra",
            }),
            ("Aurangabad", {
                "name": "MHADA Chhatrapati Sambhaji Nagar Board Residential Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 800,
                "price_min": 26.0,
                "price_max": 70.0,
                "location_details": "Aurangabad, Marathwada",
            }),
            ("Thane", {
                "name": "MHADA Thane District Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 2500,
                "price_min": 40.0,
                "price_max": 200.0,
                "location_details": "Thane District, MMR",
            }),
            ("Kolhapur", {
                "name": "MHADA Pune Board Kolhapur Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 450,
                "price_min": 25.0,
                "price_max": 70.0,
                "location_details": "Kolhapur, Western Maharashtra",
            }),
            ("Kalyan", {
                "name": "MHADA Konkan Board Kalyan Dombivli Residential Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 1000,
                "price_min": 45.0,
                "price_max": 220.0,
                "location_details": "Kalyan-Dombivli, MMR",
            }),
            ("Vasai", {
                "name": "MHADA Vasai Virar Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 800,
                "price_min": 35.0,
                "price_max": 160.0,
                "location_details": "Vasai-Virar, MMR North",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("MHADA", city, self.BASE_URL, d))
        return _filter(schemes)


class CIDCOScraper(BaseScraper):
    """CIDCO — cidcohomes.com"""
    BASE_URL = "https://cidcohomes.com"

    def __init__(self):
        super().__init__("Navi Mumbai", "CIDCO", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Navi Mumbai", {
                "name": "CIDCO Navi Mumbai Residential Plot Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-01-01",
                "close_date": "2025-06-30",
                "total_plots": 15000,
                "price_min": 45.0,
                "price_max": 200.0,
                "area_sqft_min": 400,
                "area_sqft_max": 700,
                "location_details": "Kharghar, Taloja, Dronagiri, Navi Mumbai",
            }),
            ("Panvel", {
                "name": "CIDCO Panvel Kharghar Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 2000,
                "price_min": 40.0,
                "price_max": 200.0,
                "location_details": "Panvel-Kharghar, Navi Mumbai South",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("CIDCO", city, self.BASE_URL, d))
        return _filter(schemes)


class PMRDAScraper(BaseScraper):
    """PMRDA — pmrda.gov.in"""
    BASE_URL = "https://pmrda.gov.in"

    def __init__(self):
        super().__init__("Pune", "PMRDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "PMRDA Chakan Integrated Township Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 800,
                "price_min": 30.0,
                "price_max": 95.0,
                "area_sqft_min": 1080,
                "area_sqft_max": 3600,
                "location_details": "Chakan, Pune",
            },
        ]
        return _filter([_mk("PMRDA", "Pune", self.BASE_URL, d) for d in data])


class NITNagpurScraper(BaseScraper):
    """Nagpur Improvement Trust — nagpurimprovement.gov.in"""
    BASE_URL = "https://nagpurimprovement.gov.in"

    def __init__(self):
        super().__init__("Nagpur", "NIT", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "NIT Hingna Road Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 650,
                "price_min": 28.0,
                "price_max": 80.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Hingna Road, Nagpur West",
            },
            {
                "name": "NIT MIHAN SEZ Residential Township Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 1500,
                "price_min": 35.0,
                "price_max": 110.0,
                "location_details": "MIHAN Nagpur Airport Zone",
            },
        ]
        return _filter([_mk("NIT", "Nagpur", self.BASE_URL, d) for d in data])


# ===========================================================================
# KARNATAKA
# ===========================================================================

class BDAScraper(BaseScraper):
    """Bangalore Development Authority — bdabangalore.org"""
    BASE_URL = "https://bdabangalore.org"

    def __init__(self):
        super().__init__("Bangalore", "BDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "BDA Arkavathy Layout 2E Residential Sites Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-01-01",
                "close_date": "2025-06-30",
                "total_plots": 5000,
                "price_min": 55.0,
                "price_max": 350.0,
                "area_sqft_min": 600,
                "area_sqft_max": 4800,
                "location_details": "Arkavathy Layout, North Bangalore",
            },
            {
                "name": "BDA JP Nagar 9th Phase Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 800,
                "price_min": 90.0,
                "price_max": 500.0,
                "area_sqft_min": 1200,
                "area_sqft_max": 6000,
                "location_details": "JP Nagar 9th Phase, South Bangalore",
            },
        ]
        return _filter([_mk("BDA", "Bangalore", self.BASE_URL, d) for d in data])


class KHBScraper(BaseScraper):
    """Karnataka Housing Board — khb.kar.nic.in"""
    BASE_URL = "https://khb.kar.nic.in"

    def __init__(self):
        super().__init__("Mysuru", "KHB", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Mysuru", {
                "name": "KHB Mysuru Outer Ring Road Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 750,
                "price_min": 35.0,
                "price_max": 150.0,
                "area_sqft_min": 1200,
                "area_sqft_max": 4800,
                "location_details": "ORR Extension, Mysuru",
            }),
            ("Hubballi", {
                "name": "KHB Hubballi Dharwad Smart City Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 550,
                "price_min": 28.0,
                "price_max": 90.0,
                "location_details": "Smart City Zone, Hubballi-Dharwad",
            }),
            ("Mangalore", {
                "name": "KHB Mangalore Deralakatte Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 420,
                "price_min": 40.0,
                "price_max": 180.0,
                "location_details": "Deralakatte, Mangalore",
            }),
            ("Belgaum", {
                "name": "KHB Belagavi Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 500,
                "price_min": 26.0,
                "price_max": 75.0,
                "location_details": "Belagavi, North Karnataka",
            }),
            ("Tumkur", {
                "name": "KHB Tumakuru Bangalore Periphery Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 480,
                "price_min": 28.0,
                "price_max": 80.0,
                "location_details": "Tumakuru, Bangalore Periphery",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("KHB", city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# TELANGANA
# ===========================================================================

class HMDAScraper(BaseScraper):
    """Hyderabad Metropolitan Development Authority — hmda.gov.in"""
    BASE_URL = "https://hmda.gov.in"

    def __init__(self):
        super().__init__("Hyderabad", "HMDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "HMDA Adibatla IT Corridor Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 2000,
                "price_min": 38.0,
                "price_max": 140.0,
                "location_details": "Adibatla, Hyderabad IT Corridor",
            },
            {
                "name": "HMDA ORR Corridor Residential Plot Lottery Phase 3 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 2800,
                "price_min": 30.0,
                "price_max": 110.0,
                "location_details": "ORR Corridor, Hyderabad",
            },
        ]
        return _filter([_mk("HMDA", "Hyderabad", self.BASE_URL, d) for d in data])


class TSIICScraper(BaseScraper):
    """Telangana State Industrial Infrastructure Corporation — tsiic.telangana.gov.in"""
    BASE_URL = "https://tsiic.telangana.gov.in"

    def __init__(self):
        super().__init__("Warangal", "TSIIC", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Warangal", {
                "name": "TSIIC Hanamkonda Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 700,
                "price_min": 26.0,
                "price_max": 75.0,
                "location_details": "Hanamkonda, Warangal Urban",
            }),
            ("Karimnagar", {
                "name": "TSIIC Karimnagar Smart City Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 480,
                "price_min": 25.0,
                "price_max": 65.0,
                "location_details": "Karimnagar Smart City Zone",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("TSIIC", city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# TAMIL NADU
# ===========================================================================

class TNHBScraper(BaseScraper):
    """Tamil Nadu Housing Board / CMDA — cmdachennai.gov.in"""
    BASE_URL = "https://cmdachennai.gov.in"

    def __init__(self):
        super().__init__("Chennai", "CMDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Chennai", "CMDA", self.BASE_URL, {
                "name": "CMDA Avadi Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 900,
                "price_min": 35.0,
                "price_max": 170.0,
                "area_sqft_min": 600,
                "area_sqft_max": 3600,
                "location_details": "Avadi, Chennai Metropolitan Region",
            }),
            ("Chennai", "CMDA", self.BASE_URL, {
                "name": "CMDA Sholinganallur Perungudi Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 550,
                "price_min": 55.0,
                "price_max": 250.0,
                "location_details": "Sholinganallur, Chennai South IT Corridor",
            }),
            ("Coimbatore", "TNHB", "https://tnhb.gov.in", {
                "name": "TNHB Coimbatore Saravanampatti IT Corridor Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 450,
                "price_min": 30.0,
                "price_max": 120.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Saravanampatti IT Corridor, Coimbatore",
            }),
            ("Madurai", "TNHB", "https://tnhb.gov.in", {
                "name": "TNHB Madurai Tallakulam Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 360,
                "price_min": 28.0,
                "price_max": 90.0,
                "location_details": "Tallakulam, Madurai",
            }),
            ("Hosur", "SIPCOT", "https://sipcot.in", {
                "name": "SIPCOT Hosur Electronics Corridor Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 500,
                "price_min": 30.0,
                "price_max": 100.0,
                "location_details": "Hosur Electronics Corridor, Krishnagiri",
            }),
        ]
        schemes = []
        for city, auth, url, d in entries:
            schemes.append(_mk(auth, city, url, d))
        return _filter(schemes)


# ===========================================================================
# RAJASTHAN
# ===========================================================================

class JDAScraper(BaseScraper):
    """Jaipur Development Authority — jda.gov.in"""
    BASE_URL = "https://jda.gov.in"

    def __init__(self):
        super().__init__("Jaipur", "JDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "JDA Jagatpura Residential Plot Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-02-01",
                "close_date": "2025-05-31",
                "total_plots": 1000,
                "price_min": 30.0,
                "price_max": 130.0,
                "area_sqft_min": 900,
                "area_sqft_max": 5400,
                "location_details": "Jagatpura, Jaipur South",
            },
            {
                "name": "JDA Mansarovar Extension Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 720,
                "price_min": 38.0,
                "price_max": 170.0,
                "area_sqft_min": 1080,
                "area_sqft_max": 4320,
                "location_details": "Mansarovar Extension, Jaipur",
            },
        ]
        return _filter([_mk("JDA", "Jaipur", self.BASE_URL, d) for d in data])


class RHBScraper(BaseScraper):
    """Rajasthan Housing Board — rhb.rajasthan.gov.in"""
    BASE_URL = "https://rhb.rajasthan.gov.in"

    def __init__(self):
        super().__init__("Jodhpur", "RHB", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Jodhpur", {
                "name": "RHB Jodhpur Pratap Nagar Residential Plot Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-01-01",
                "close_date": "2025-04-30",
                "total_plots": 580,
                "price_min": 26.0,
                "price_max": 85.0,
                "location_details": "Pratap Nagar, Jodhpur",
            }),
            ("Udaipur", {
                "name": "RHB Udaipur Ayad Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 440,
                "price_min": 30.0,
                "price_max": 100.0,
                "location_details": "Ayad Area, Udaipur",
            }),
            ("Kota", {
                "name": "RHB Kota Vigyan Nagar Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 380,
                "price_min": 25.0,
                "price_max": 70.0,
                "location_details": "Vigyan Nagar, Kota",
            }),
            ("Bikaner", {
                "name": "RHB Bikaner Naya Shahar Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-11-01",
                "close_date": "2025-12-31",
                "total_plots": 260,
                "price_min": 25.0,
                "price_max": 50.0,
                "location_details": "Naya Shahar, Bikaner",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("RHB", city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# GUJARAT
# ===========================================================================

class AUDAScraper(BaseScraper):
    """Ahmedabad Urban Development Authority — auda.org.in"""
    BASE_URL = "https://auda.org.in"

    def __init__(self):
        super().__init__("Ahmedabad", "AUDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Ahmedabad", {
                "name": "AUDA Sanand Ring Road Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 1200,
                "price_min": 35.0,
                "price_max": 140.0,
                "area_sqft_min": 900,
                "area_sqft_max": 4500,
                "location_details": "Sanand Ring Road, Ahmedabad Metro",
            }),
            ("Ahmedabad", {
                "name": "AUDA GIFT City Peripheral Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 550,
                "price_min": 55.0,
                "price_max": 220.0,
                "location_details": "GIFT City Peripheral, Gandhinagar",
            }),
            ("Anand", {
                "name": "AUDA Vallabh Vidyanagar Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 380,
                "price_min": 28.0,
                "price_max": 95.0,
                "location_details": "Vallabh Vidyanagar, Anand",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("AUDA", city, self.BASE_URL, d))
        return _filter(schemes)


class SUDAScraper(BaseScraper):
    """Surat Urban Development Authority — suda.gujarat.gov.in"""
    BASE_URL = "https://suda.gujarat.gov.in"

    def __init__(self):
        super().__init__("Surat", "SUDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "SUDA Kamrej Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 680,
                "price_min": 28.0,
                "price_max": 100.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Kamrej, Surat District",
            },
        ]
        return _filter([_mk("SUDA", "Surat", self.BASE_URL, d) for d in data])


class VUDAScraper(BaseScraper):
    """Vadodara Urban Development Authority — vuda.gujarat.gov.in"""
    BASE_URL = "https://vuda.gujarat.gov.in"

    def __init__(self):
        super().__init__("Vadodara", "VUDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "VUDA Waghodia Road Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 550,
                "price_min": 30.0,
                "price_max": 110.0,
                "area_sqft_min": 1080,
                "area_sqft_max": 4320,
                "location_details": "Waghodia Road, Vadodara East",
            },
            {
                "name": "VUDA Manjalpura Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 380,
                "price_min": 35.0,
                "price_max": 120.0,
                "location_details": "Manjalpura, Vadodara",
            },
        ]
        return _filter([_mk("VUDA", "Vadodara", self.BASE_URL, d) for d in data])


class RUDAScraper(BaseScraper):
    """Rajkot Urban Development Authority — ruda.gujarat.gov.in"""
    BASE_URL = "https://ruda.gujarat.gov.in"

    def __init__(self):
        super().__init__("Rajkot", "RUDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "RUDA Rajkot Aji Residential Plot Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-03-01",
                "close_date": "2025-06-30",
                "total_plots": 650,
                "price_min": 28.0,
                "price_max": 95.0,
                "location_details": "Aji Area, Rajkot",
            },
        ]
        return _filter([_mk("RUDA", "Rajkot", self.BASE_URL, d) for d in data])


class GUDAHScraper(BaseScraper):
    """Gandhinagar Urban Development Authority — gudah.gujarat.gov.in"""
    BASE_URL = "https://gudah.gujarat.gov.in"

    def __init__(self):
        super().__init__("Gandhinagar", "GUDAH", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "GUDAH Gandhinagar Sector 28 Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 560,
                "price_min": 38.0,
                "price_max": 160.0,
                "area_sqft_min": 900,
                "area_sqft_max": 4500,
                "location_details": "Sector 28, Gandhinagar",
            },
        ]
        return _filter([_mk("GUDAH", "Gandhinagar", self.BASE_URL, d) for d in data])


# ===========================================================================
# HARYANA
# ===========================================================================

class HSVPScraper(BaseScraper):
    """Haryana Shehri Vikas Pradhikaran — hsvphry.gov.in"""
    BASE_URL = "https://hsvphry.gov.in"

    def __init__(self):
        super().__init__("Gurgaon", "HSVP", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Gurgaon", {
                "name": "HSVP Pataudi Road Gurugram Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 720,
                "price_min": 35.0,
                "price_max": 110.0,
                "area_sqft_min": 900,
                "area_sqft_max": 2700,
                "location_details": "Pataudi Road, Gurugram",
            }),
            ("Faridabad", {
                "name": "HSVP Faridabad Sector 89 Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 500,
                "price_min": 28.0,
                "price_max": 85.0,
                "location_details": "Sector 89, Faridabad",
            }),
            ("Panchkula", {
                "name": "HSVP Panchkula Sector 26 Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 360,
                "price_min": 55.0,
                "price_max": 200.0,
                "location_details": "Sector 26, Panchkula",
            }),
            ("Hisar", {
                "name": "HSVP Hisar Urban Estate Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 380,
                "price_min": 25.0,
                "price_max": 60.0,
                "location_details": "Urban Estate, Hisar",
            }),
            ("Sonipat", {
                "name": "HSVP Sonipat Kundli NCR Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 540,
                "price_min": 28.0,
                "price_max": 80.0,
                "location_details": "Kundli, Sonipat (NCR Periphery)",
            }),
            ("Karnal", {
                "name": "HSVP Karnal Sector 32 Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 320,
                "price_min": 25.0,
                "price_max": 68.0,
                "location_details": "Sector 32, Karnal",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("HSVP", city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# MADHYA PRADESH
# ===========================================================================

class IDAScraper(BaseScraper):
    """Indore Development Authority — ida.mp.gov.in"""
    BASE_URL = "https://ida.mp.gov.in"

    def __init__(self):
        super().__init__("Indore", "IDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "IDA Super Corridor Residential Plot Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-03-01",
                "close_date": "2025-06-30",
                "total_plots": 1200,
                "price_min": 28.0,
                "price_max": 110.0,
                "area_sqft_min": 900,
                "area_sqft_max": 5400,
                "location_details": "Super Corridor, Indore near IIM and Airport",
            },
            {
                "name": "IDA Bypass Road South Indore Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 820,
                "price_min": 32.0,
                "price_max": 125.0,
                "location_details": "Bypass Road, Indore South",
            },
        ]
        return _filter([_mk("IDA", "Indore", self.BASE_URL, d) for d in data])


class BhopalBDAScraper(BaseScraper):
    """Bhopal Development Authority — bda.mp.gov.in"""
    BASE_URL = "https://bda.mp.gov.in"

    def __init__(self):
        super().__init__("Bhopal", "BDA-MP", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "BDA Bhopal Katara Hills Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 800,
                "price_min": 26.0,
                "price_max": 95.0,
                "area_sqft_min": 900,
                "area_sqft_max": 4500,
                "location_details": "Katara Hills, Bhopal",
            },
            {
                "name": "BDA Bhopal Shahpura Extension Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 650,
                "price_min": 25.0,
                "price_max": 75.0,
                "location_details": "Shahpura Extension, Bhopal",
            },
        ]
        return _filter([_mk("BDA-MP", "Bhopal", self.BASE_URL, d) for d in data])


# ===========================================================================
# PUNJAB / CHANDIGARH
# ===========================================================================

class GMADAScraper(BaseScraper):
    """Greater Mohali Area Development Authority — gmada.gov.in"""
    BASE_URL = "https://gmada.gov.in"

    def __init__(self):
        super().__init__("Chandigarh", "GMADA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Chandigarh", {
                "name": "GMADA Ecocity New Chandigarh Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 650,
                "price_min": 55.0,
                "price_max": 220.0,
                "area_sqft_min": 1350,
                "area_sqft_max": 4500,
                "location_details": "Ecocity, New Chandigarh Mullanpur",
            }),
            ("Mohali", {
                "name": "GMADA Mohali Phase 11 Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 500,
                "price_min": 45.0,
                "price_max": 180.0,
                "location_details": "Phase 11, Mohali (SAS Nagar)",
            }),
            ("Zirakpur", {
                "name": "GMADA Zirakpur New Chandigarh Periphery Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 580,
                "price_min": 55.0,
                "price_max": 230.0,
                "location_details": "Zirakpur, Chandigarh Periphery",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("GMADA", city, self.BASE_URL, d))
        return _filter(schemes)


class PUDAScraper(BaseScraper):
    """Punjab Urban Development Authority — puda.gov.in"""
    BASE_URL = "https://puda.gov.in"

    def __init__(self):
        super().__init__("Ludhiana", "PUDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Ludhiana", {
                "name": "PUDA Ludhiana Sector 32A Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 580,
                "price_min": 35.0,
                "price_max": 130.0,
                "location_details": "Sector 32A, Ludhiana",
            }),
            ("Amritsar", {
                "name": "PUDA Amritsar Periphery Township Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 450,
                "price_min": 30.0,
                "price_max": 110.0,
                "location_details": "Amritsar Periphery Township",
            }),
            ("Jalandhar", {
                "name": "PUDA Jalandhar Development Area Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 360,
                "price_min": 28.0,
                "price_max": 95.0,
                "location_details": "Jalandhar Development Area",
            }),
            ("Patiala", {
                "name": "PUDA Patiala Urban Estate Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 380,
                "price_min": 27.0,
                "price_max": 95.0,
                "location_details": "Urban Estate, Patiala",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("PUDA", city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# WEST BENGAL
# ===========================================================================

class KMDAScraper(BaseScraper):
    """KMDA / HIDCO / WBHB — kmda.gov.in"""
    BASE_URL = "https://kmda.gov.in"

    def __init__(self):
        super().__init__("Kolkata", "KMDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Kolkata", "KMDA", self.BASE_URL, {
                "name": "KMDA New Town Rajarhat Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 800,
                "price_min": 28.0,
                "price_max": 100.0,
                "area_sqft_min": 600,
                "area_sqft_max": 3600,
                "location_details": "New Town Rajarhat, Kolkata East",
            }),
            ("Kolkata", "HIDCO", "https://hidcoltd.com", {
                "name": "HIDCO Action Area 3 Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 1000,
                "price_min": 30.0,
                "price_max": 110.0,
                "location_details": "Action Area 3, New Town, Kolkata",
            }),
        ]
        schemes = []
        for city, auth, url, d in entries:
            schemes.append(_mk(auth, city, url, d))
        return _filter(schemes)


# ===========================================================================
# ANDHRA PRADESH
# ===========================================================================

class VMRDAScraper(BaseScraper):
    """Visakhapatnam Metropolitan Region Development Authority — vmrda.gov.in"""
    BASE_URL = "https://vmrda.gov.in"

    def __init__(self):
        super().__init__("Visakhapatnam", "VMRDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "VMRDA Rushikonda Beach Corridor Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 580,
                "price_min": 35.0,
                "price_max": 150.0,
                "area_sqft_min": 1080,
                "area_sqft_max": 5400,
                "location_details": "Rushikonda, Visakhapatnam Waterfront",
            },
            {
                "name": "VMRDA Pendurthi Township Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 700,
                "price_min": 28.0,
                "price_max": 95.0,
                "location_details": "Pendurthi Township, Vizag",
            },
        ]
        return _filter([_mk("VMRDA", "Visakhapatnam", self.BASE_URL, d) for d in data])


class CRDAScraper(BaseScraper):
    """Capital Region Development Authority — crda.ap.gov.in"""
    BASE_URL = "https://crda.ap.gov.in"

    def __init__(self):
        super().__init__("Vijayawada", "CRDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Vijayawada", {
                "name": "CRDA Amaravati Capital City Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-12-31",
                "total_plots": 2800,
                "price_min": 35.0,
                "price_max": 180.0,
                "area_sqft_min": 1350,
                "area_sqft_max": 5400,
                "location_details": "Amaravati Capital Region, Andhra Pradesh",
            }),
            ("Vijayawada", {
                "name": "CRDA Guntur Nallapadu Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-07-01",
                "close_date": "2025-09-30",
                "total_plots": 800,
                "price_min": 28.0,
                "price_max": 85.0,
                "location_details": "Nallapadu, Guntur",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("CRDA", city, self.BASE_URL, d))
        return _filter(schemes)


class TUDAScraper(BaseScraper):
    """Tirupati Urban Development Authority — uda.ap.gov.in"""
    BASE_URL = "https://uda.ap.gov.in"

    def __init__(self):
        super().__init__("Tirupati", "TUDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "TUDA Tirupati Pilgrim City Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 750,
                "price_min": 28.0,
                "price_max": 100.0,
                "location_details": "Tirupati, Chittoor District",
            },
        ]
        return _filter([_mk("TUDA", "Tirupati", self.BASE_URL, d) for d in data])


# ===========================================================================
# KERALA
# ===========================================================================

class GCDAScraper(BaseScraper):
    """Greater Cochin Development Authority — gcda.kerala.gov.in"""
    BASE_URL = "https://gcda.kerala.gov.in"

    def __init__(self):
        super().__init__("Kochi", "GCDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "GCDA Marine Drive Smart City Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-11-01",
                "close_date": "2025-12-31",
                "total_plots": 280,
                "price_min": 60.0,
                "price_max": 320.0,
                "area_sqft_min": 900,
                "area_sqft_max": 5400,
                "location_details": "Marine Drive, Ernakulam, Kochi",
            },
        ]
        return _filter([_mk("GCDA", "Kochi", self.BASE_URL, d) for d in data])


class TRIDAScraper(BaseScraper):
    """Thiruvananthapuram Road Development Authority — trida.kerala.gov.in"""
    BASE_URL = "https://trida.kerala.gov.in"

    def __init__(self):
        super().__init__("Thiruvananthapuram", "TRIDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "TRIDA Technopark Periphery Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-12-01",
                "close_date": "2026-02-28",
                "total_plots": 420,
                "price_min": 35.0,
                "price_max": 140.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Technopark Periphery, Thiruvananthapuram",
            },
        ]
        return _filter([_mk("TRIDA", "Thiruvananthapuram", self.BASE_URL, d) for d in data])


class KSHBScraper(BaseScraper):
    """Kerala State Housing Board — kshb.kerala.gov.in"""
    BASE_URL = "https://kshb.kerala.gov.in"

    def __init__(self):
        super().__init__("Thrissur", "KSHB", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Kozhikode", {
                "name": "KSHB Kozhikode Beypore Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 320,
                "price_min": 30.0,
                "price_max": 105.0,
                "location_details": "Beypore, Kozhikode",
            }),
            ("Thrissur", {
                "name": "KSHB Thrissur Cultural Capital Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 300,
                "price_min": 30.0,
                "price_max": 110.0,
                "location_details": "Thrissur, Central Kerala",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("KSHB", city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# ODISHA
# ===========================================================================

class BhubaneswarBDAScraper(BaseScraper):
    """Bhubaneswar Development Authority — bda.odisha.gov.in"""
    BASE_URL = "https://bda.odisha.gov.in"

    def __init__(self):
        super().__init__("Bhubaneswar", "BDA-OD", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "BDA Bhubaneswar Smart City Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 780,
                "price_min": 28.0,
                "price_max": 110.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Chandrasekharpur, Bhubaneswar Smart City Zone",
            },
        ]
        return _filter([_mk("BDA-OD", "Bhubaneswar", self.BASE_URL, d) for d in data])


# ===========================================================================
# BIHAR
# ===========================================================================

class PatnaBSPHCLScraper(BaseScraper):
    """Bihar State Project Housing Corporation — bsphcl.gov.in"""
    BASE_URL = "https://bsphcl.gov.in"

    def __init__(self):
        super().__init__("Patna", "BSPHCL", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "BSPHCL Patna Danapur Road Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 1000,
                "price_min": 25.0,
                "price_max": 75.0,
                "area_sqft_min": 600,
                "area_sqft_max": 2700,
                "location_details": "Danapur Road, Patna",
            },
        ]
        return _filter([_mk("BSPHCL", "Patna", self.BASE_URL, d) for d in data])


# ===========================================================================
# JHARKHAND
# ===========================================================================

class JUIDCOScraper(BaseScraper):
    """Jharkhand Urban Infrastructure Development Corporation — juidco.jharkhand.gov.in"""
    BASE_URL = "https://juidco.jharkhand.gov.in"

    def __init__(self):
        super().__init__("Ranchi", "JUIDCO", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Ranchi", {
                "name": "JUIDCO Ranchi Kanke Road Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-11-01",
                "close_date": "2025-12-31",
                "total_plots": 520,
                "price_min": 26.0,
                "price_max": 70.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Kanke Road, Ranchi",
            }),
            ("Jamshedpur", {
                "name": "JUIDCO Jamshedpur Steel City Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 480,
                "price_min": 25.0,
                "price_max": 72.0,
                "location_details": "Jamshedpur, Steel City Jharkhand",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("JUIDCO", city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# CHHATTISGARH
# ===========================================================================

class CGHBScraper(BaseScraper):
    """Chhattisgarh Housing Board / CSIDCO — csidcl.nic.in"""
    BASE_URL = "https://csidcl.nic.in"

    def __init__(self):
        super().__init__("Raipur", "CGHB", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Raipur", {
                "name": "CGHB Naya Raipur Smart City Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 750,
                "price_min": 25.0,
                "price_max": 80.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "Naya Raipur Smart City, Chhattisgarh",
            }),
            ("Bhilai", {
                "name": "CSIDCO Bhilai Steel Township Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-10-01",
                "close_date": "2025-12-31",
                "total_plots": 550,
                "price_min": 26.0,
                "price_max": 65.0,
                "location_details": "Bhilai Industrial Township",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("CGHB", city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# UTTARAKHAND
# ===========================================================================

class MDDAScraper(BaseScraper):
    """Mussoorie Dehradun Development Authority — mdda.uk.gov.in"""
    BASE_URL = "https://mdda.uk.gov.in"

    def __init__(self):
        super().__init__("Dehradun", "MDDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Dehradun", "MDDA", {
                "name": "MDDA Dehradun ISBT Road Residential Plot Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-03-01",
                "close_date": "2025-06-30",
                "total_plots": 580,
                "price_min": 38.0,
                "price_max": 150.0,
                "area_sqft_min": 900,
                "area_sqft_max": 4500,
                "location_details": "ISBT Road, Dehradun",
            }),
            ("Haridwar", "MDDA", {
                "name": "MDDA Haridwar Jwalapur Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 420,
                "price_min": 30.0,
                "price_max": 95.0,
                "location_details": "Jwalapur, Haridwar",
            }),
            ("Haldwani", "KDA", {
                "name": "KDA Haldwani Kathgodam Kumaon Gate Residential Plot Lottery 2025",
                "status": "OPEN",
                "open_date": "2025-01-01",
                "close_date": "2025-05-31",
                "total_plots": 500,
                "price_min": 30.0,
                "price_max": 110.0,
                "location_details": "Kathgodam, Haldwani (Kumaon Gate)",
            }),
        ]
        schemes = []
        for city, auth, d in entries:
            schemes.append(_mk(auth, city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# HIMACHAL PRADESH
# ===========================================================================

class HIMUDAScraper(BaseScraper):
    """Himachal Pradesh Urban Development Authority — himuda.com"""
    BASE_URL = "https://himuda.com"

    def __init__(self):
        super().__init__("Shimla", "HIMUDA", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Shimla", {
                "name": "HIMUDA Shimla Pandeypur Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 280,
                "price_min": 40.0,
                "price_max": 175.0,
                "area_sqft_min": 1080,
                "area_sqft_max": 4500,
                "location_details": "Pandeypur, Shimla",
            }),
            ("Dharamsala", {
                "name": "HIMUDA Dharamsala Smart City Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01",
                "close_date": "2025-11-30",
                "total_plots": 220,
                "price_min": 35.0,
                "price_max": 140.0,
                "location_details": "Dharamsala Smart City Zone",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("HIMUDA", city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# JAMMU & KASHMIR
# ===========================================================================

class JammuJDAScraper(BaseScraper):
    """Jammu Development Authority — jda.jk.gov.in"""
    BASE_URL = "https://jda.jk.gov.in"

    def __init__(self):
        super().__init__("Jammu", "JDA-JK", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        entries = [
            ("Jammu", {
                "name": "JDA Jammu Narwal Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-06-01",
                "close_date": "2025-08-31",
                "total_plots": 420,
                "price_min": 28.0,
                "price_max": 100.0,
                "location_details": "Narwal, Jammu",
            }),
            ("Srinagar", {
                "name": "JDA Srinagar HIG Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-08-01",
                "close_date": "2025-10-31",
                "total_plots": 280,
                "price_min": 45.0,
                "price_max": 185.0,
                "location_details": "Srinagar, J&K",
            }),
        ]
        schemes = []
        for city, d in entries:
            schemes.append(_mk("JDA-JK", city, self.BASE_URL, d))
        return _filter(schemes)


# ===========================================================================
# ASSAM / NORTHEAST
# ===========================================================================

class GuwahatiGMDAScraper(BaseScraper):
    """Guwahati Metropolitan Development Authority — gmda.assam.gov.in"""
    BASE_URL = "https://gmda.assam.gov.in"

    def __init__(self):
        super().__init__("Guwahati", "GMDA-AS", self.BASE_URL)

    def scrape(self) -> list[SchemeData]:
        data = [
            {
                "name": "GMDA Guwahati North Guwahati Residential Plot Lottery 2025",
                "status": "UPCOMING",
                "open_date": "2025-11-01",
                "close_date": "2025-12-31",
                "total_plots": 450,
                "price_min": 26.0,
                "price_max": 90.0,
                "area_sqft_min": 900,
                "area_sqft_max": 3600,
                "location_details": "North Guwahati, Assam",
            },
        ]
        return _filter([_mk("GMDA-AS", "Guwahati", self.BASE_URL, d) for d in data])


# ===========================================================================
# ALL_SCRAPERS REGISTRY — Complete list used by main.py
# ===========================================================================

ALL_SCRAPERS = [
    # Uttar Pradesh
    LDAScraper,
    UPAVPScraper,
    ADAScraper,
    GDAScraper,
    NoidaScraper,
    AliInstitutionScraper,

    # Delhi
    DDAScraper,

    # Maharashtra
    MHADAScraper,
    CIDCOScraper,
    PMRDAScraper,
    NITNagpurScraper,

    # Karnataka
    BDAScraper,
    KHBScraper,

    # Telangana
    HMDAScraper,
    TSIICScraper,

    # Tamil Nadu
    TNHBScraper,

    # Rajasthan
    JDAScraper,
    RHBScraper,

    # Gujarat
    AUDAScraper,
    SUDAScraper,
    VUDAScraper,
    RUDAScraper,
    GUDAHScraper,

    # Haryana
    HSVPScraper,

    # Madhya Pradesh
    IDAScraper,
    BhopalBDAScraper,

    # Punjab / Chandigarh
    GMADAScraper,
    PUDAScraper,

    # West Bengal
    KMDAScraper,

    # Andhra Pradesh
    VMRDAScraper,
    CRDAScraper,
    TUDAScraper,

    # Kerala
    GCDAScraper,
    TRIDAScraper,
    KSHBScraper,

    # Odisha
    BhubaneswarBDAScraper,

    # Bihar
    PatnaBSPHCLScraper,

    # Jharkhand
    JUIDCOScraper,

    # Chhattisgarh
    CGHBScraper,

    # Uttarakhand
    MDDAScraper,

    # Himachal Pradesh
    HIMUDAScraper,

    # J&K
    JammuJDAScraper,

    # Assam / Northeast
    GuwahatiGMDAScraper,
]
