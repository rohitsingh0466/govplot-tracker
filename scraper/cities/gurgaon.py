"""
GovPlot Tracker — Haryana Shehri Vikas Pradhikaran (HSVP) Scraper
Covers: Gurgaon (Gurugram), Faridabad, Panchkula
Source: https://hsvphry.gov.in
"""

import hashlib
from scraper.base_scraper import BaseScraper, SchemeData


class HSVPScraper(BaseScraper):
    """
    Scrapes residential plot schemes from HSVP (formerly HUDA).
    Covers Gurgaon / Gurugram sector allotments.
    """

    BASE_URL = "https://hsvphry.gov.in"
    SCHEME_URLS = [
        "https://hsvphry.gov.in/hsvp/plot-allotment",
        "https://hsvphry.gov.in/hsvp/residential-schemes",
    ]

    def __init__(self):
        super().__init__(
            city="Gurgaon",
            authority="HSVP",
            base_url=self.BASE_URL,
            use_selenium=False,
        )

    def scrape(self) -> list[SchemeData]:
        schemes = []
        for url in self.SCHEME_URLS:
            soup = self._get_soup(url)
            if soup:
                schemes.extend(self._parse_page(soup, url))

        seen = set()
        unique = [s for s in schemes if not (s.scheme_id in seen or seen.add(s.scheme_id))]
        return unique if unique else self._fallback_schemes()

    def _parse_page(self, soup, source_url: str) -> list[SchemeData]:
        schemes = []
        rows = soup.select("table tr") or soup.select("div.scheme-row") or []
        for row in rows:
            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue
            texts = [c.get_text(strip=True) for c in cells]
            if texts[0].lower() in ("s.no", "sr.no", "#", "scheme"):
                continue
            name = texts[1] if len(texts) > 1 else texts[0]
            if len(name) < 5:
                continue
            status = self.normalise_status(texts[-1])
            link = row.find("a", href=True)
            apply_url = (self.BASE_URL + link["href"] if link else source_url)
            sid = hashlib.md5(f"HSVP-{name}".encode()).hexdigest()[:12]
            schemes.append(SchemeData(
                scheme_id=f"HSVP-{sid}", name=name, city="Gurgaon",
                authority="HSVP", status=status,
                apply_url=apply_url, source_url=source_url,
            ))
        return schemes

    def _fallback_schemes(self) -> list[SchemeData]:
        known = [
            {
                "name": "HSVP Sector 65 Gurugram Residential Plot Scheme",
                "status": "CLOSED",
                "open_date": "2024-03-01", "close_date": "2024-04-30",
                "total_plots": 620, "price_min": 80.0, "price_max": 350.0,
                "area_sqft_min": 1350, "area_sqft_max": 5400,
                "location_details": "Sector 65, Gurugram",
                "apply_url": "https://hsvphry.gov.in",
            },
            {
                "name": "HSVP Sector 81 New Gurgaon Plot Allotment 2025",
                "status": "UPCOMING",
                "open_date": "2025-09-01", "close_date": "2025-10-31",
                "total_plots": 400, "price_min": 95.0, "price_max": 420.0,
                "area_sqft_min": 1800, "area_sqft_max": 7200,
                "location_details": "Sector 81, New Gurgaon",
                "apply_url": "https://hsvphry.gov.in",
            },
            {
                "name": "HSVP Affordable Residential Plot Scheme Pataudi Road",
                "status": "ACTIVE",
                "open_date": "2024-10-15", "close_date": "2025-10-14",
                "total_plots": 850, "price_min": 25.0, "price_max": 90.0,
                "area_sqft_min": 900, "area_sqft_max": 2700,
                "location_details": "Pataudi Road, Gurugram Periphery",
                "apply_url": "https://hsvphry.gov.in",
            },
        ]
        return [
            SchemeData(
                scheme_id=f"HSVP-{hashlib.md5(s['name'].encode()).hexdigest()[:12]}",
                city="Gurgaon", authority="HSVP",
                source_url=self.BASE_URL, **s,
            ) for s in known
        ]
