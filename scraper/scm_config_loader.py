"""
GovPlot Tracker — SCM Config Loader
=====================================
Loaded once at the START of every scraper run (main.py calls load_all_configs()).
Queries Supabase directly using SUPABASE_SERVICE_KEY — no Railway dependency.

Returns a dict keyed by authority_code:
{
  "YEIDA": ScraperConfig(
      authority_code = "YEIDA",
      authority_name = "Yamuna Expressway Industrial Development Authority",
      state          = "Uttar Pradesh",
      cities         = ["Noida", "Greater Noida", "Agra"],
      scraper_class  = "YEIDAScraper",
      scraper_file   = "scraper.cities.up",
      is_active      = True,
      priority_rank  = 1,
      primary_urls   = ["https://yamunaexpresswayauthority.com/scheme", ...],
      alternative_urls = [...],
      aggregator_urls  = [...],
      sub_pages      = {"https://yamunaexpresswayauthority.com/scheme": [
                           {"url": "/residential-plot", "label": "Residential Plots", "is_enabled": True},
                           ...
                       ]},
      requires_playwright = True,
      requires_proxy     = False,
  ),
  ...
}

If Supabase is unreachable, falls back silently to empty dict so scrapers
use their own hardcoded fallback URLs (no crash).
"""

import logging
import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class UrlEntry:
    """One URL config row from scraper_url_configs."""
    id:                   str
    url_type:             str        # primary | scheme_list | notice_board | pdf_portal | alternative | aggregator
    url:                  str
    label:                Optional[str]
    sub_pages:            List[dict] = field(default_factory=list)
    priority:             int = 1
    is_enabled:           bool = True
    requires_proxy:       bool = False
    requires_playwright:  bool = False
    failure_count:        int = 0


@dataclass
class ScraperConfig:
    """Complete config for one authority, ready for BaseScraper to consume."""
    authority_code:     str
    authority_name:     str
    state:              str
    cities:             List[str]
    scraper_class:      str
    scraper_file:       str
    is_active:          bool
    priority_rank:      int
    # URL lists ordered by priority ASC
    primary_urls:       List[str] = field(default_factory=list)
    scheme_list_urls:   List[str] = field(default_factory=list)
    notice_board_urls:  List[str] = field(default_factory=list)
    pdf_portal_urls:    List[str] = field(default_factory=list)
    alternative_urls:   List[str] = field(default_factory=list)
    aggregator_urls:    List[str] = field(default_factory=list)
    # sub_pages: { parent_url: [{"url":..., "label":..., "is_enabled":...}, ...] }
    sub_pages:          Dict[str, List[dict]] = field(default_factory=dict)
    # Scraper behaviour flags (True if ANY url in this authority needs it)
    requires_playwright: bool = False
    requires_proxy:      bool = False
    # Raw url entries for run-log reporting
    url_entries:        List[UrlEntry] = field(default_factory=list)

    def all_primary_and_scheme_urls(self) -> List[str]:
        """Returns primary + scheme_list URLs in priority order — most commonly used by scrapers."""
        return self.primary_urls + self.scheme_list_urls

    def all_fallback_urls(self) -> List[str]:
        """Returns alternative + notice_board + pdf_portal URLs."""
        return self.alternative_urls + self.notice_board_urls + self.pdf_portal_urls

    def get_sub_pages(self, parent_url: str) -> List[str]:
        """Returns enabled sub-page URLs for a given parent URL."""
        return [
            sp["url"] for sp in self.sub_pages.get(parent_url, [])
            if sp.get("is_enabled", True)
        ]


# ── Main loader ──────────────────────────────────────────────────────────────

