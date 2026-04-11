"""
GovPlot Tracker — City Configuration v4.0
==========================================
SINGLE SOURCE OF TRUTH for all 20 cities.

All frontend components, backend routes, alert modals, filter bars,
and scraper registry pull from this file.

RULES:
  - Exactly 20 cities, in priority order (YEIDA #1 = highest demand)
  - Only Govt residential plot lottery schemes
  - No e-auction, no LIG/MIG/EWS flat schemes, no private builders
  - Min price ≥ ₹25L

SCRAPER TIERS (per city):
  Tier 1 → Static HTML/PHP → requests + BeautifulSoup
  Tier 2 → JS-rendered → Playwright
  Tier 3 → CAPTCHA/auth-gated → scrape public notice page only
  Tier 4 → Aggregator fallback → eauctionsindia.com, 99acres.com/articles
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional

# ─────────────────────────────────────────────────────────────────────────────
# Data Classes
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class AuthorityInfo:
    code: str                        # e.g. "YEIDA"
    full_name: str                   # e.g. "Yamuna Expressway Industrial Development Authority"
    primary_url: str                 # Official site
    notice_board_url: str            # Where scheme announcements appear
    scheme_list_urls: list[str]      # All URLs to try for scheme listings
    aggregator_urls: list[str]       # Fallback aggregator pages
    scraper_tier: int                # 1=easy, 2=js, 3=hard, 4=aggregator-only
    uses_playwright: bool = False
    uses_selenium: bool = False
    note: str = ""                   # Dev note about the portal


@dataclass
class CityConfig:
    rank: int                        # 1 = highest demand
    city: str                        # Display name
    state: str
    authority: str                   # Primary authority code
    authority_info: AuthorityInfo
    demand_level: str                # "EXTREME" | "VERY_HIGH" | "HIGH" | "RISING"
    demand_tags: list[str]           # e.g. ["Jewar Airport", "F1 Track"]
    emoji: str
    color: str                       # Hex for frontend
    bg_color: str                    # Light bg hex
    # Secondary authority (optional)
    secondary_authority: Optional[AuthorityInfo] = None


# ─────────────────────────────────────────────────────────────────────────────
# 20 CITY CONFIGURATIONS — In priority order
# ─────────────────────────────────────────────────────────────────────────────

CITY_CONFIGS: list[CityConfig] = [

    # ── 1. GREATER NOIDA / YAMUNA EXPRESSWAY ─────────────────────────────────
    CityConfig(
        rank=1,
        city="Greater Noida",
        state="Uttar Pradesh",
        authority="YEIDA",
        demand_level="EXTREME",
        demand_tags=["Jewar Airport", "F1 Track", "Film City", "Yamuna Expressway"],
        emoji="🏆",
        color="#006d6d",
        bg_color="#e0f2f2",
        authority_info=AuthorityInfo(
            code="YEIDA",
            full_name="Yamuna Expressway Industrial Development Authority",
            primary_url="https://yamunaexpresswayauthority.com",
            notice_board_url="https://yamunaexpresswayauthority.com/scheme",
            scheme_list_urls=[
                "https://yamunaexpresswayauthority.com/scheme",
                "https://yamunaexpresswayauthority.com/residential-plot",
                "https://yamunaexpresswayauthority.com",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/yeida-plot-scheme",
                "https://www.99acres.com/articles/yamuna-expressway-authority-yeida-plot-scheme-2020-online-application-eligibility-last-date-and-draw-date.html",
                "https://awaszone.com/yeida-plot-scheme/",
            ],
            scraper_tier=2,
            uses_playwright=True,
            note="JS-rendered Angular portal. Public scheme page is accessible. "
                 "Aggregators like 99acres publish within hours of launch.",
        ),
    ),

    # ── 2. LUCKNOW ───────────────────────────────────────────────────────────
    CityConfig(
        rank=2,
        city="Lucknow",
        state="Uttar Pradesh",
        authority="LDA",
        demand_level="VERY_HIGH",
        demand_tags=["Metro expansion", "Airport upgrade", "State capital", "15-20% YoY appreciation"],
        emoji="🕌",
        color="#0f766e",
        bg_color="#f0fdf4",
        authority_info=AuthorityInfo(
            code="LDA",
            full_name="Lucknow Development Authority",
            primary_url="https://www.ldalucknow.in",
            notice_board_url="https://www.ldalucknow.in",
            scheme_list_urls=[
                "https://www.ldalucknow.in/scheme",
                "https://www.ldalucknow.in/news-events",
                "https://www.ldalucknow.in",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/anant-nagar-yojana-phase2-lda-lucknow",
                "https://awaszone.com/lda-lucknow/",
            ],
            scraper_tier=1,
            note="Static PHP site. Notice board has scheme PDFs. New domain ldalucknow.in "
                 "is accessible directly — no proxy needed.",
        ),
    ),

    # ── 3. JAIPUR ────────────────────────────────────────────────────────────
    CityConfig(
        rank=3,
        city="Jaipur",
        state="Rajasthan",
        authority="JDA",
        demand_level="EXTREME",
        demand_tags=["Pink City tourism", "Delhi-Mumbai Expressway", "RIICO push"],
        emoji="🏰",
        color="#c2600a",
        bg_color="#fff7ed",
        authority_info=AuthorityInfo(
            code="JDA",
            full_name="Jaipur Development Authority",
            primary_url="https://jda.rajasthan.gov.in",
            notice_board_url="https://jda.rajasthan.gov.in/content/raj/udh/jda---jaipur/en/notice-board/schemes.html",
            scheme_list_urls=[
                "https://jda.rajasthan.gov.in/content/raj/udh/jda---jaipur/en/notice-board/schemes.html",
                "https://jda.rajasthan.gov.in/content/raj/udh/jda---jaipur/en/notice-board/lottery-result.html",
                "https://jda.rajasthan.gov.in",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/jda-residential-plot-scheme",
                "https://sarkariyojana.com/jda-residential-plot-scheme-lottery-draw/",
                "https://awaszone.com/jda-jaipur/",
            ],
            scraper_tier=2,
            uses_playwright=True,
            note="Rajasthan gov portal uses JS for some sections. Notice board page "
                 "is static HTML — Playwright only needed for scheme details.",
        ),
    ),

    # ── 4. AGRA ──────────────────────────────────────────────────────────────
    CityConfig(
        rank=4,
        city="Agra",
        state="Uttar Pradesh",
        authority="ADA",
        demand_level="VERY_HIGH",
        demand_tags=["Heritage tourism", "Agra Metro", "Gwalior Highway"],
        emoji="🕍",
        color="#b45309",
        bg_color="#fffbeb",
        authority_info=AuthorityInfo(
            code="ADA",
            full_name="Agra Development Authority",
            primary_url="https://www.adaagra.org.in",
            notice_board_url="https://www.adaagra.org.in",
            scheme_list_urls=[
                "https://www.adaagra.org.in",
                "https://www.adaagra.org.in/scheme",
                "https://www.adaagra.org.in/news",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/ada-agra-atal-puram-lottery",
                "https://www.eauctionsindia.com/blog-details/agra-development-authority-plot-scheme",
                "https://awaszone.com/ada-agra-atalpuram-township/",
            ],
            scraper_tier=1,
            note="Static PHP site. ADA posts scheme notices as PDFs on homepage. "
                 "adaagra.org.in is accessible from GitHub runners.",
        ),
    ),

    # ── 5. PRAYAGRAJ ─────────────────────────────────────────────────────────
    CityConfig(
        rank=5,
        city="Prayagraj",
        state="Uttar Pradesh",
        authority="PDA",
        demand_level="HIGH",
        demand_tags=["Maha Kumbh 2025", "Infrastructure boom", "63,000 PMAY apps"],
        emoji="🏛️",
        color="#4338ca",
        bg_color="#eef2ff",
        authority_info=AuthorityInfo(
            code="PDA",
            full_name="Prayagraj Development Authority",
            primary_url="http://www.pdaprayagraj.org",
            notice_board_url="http://www.pdaprayagraj.org",
            scheme_list_urls=[
                "http://www.pdaprayagraj.org",
                "http://www.pdaprayagraj.org/scheme",
                "https://janhit.upda.in",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/pda-invites-bids-via-e-auction-for-plots-across-prayagraj-apply-online-now",
                "https://awaszone.com/pda-prayagraj/",
            ],
            scraper_tier=1,
            note="Old PHP site. HTTP only. SSL may be expired — use verify=False. "
                 "Has scheme PDFs on notice board.",
        ),
    ),

    # ── 6. CHANDIGARH / MOHALI ───────────────────────────────────────────────
    CityConfig(
        rank=6,
        city="Chandigarh",
        state="Punjab",
        authority="GMADA",
        demand_level="VERY_HIGH",
        demand_tags=["Airport expansion", "IT City proximity", "3x below market"],
        emoji="🌿",
        color="#0369a1",
        bg_color="#eff6ff",
        authority_info=AuthorityInfo(
            code="GMADA",
            full_name="Greater Mohali Area Development Authority",
            primary_url="https://gmada.gov.in",
            notice_board_url="https://gmada.gov.in/en/notice-board/schemes",
            scheme_list_urls=[
                "https://gmada.gov.in/en/notice-board/schemes",
                "https://gmada.gov.in/en",
                "https://gmada.gov.in",
            ],
            aggregator_urls=[
                "https://garahpravesh.com/gmada-eco-city-2-extension-new-chandigarh-2025/",
                "https://garahpravesh.com/gmada-eco-city-2-plot-scheme-mohali-2025/",
                "https://www.eauctionsindia.com/blog-details/gmada",
            ],
            scraper_tier=2,
            uses_playwright=True,
            note="Punjab gov portal — .gov.in domain may be blocked from GitHub Actions. "
                 "Use ScraperAPI proxy. Notice board section is static HTML.",
        ),
    ),

    # ── 7. NAVI MUMBAI ───────────────────────────────────────────────────────
    CityConfig(
        rank=7,
        city="Navi Mumbai",
        state="Maharashtra",
        authority="CIDCO",
        demand_level="VERY_HIGH",
        demand_tags=["Navi Mumbai Airport", "Metro Line 1", "Trans-Harbour Link"],
        emoji="🌊",
        color="#be123c",
        bg_color="#fff1f2",
        authority_info=AuthorityInfo(
            code="CIDCO",
            full_name="City and Industrial Development Corporation of Maharashtra",
            primary_url="https://www.cidco.maharashtra.gov.in",
            notice_board_url="https://www.cidco.maharashtra.gov.in",
            scheme_list_urls=[
                "https://www.cidco.maharashtra.gov.in",
                "https://cidcohomes.com",
                "https://cidcohomes.com/schemes",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/cidco-lottery",
                "https://www.99acres.com/articles/cidco-lottery-2019-online-application-eligibility-results-draw-date-winner-list.html",
                "https://nayeghar.com/cidco-lottery-2025-complete-guide-to-22000-affordable-homes-in-navi-mumbai-eligibility-documents-registration-pricing/",
            ],
            scraper_tier=3,
            uses_playwright=True,
            note="CIDCO lottery portal (lottery.cidcoindia.com) is Cloudflare-protected. "
                 "Scrape public notice page of cidco.maharashtra.gov.in instead — "
                 "no CAPTCHA on public side. Aggregators are most reliable.",
        ),
    ),

    # ── 8. HYDERABAD ─────────────────────────────────────────────────────────
    CityConfig(
        rank=8,
        city="Hyderabad",
        state="Telangana",
        authority="HMDA",
        demand_level="HIGH",
        demand_tags=["Regional Ring Road", "IT/ITES boom", "Data center hub"],
        emoji="🔬",
        color="#0e7490",
        bg_color="#ecfeff",
        authority_info=AuthorityInfo(
            code="HMDA",
            full_name="Hyderabad Metropolitan Development Authority",
            primary_url="https://www.hmda.gov.in",
            notice_board_url="https://www.hmda.gov.in",
            scheme_list_urls=[
                "https://www.hmda.gov.in/hmda-dev-layout-plots/",
                "https://www.hmda.gov.in/plots/",
                "https://www.hmda.gov.in",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/hmda",
                "https://www.99acres.com/articles/hyderabad-hmda-plot-scheme.html",
            ],
            scraper_tier=2,
            uses_playwright=True,
            note="HMDA portal loads data via Angular. Plot pages are static tables. "
                 "Main dev layout plots page is accessible. Use Playwright for JS parts.",
        ),
    ),

    # ── 9. PUNE ──────────────────────────────────────────────────────────────
    CityConfig(
        rank=9,
        city="Pune",
        state="Maharashtra",
        authority="PMRDA",
        demand_level="HIGH",
        demand_tags=["IT corridor", "Pune Metro Phase 2", "Peripheral nodes"],
        emoji="🎓",
        color="#7c3aed",
        bg_color="#f5f3ff",
        authority_info=AuthorityInfo(
            code="PMRDA",
            full_name="Pune Metropolitan Region Development Authority",
            primary_url="https://www.pmrda.gov.in",
            notice_board_url="https://www.pmrda.gov.in/en/lottery-for-remaining-flats-in-sector-no-12-and-sector-c-30-32-housing-scheme/",
            scheme_list_urls=[
                "https://www.pmrda.gov.in",
                "https://housing.pmrda.gov.in",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/pmrda-lottery",
                "https://www.99acres.com/articles/mhada-pune-lottery.html",
                "https://www.bajajfinserv.in/pmrda-lottery",
            ],
            scraper_tier=2,
            uses_playwright=True,
            note="PMRDA housing portal is separate from main site. "
                 "housing.pmrda.gov.in has scheme listings. Use Playwright for lottery portal.",
        ),
        secondary_authority=AuthorityInfo(
            code="MHADA-PUNE",
            full_name="MHADA Pune Board",
            primary_url="https://mhada.gov.in",
            notice_board_url="https://lottery.mhada.gov.in",
            scheme_list_urls=["https://lottery.mhada.gov.in", "https://mhada.gov.in"],
            aggregator_urls=["https://www.99acres.com/articles/mhada-pune-lottery.html"],
            scraper_tier=2,
            uses_playwright=True,
        ),
    ),

    # ── 10. BENGALURU ────────────────────────────────────────────────────────
    CityConfig(
        rank=10,
        city="Bengaluru",
        state="Karnataka",
        authority="BDA",
        demand_level="VERY_HIGH",
        demand_tags=["Silicon Valley of India", "Namma Metro Phase 3", "PRR"],
        emoji="💻",
        color="#1d4ed8",
        bg_color="#eff6ff",
        authority_info=AuthorityInfo(
            code="BDA",
            full_name="Bangalore Development Authority",
            primary_url="https://bdakarnataka.in",
            notice_board_url="https://bdakarnataka.in/site-allotment/",
            scheme_list_urls=[
                "https://bdakarnataka.in/site-allotment/",
                "https://bdakarnataka.in/schemes/",
                "https://bdakarnataka.in",
                "https://eng.bdabangalore.org",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/bda-bangalore",
                "https://booknewproperty.com/news/bda-commences-e-auction-for-residential-and-commercial-sites-in-bengaluru/",
                "https://housystan.com/article/unlocking-opportunities-how-to-apply-for-a-bda-site-in-bangalore",
            ],
            scraper_tier=2,
            uses_playwright=True,
            note="BDA moved to new domain bdakarnataka.in. Old bdabangalore.org still works. "
                 "Site uses WordPress — scheme pages are static. "
                 "Playwright needed only for search/filter UI.",
        ),
    ),

    # ── 11. RAIPUR ───────────────────────────────────────────────────────────
    CityConfig(
        rank=11,
        city="Raipur",
        state="Chhattisgarh",
        authority="NRDA",
        demand_level="HIGH",
        demand_tags=["Planned Smart City", "Capital shift", "Rail connectivity"],
        emoji="🏙️",
        color="#15803d",
        bg_color="#f0fdf4",
        authority_info=AuthorityInfo(
            code="NRDA",
            full_name="Nava Raipur Atal Nagar Development Authority",
            primary_url="https://www.nava-raipur.com",
            notice_board_url="https://www.nava-raipur.com",
            scheme_list_urls=[
                "https://www.nava-raipur.com",
                "https://www.nava-raipur.com/residential-plot",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/nrda-raipur",
                "https://www.tendersontime.com/authority/naya-raipur-development-authority-3718/",
            ],
            scraper_tier=1,
            note="NRDA site is plain HTML. Monthly allotment cycles. "
                 "Tender notices published on tendersontime.com reliably.",
        ),
    ),

    # ── 12. VARANASI ─────────────────────────────────────────────────────────
    CityConfig(
        rank=12,
        city="Varanasi",
        state="Uttar Pradesh",
        authority="VDA",
        demand_level="RISING",
        demand_tags=["Kashi Vishwanath Corridor", "PM-priority city", "Airport expansion"],
        emoji="🏺",
        color="#92400e",
        bg_color="#fff7ed",
        authority_info=AuthorityInfo(
            code="VDA",
            full_name="Varanasi Development Authority",
            primary_url="https://vdavns.com",
            notice_board_url="https://vdavns.com",
            scheme_list_urls=[
                "https://vdavns.com",
                "https://vdavns.com/scheme",
            ],
            aggregator_urls=[
                "https://awaszone.com/vda-varanasi/",
                "https://ambak.com/blog/vda-housing-scheme-2025-complete-guide-for-affordable-homes-in-varanasi/",
            ],
            scraper_tier=1,
            note="VDA site is plain HTML PHP. Scheme notices in Hindi/English. "
                 "Use Hindi keyword matching for scheme detection.",
        ),
    ),

    # ── 13. BHUBANESWAR ──────────────────────────────────────────────────────
    CityConfig(
        rank=13,
        city="Bhubaneswar",
        state="Odisha",
        authority="BDA-OD",
        demand_level="RISING",
        demand_tags=["Sports city", "IT Investment zone", "Capital growth"],
        emoji="⛩️",
        color="#d97706",
        bg_color="#fffbeb",
        authority_info=AuthorityInfo(
            code="BDA-OD",
            full_name="Bhubaneswar Development Authority",
            primary_url="https://www.bda.gov.in",
            notice_board_url="https://www.bda.gov.in/circular",
            scheme_list_urls=[
                "https://www.bda.gov.in/circular",
                "https://www.bda.gov.in",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/bda-bhubaneswar",
                "https://awaszone.com/bda-odisha/",
            ],
            scraper_tier=1,
            note="BDA Odisha site is static HTML. Circular/notice page has scheme PDFs. "
                 "Subhadra Yojana plots listed here.",
        ),
    ),

    # ── 14. NAGPUR ───────────────────────────────────────────────────────────
    CityConfig(
        rank=14,
        city="Nagpur",
        state="Maharashtra",
        authority="NIT",
        demand_level="HIGH",
        demand_tags=["Samruddhi Expressway", "MIHAN Aerospace SEZ", "Zero Mile city"],
        emoji="🟠",
        color="#ea580c",
        bg_color="#fff7ed",
        authority_info=AuthorityInfo(
            code="NIT",
            full_name="Nagpur Improvement Trust",
            primary_url="https://nagpurimprovement.gov.in",
            notice_board_url="https://nagpurimprovement.gov.in/schemes",
            scheme_list_urls=[
                "https://nagpurimprovement.gov.in/schemes",
                "https://nagpurimprovement.gov.in",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/nit-nagpur",
                "https://awaszone.com/nit-nagpur/",
            ],
            scraper_tier=1,
            note="NIT site is plain HTML. Scheme list is a simple table. "
                 "Also check MHADA Nagpur board for plot schemes.",
        ),
        secondary_authority=AuthorityInfo(
            code="MHADA-NGP",
            full_name="MHADA Nagpur Board",
            primary_url="https://mhada.gov.in",
            notice_board_url="https://lottery.mhada.gov.in",
            scheme_list_urls=["https://lottery.mhada.gov.in"],
            aggregator_urls=["https://www.bajajfinservmarkets.in/resources/govt-housing-schemes/mhada"],
            scraper_tier=2,
        ),
    ),

    # ── 15. AHMEDABAD ────────────────────────────────────────────────────────
    CityConfig(
        rank=15,
        city="Ahmedabad",
        state="Gujarat",
        authority="AUDA",
        demand_level="RISING",
        demand_tags=["GIFT City/IFSC", "Ahmedabad Metro", "Delhi-Mumbai Corridor"],
        emoji="🏭",
        color="#0891b2",
        bg_color="#ecfeff",
        authority_info=AuthorityInfo(
            code="AUDA",
            full_name="Ahmedabad Urban Development Authority",
            primary_url="https://auda.org.in",
            notice_board_url="https://auda.org.in",
            scheme_list_urls=[
                "https://auda.org.in",
                "https://auda.org.in/scheme",
                "https://auda.org.in/residential",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/auda-ahmedabad",
                "https://awaszone.com/auda-ahmedabad/",
            ],
            scraper_tier=1,
            note="AUDA site is PHP-based. Lottery schemes published as notices. "
                 "Also check Gujarat Housing Board (GUDAH) for Gandhinagar plots.",
        ),
        secondary_authority=AuthorityInfo(
            code="GUDA",
            full_name="Gandhinagar Urban Development Authority",
            primary_url="https://gudah.gujarat.gov.in",
            notice_board_url="https://gudah.gujarat.gov.in",
            scheme_list_urls=["https://gudah.gujarat.gov.in"],
            aggregator_urls=["https://www.eauctionsindia.com/blog-details/guda-gandhinagar"],
            scraper_tier=1,
        ),
    ),

    # ── 16. DELHI ─────────────────────────────────────────────────────────── NEW
    CityConfig(
        rank=16,
        city="Delhi",
        state="Delhi",
        authority="DDA",
        demand_level="EXTREME",
        demand_tags=["Capital city", "Metro dense coverage", "TOD projects", "Karmayogi Awaas"],
        emoji="🏛️",
        color="#0d7a68",
        bg_color="#f0fdf8",
        authority_info=AuthorityInfo(
            code="DDA",
            full_name="Delhi Development Authority",
            primary_url="https://dda.gov.in",
            notice_board_url="https://dda.gov.in/housing",
            scheme_list_urls=[
                "https://dda.gov.in/scheme",
                "https://dda.gov.in/residential-scheme",
                "https://dda.gov.in/housing",
                "https://dda.gov.in",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/dda-housing-scheme",
                "https://www.99acres.com/articles/how-to-apply-for-dda-housing-scheme-2020-online.html",
                "https://housiey.com/blogs/dda-housing-scheme-2025-key-details-registration-online-price",
            ],
            scraper_tier=3,
            uses_playwright=True,
            note="DDA portal (dda.gov.in) is behind Cloudflare but public notice pages "
                 "are accessible. DO NOT scrape eservices.dda.org.in (CAPTCHA-protected). "
                 "Use aggregator pages as primary source — most reliable.",
        ),
    ),

    # ── 17. BHOPAL ───────────────────────────────────────────────────────────  NEW
    CityConfig(
        rank=17,
        city="Bhopal",
        state="Madhya Pradesh",
        authority="VP-BPL",
        demand_level="HIGH",
        demand_tags=["State capital", "Smart City mission", "AIIMS proximity", "MP IT hub"],
        emoji="💧",
        color="#6d28d9",
        bg_color="#faf5ff",
        authority_info=AuthorityInfo(
            code="VP-BPL",
            full_name="Vikas Pradhikaran Bhopal (Bhopal Development Authority)",
            primary_url="https://vikaspradhikaran.mponline.gov.in",
            notice_board_url="https://vikaspradhikaran.mponline.gov.in",
            scheme_list_urls=[
                "https://vikaspradhikaran.mponline.gov.in",
                "https://bda.mp.gov.in",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/bda-bhopal-residential-plot-sale",
                "https://awaszone.com/bda-bhopal/",
            ],
            scraper_tier=1,
            note="MP Online portal hosts Bhopal VP scheme offers. "
                 "Static HTML. Multiple schemes: Misrod, Navibagh, Aerocity. "
                 "Offers published as table on main page.",
        ),
    ),

    # ── 18. UDAIPUR ──────────────────────────────────────────────────────────  NEW
    CityConfig(
        rank=18,
        city="Udaipur",
        state="Rajasthan",
        authority="UIT",
        demand_level="VERY_HIGH",
        demand_tags=["City of Lakes tourism", "Rajasthan real estate boom", "Affordable pricing"],
        emoji="🏞️",
        color="#0284c7",
        bg_color="#f0f9ff",
        authority_info=AuthorityInfo(
            code="UIT",
            full_name="Urban Improvement Trust Udaipur",
            primary_url="https://uitudaipur.org",
            notice_board_url="https://uitudaipur.org",
            scheme_list_urls=[
                "https://uitudaipur.org",
                "https://uitudaipur.org/lottery_2025/",
                "https://uitudaipur.org/scheme",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/udaipur-uda-lottery",
                "https://awaszone.com/uit-udaipur/",
            ],
            scraper_tier=1,
            note="UIT Udaipur site is plain HTML. Scheme notices in both Hindi/English. "
                 "1,109-plot lottery in Dec 2025 shows high activity. "
                 "Starting at ₹1,190/sqm — very affordable entry point.",
        ),
        secondary_authority=AuthorityInfo(
            code="UDA",
            full_name="Udaipur Development Authority",
            primary_url="https://uitudaipur.org",
            notice_board_url="https://uitudaipur.org",
            scheme_list_urls=["https://uitudaipur.org"],
            aggregator_urls=["https://www.eauctionsindia.com/blog-details/udaipur-uda-lottery"],
            scraper_tier=1,
        ),
    ),

    # ── 19. DEHRADUN ─────────────────────────────────────────────────────────  NEW
    CityConfig(
        rank=19,
        city="Dehradun",
        state="Uttarakhand",
        authority="MDDA",
        demand_level="RISING",
        demand_tags=["Uttarakhand capital", "WFH migration post-COVID", "Hill city premium", "Airport upgrade"],
        emoji="🏔️",
        color="#16a34a",
        bg_color="#f0fdf4",
        authority_info=AuthorityInfo(
            code="MDDA",
            full_name="Mussoorie Dehradun Development Authority",
            primary_url="http://mddaonline.in",
            notice_board_url="http://mddaonline.in",
            scheme_list_urls=[
                "http://mddaonline.in",
                "http://mddaonline.in/scheme",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/mdda-dehradun",
                "https://ambak.com/blog/mdda-dehradun-scheme/",
            ],
            scraper_tier=1,
            note="MDDA site uses HTTP (not HTTPS) — set verify=False. "
                 "Plain PHP site. Scheme notices are HTML tables. "
                 "Dhaulaas Aawasiya Yojna and similar schemes posted here.",
        ),
    ),

    # ── 20. MEERUT ───────────────────────────────────────────────────────────  NEW
    CityConfig(
        rank=20,
        city="Meerut",
        state="Uttar Pradesh",
        authority="MDA",
        demand_level="HIGH",
        demand_tags=["Delhi-Meerut RRTS", "NCR spillover demand", "Affordable NCR alternative"],
        emoji="🚄",
        color="#db2777",
        bg_color="#fdf2f8",
        authority_info=AuthorityInfo(
            code="MDA",
            full_name="Meerut Development Authority",
            primary_url="https://mda.up.gov.in",
            notice_board_url="https://mda.up.gov.in",
            scheme_list_urls=[
                "https://mda.up.gov.in",
                "https://mda.up.gov.in/scheme",
                "https://upavp.project247.in",
            ],
            aggregator_urls=[
                "https://www.eauctionsindia.com/blog-details/mda-meerut",
                "https://awaszone.com/mda-meerut/",
            ],
            scraper_tier=1,
            note="MDA is under UP government. mda.up.gov.in is .gov.in — may need "
                 "ScraperAPI proxy. UPAVP portal also covers Meerut schemes. "
                 "NCR RRTS connectivity makes this city very attractive.",
        ),
    ),
]

# ─────────────────────────────────────────────────────────────────────────────
# HELPER LOOKUPS — Used by frontend API, scraper registry, alert modal
# ─────────────────────────────────────────────────────────────────────────────

# City name → CityConfig (fast lookup)
CITY_BY_NAME: dict[str, CityConfig] = {c.city: c for c in CITY_CONFIGS}

# Authority code → CityConfig (includes secondary authorities)
AUTHORITY_BY_CODE: dict[str, CityConfig] = {}
for _cfg in CITY_CONFIGS:
    AUTHORITY_BY_CODE[_cfg.authority] = _cfg
    if _cfg.secondary_authority:
        AUTHORITY_BY_CODE[_cfg.secondary_authority.code] = _cfg

# Ordered list of city names (for dropdowns, alert modals)
CITY_NAMES_ORDERED: list[str] = [c.city for c in CITY_CONFIGS]

# Ordered list of authority codes
AUTHORITY_CODES: list[str] = [c.authority for c in CITY_CONFIGS]

# For frontend API response (serializable dict)
def city_to_api_dict(cfg: CityConfig) -> dict:
    """Convert CityConfig to API-serializable dict for frontend."""
    return {
        "rank": cfg.rank,
        "name": cfg.city,
        "city": cfg.city,
        "state": cfg.state,
        "authority": cfg.authority,
        "authority_full_name": cfg.authority_info.full_name,
        "official_url": cfg.authority_info.primary_url,
        "demand_level": cfg.demand_level,
        "demand_tags": cfg.demand_tags,
        "emoji": cfg.emoji,
        "color": cfg.color,
        "bg_color": cfg.bg_color,
        "scraper_tier": cfg.authority_info.scraper_tier,
        # For display in cities page
        "tags": cfg.demand_tags,
        "tier": 1 if cfg.demand_level in ("EXTREME", "VERY_HIGH") else (2 if cfg.demand_level == "HIGH" else 3),
        "href": cfg.authority_info.primary_url,
    }

ALL_CITIES_API: list[dict] = [city_to_api_dict(c) for c in CITY_CONFIGS]

# ─────────────────────────────────────────────────────────────────────────────
# ANTI-SCRAPING BYPASS CONFIG
# ─────────────────────────────────────────────────────────────────────────────

# Domains that need ScraperAPI proxy (blocked from GitHub Actions Azure runners)
PROXY_REQUIRED_DOMAINS = (
    ".gov.in",
    ".nic.in",
    "mda.up.gov.in",
    "nava-raipur.com",
    "gmada.gov.in",
    "dda.gov.in",
)

# Domains with expired/self-signed SSL — use verify=False
SSL_VERIFY_FALSE_DOMAINS = (
    "mddaonline.in",        # HTTP only
    "pdaprayagraj.org",     # Old SSL
    "vdavns.com",           # May expire
    "adaagra.org.in",       # Self-signed
)

# Wait selectors per authority (for Playwright)
PLAYWRIGHT_WAIT_SELECTORS: dict[str, str] = {
    "YEIDA":   "table, .scheme-list, #content, .scheme-card",
    "JDA":     "table, .notice-list, .scheme-list, main",
    "GMADA":   "table, .scheme-list, .notice-board, main",
    "CIDCO":   "table, .scheme-card, article, .notice",
    "PMRDA":   "table, .scheme-list, main, #content",
    "BDA":     ".scheme-list, table, .entry-content, article",
    "HMDA":    "table, .scheme-card, .notice, main",
    "DDA":     "table, .scheme-list, .scheme-card, main, article",
}

# Hindi/Devanagari keywords for UP authority sites
HINDI_SCHEME_KEYWORDS = [
    "आवासीय", "आवंटन", "लॉटरी", "भूखंड", "योजना",
    "आवेदन", "आगामी", "प्राधिकरण", "प्लॉट", "भूमि",
]

# English keywords that indicate a plot lottery scheme
SCHEME_KEYWORDS_INCLUDE = [
    "residential plot", "plot scheme", "plot lottery", "land scheme",
    "plot allot", "sites lottery", "residential site", "plot draw",
    "bhukhand", "aawasiya", "आवासीय भूखंड",
]

# Keywords that mean we should EXCLUDE the scheme
SCHEME_KEYWORDS_EXCLUDE = [
    "e-auction", "eauction", "e auction",
    "lig ", " lig", " lig,", "lower income group",
    "ews ", " ews", " ews,", "economically weaker",
    "commercial plot", "industrial plot", "shop",
    "flat scheme", "apartment scheme", "housing scheme",
    "mig flat", "hig flat",
]
