"""
GovPlot Tracker — Scraper Registry v3.2
=========================================
Single source of truth for all scraper classes.
main.py imports ALL_SCRAPERS from here — never from all_cities.py (deleted).

To add a new state:
  1. Create scraper/cities/<state>.py following _template.py
  2. Import your scraper class(es) here
  3. Add them to ALL_SCRAPERS list below

DELIVERED IN OPTION B (working live scrapers):
  ✅ up.py          — LDA, UPAVP, ADA, GDA, GNIDA, YEIDA, ADA-ALG, JDA-JHS
  ✅ delhi.py       — DDA
  ✅ maharashtra.py — MHADA, CIDCO, PMRDA, NIT
  ✅ karnataka.py   — BDA, KHB

TEMPLATE AVAILABLE (copy _template.py to add):
  ⬜ telangana.py   — HMDA, TSIIC
  ⬜ tamilnadu.py   — CMDA, TNHB, SIPCOT
  ⬜ rajasthan.py   — JDA, RHB
  ⬜ gujarat.py     — AUDA, SUDA, VUDA, RUDA, GUDAH
  ⬜ haryana.py     — HSVP
  ⬜ mp.py          — IDA, BDA-MP
  ⬜ punjab.py      — GMADA, PUDA
  ⬜ westbengal.py  — KMDA, HIDCO
  ⬜ andhrapradesh.py — VMRDA, CRDA, TUDA
  ⬜ kerala.py      — GCDA, TRIDA, KSHB
  ⬜ odisha.py      — BDA-OD
  ⬜ bihar.py       — BSPHCL
  ⬜ jharkhand.py   — JUIDCO
  ⬜ chhattisgarh.py — CGHB, CSIDCO
  ⬜ uttarakhand.py — MDDA, KDA
  ⬜ himachal.py    — HIMUDA
  ⬜ jk.py          — JDA-JK
  ⬜ northeast.py   — GMDA-AS
"""

# ── Delivered (Option B) ──────────────────────────────────────────────────

from scraper.cities.up import (
    LDAScraper,
    UPAVPScraper,
    ADAScraper,
    GDAScraper,
    NoidaScraper,
    AliJhansiScraper,
)

from scraper.cities.delhi import (
    DDAScraper,
)

from scraper.cities.maharashtra import (
    MHADAScraper,
    CIDCOScraper,
    PMRDAScraper,
    NITScraper,
)

from scraper.cities.karnataka import (
    BDAScraper,
    KHBScraper,
)

# ── Pending (uncomment as each state file is created) ─────────────────────

# from scraper.cities.telangana import HMDAScraper, TSIICScraper
# from scraper.cities.tamilnadu import CMDAScraper, TNHBScraper, SIPCOTScraper
# from scraper.cities.rajasthan import JDAScraper, RHBScraper
# from scraper.cities.gujarat import AUDAScraper, SUDAScraper, VUDAScraper, RUDAScraper, GUDAHScraper
# from scraper.cities.haryana import HSVPScraper
# from scraper.cities.mp import IDAScraper, BhopalBDAScraper
# from scraper.cities.punjab import GMADAScraper, PUDAScraper
# from scraper.cities.westbengal import KMDAScraper, HIDCOScraper
# from scraper.cities.andhrapradesh import VMRDAScraper, CRDAScraper, TUDAScraper
# from scraper.cities.kerala import GCDAScraper, TRIDAScraper, KSHBScraper
# from scraper.cities.odisha import BDAODScraper
# from scraper.cities.bihar import BSPHCLScraper
# from scraper.cities.jharkhand import JUIDCOScraper
# from scraper.cities.chhattisgarh import CGHBScraper
# from scraper.cities.uttarakhand import MDDAScraper
# from scraper.cities.himachal import HIMUDAScraper
# from scraper.cities.jk import JDAJKScraper
# from scraper.cities.northeast import GMDAAssam

# ── Master registry ────────────────────────────────────────────────────────

ALL_SCRAPERS = [
    # Uttar Pradesh
    LDAScraper,
    UPAVPScraper,
    ADAScraper,
    GDAScraper,
    NoidaScraper,
    AliJhansiScraper,

    # Delhi
    DDAScraper,

    # Maharashtra
    MHADAScraper,
    CIDCOScraper,
    PMRDAScraper,
    NITScraper,

    # Karnataka
    BDAScraper,
    KHBScraper,

    # --- Add more states here as their files are created ---
]