def load_all_configs() -> Dict[str, ScraperConfig]:
    """
    Loads all active authority configs from Supabase.
    Called once at the start of main.py run_all().

    Uses SUPABASE_URL + SUPABASE_SERVICE_KEY from environment.
    Returns {} on any error so scrapers gracefully fall back to hardcoded URLs.
    """
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key  = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY", "")

    if not supabase_url or not service_key:
        logger.warning("[SCM] SUPABASE_URL or SUPABASE_SERVICE_KEY not set — using hardcoded URLs")
        return {}

    try:
        import httpx
    except ImportError:
        logger.warning("[SCM] httpx not installed — falling back to hardcoded URLs")
        return {}

    headers = {
        "apikey":        service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type":  "application/json",
    }

    try:
        # ── Step 1: Fetch all active authorities ─────────────────────────────
        resp = httpx.get(
            f"{supabase_url}/rest/v1/scraper_authorities",
            params={
                "select":    "id,authority_code,authority_name,state,cities,scraper_class,scraper_file,is_active,priority_rank",
                "is_active": "eq.true",
                "order":     "priority_rank.asc",
            },
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        authorities = resp.json()

        if not authorities:
            logger.warning("[SCM] No active authorities found in DB — using hardcoded URLs")
            return {}

        logger.info("[SCM] Loaded %d active authorities from Supabase", len(authorities))

        # ── Step 2: Fetch all enabled URL configs in ONE query ────────────────
        resp = httpx.get(
            f"{supabase_url}/rest/v1/scraper_url_configs",
            params={
                "select":     "id,authority_id,url_type,url,label,sub_pages,priority,is_enabled,requires_proxy,requires_playwright,failure_count",
                "is_enabled": "eq.true",
                "order":      "priority.asc",
            },
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        url_rows = resp.json()

        logger.info("[SCM] Loaded %d enabled URL configs from Supabase", len(url_rows))

        # ── Step 3: Build authority_id → code map ────────────────────────────
        id_to_code: Dict[str, str] = {a["id"]: a["authority_code"] for a in authorities}

        # ── Step 4: Group URL rows by authority_id ────────────────────────────
        urls_by_authority: Dict[str, List[dict]] = {}
        for row in url_rows:
            aid = row.get("authority_id")
            if aid:
                urls_by_authority.setdefault(aid, []).append(row)

        # ── Step 5: Build ScraperConfig objects ───────────────────────────────
        configs: Dict[str, ScraperConfig] = {}

        for auth in authorities:
            code = auth["authority_code"]
            aid  = auth["id"]
            rows = urls_by_authority.get(aid, [])

            url_entries: List[UrlEntry] = []
            primary_urls      = []
            scheme_list_urls  = []
            notice_board_urls = []
            pdf_portal_urls   = []
            alternative_urls  = []
            aggregator_urls   = []
            sub_pages_map: Dict[str, List[dict]] = {}
            needs_playwright  = False
            needs_proxy       = False

            for row in rows:
                entry = UrlEntry(
                    id                  = row["id"],
                    url_type            = row["url_type"],
                    url                 = row["url"],
                    label               = row.get("label"),
                    sub_pages           = row.get("sub_pages") or [],
                    priority            = row.get("priority", 1),
                    is_enabled          = row.get("is_enabled", True),
                    requires_proxy      = row.get("requires_proxy", False),
                    requires_playwright = row.get("requires_playwright", False),
                    failure_count       = row.get("failure_count", 0),
                )
                url_entries.append(entry)

                if entry.requires_playwright:
                    needs_playwright = True
                if entry.requires_proxy:
                    needs_proxy = True

                # Distribute into typed lists
                utype = entry.url_type
                if utype == "primary":
                    primary_urls.append(entry.url)
                elif utype == "scheme_list":
                    scheme_list_urls.append(entry.url)
                elif utype == "notice_board":
                    notice_board_urls.append(entry.url)
                elif utype == "pdf_portal":
                    pdf_portal_urls.append(entry.url)
                elif utype == "alternative":
                    alternative_urls.append(entry.url)
                elif utype == "aggregator":
                    aggregator_urls.append(entry.url)

                # Build sub_pages map
                if entry.sub_pages:
                    sub_pages_map[entry.url] = entry.sub_pages

            configs[code] = ScraperConfig(
                authority_code      = code,
                authority_name      = auth["authority_name"],
                state               = auth["state"],
                cities              = auth.get("cities") or [],
                scraper_class       = auth["scraper_class"],
                scraper_file        = auth["scraper_file"],
                is_active           = auth["is_active"],
                priority_rank       = auth["priority_rank"],
                primary_urls        = primary_urls,
                scheme_list_urls    = scheme_list_urls,
                notice_board_urls   = notice_board_urls,
                pdf_portal_urls     = pdf_portal_urls,
                alternative_urls    = alternative_urls,
                aggregator_urls     = aggregator_urls,
                sub_pages           = sub_pages_map,
                requires_playwright = needs_playwright,
                requires_proxy      = needs_proxy,
                url_entries         = url_entries,
            )

        logger.info("[SCM] Config loaded for %d authorities", len(configs))
        return configs

    except Exception as exc:
        logger.warning("[SCM] Failed to load config from Supabase (%s) — using hardcoded URLs", exc)
        return {}


def get_config(configs: Dict[str, ScraperConfig], authority_code: str) -> Optional[ScraperConfig]:
    """Helper: get config for one authority, case-insensitive."""
    return configs.get(authority_code.upper()) or configs.get(authority_code)
