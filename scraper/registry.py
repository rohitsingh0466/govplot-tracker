"""
GovPlot Tracker — Scraper Registry v4.0
=========================================
Single source controlling ALL 20 city scrapers.
main.py imports ALL_SCRAPERS from here exclusively.

City order = priority order (YEIDA #1 = highest demand).
Each city has its own dedicated scraper file.

To add a new city:
  1. Create scraper/cities/<cityname>.py
  2. Add entry to city_config.py
  3. Add static schemes to static_schemes.py
  4. Import and add to ALL_SCRAPERS below
"""

# ── 20 City Scrapers — In priority order ──────────────────────────────────────

from scraper.cities.yeida       import YEIDAScraper       # 1. Greater Noida (EXTREME)
from scraper.cities.lucknow     import LDAScraper          # 2. Lucknow (VERY_HIGH)
from scraper.cities.jaipur      import JDAScraper          # 3. Jaipur (EXTREME)
from scraper.cities.agra        import ADAScraper          # 4. Agra (VERY_HIGH)
from scraper.cities.prayagraj   import PDAScraper          # 5. Prayagraj (HIGH)
from scraper.cities.chandigarh  import GMADAScraper        # 6. Chandigarh (VERY_HIGH)
from scraper.cities.navi_mumbai import CIDCOScraper        # 7. Navi Mumbai (VERY_HIGH)
from scraper.cities.hyderabad   import HMDAScraper         # 8. Hyderabad (HIGH)
from scraper.cities.pune        import PMRDAScraper        # 9. Pune (HIGH)
from scraper.cities.bengaluru   import BDAScraper          # 10. Bengaluru (VERY_HIGH)
from scraper.cities.raipur      import NRDAScraper         # 11. Raipur (HIGH)
from scraper.cities.varanasi    import VDAScraper          # 12. Varanasi (RISING)
from scraper.cities.bhubaneswar import BDAODScraper        # 13. Bhubaneswar (RISING)
from scraper.cities.nagpur      import NITScraper          # 14. Nagpur (HIGH)
from scraper.cities.ahmedabad   import AUDAScraper         # 15. Ahmedabad (RISING)
from scraper.cities.delhi       import DDAScraper          # 16. Delhi (EXTREME)
from scraper.cities.bhopal      import VPBPLScraper        # 17. Bhopal (HIGH)
from scraper.cities.udaipur     import UITScraper          # 18. Udaipur (VERY_HIGH)
from scraper.cities.dehradun    import MDDAScraper         # 19. Dehradun (RISING)
from scraper.cities.meerut      import MDAScraper          # 20. Meerut (HIGH)


# ── Master registry — ORDER MATTERS (higher priority = scraped first) ─────────
ALL_SCRAPERS = [
    YEIDAScraper,       # 1.  Greater Noida / Yamuna Expressway
    LDAScraper,         # 2.  Lucknow
    JDAScraper,         # 3.  Jaipur
    ADAScraper,         # 4.  Agra
    PDAScraper,         # 5.  Prayagraj
    GMADAScraper,       # 6.  Chandigarh
    CIDCOScraper,       # 7.  Navi Mumbai
    HMDAScraper,        # 8.  Hyderabad
    PMRDAScraper,       # 9.  Pune
    BDAScraper,         # 10. Bengaluru
    NRDAScraper,        # 11. Raipur
    VDAScraper,         # 12. Varanasi
    BDAODScraper,       # 13. Bhubaneswar
    NITScraper,         # 14. Nagpur
    AUDAScraper,        # 15. Ahmedabad
    DDAScraper,         # 16. Delhi
    VPBPLScraper,       # 17. Bhopal
    UITScraper,         # 18. Udaipur
    MDDAScraper,        # 19. Dehradun
    MDAScraper,         # 20. Meerut
]

# Quick lookup by city name
SCRAPER_BY_CITY = {sc().city: sc for sc in ALL_SCRAPERS}
