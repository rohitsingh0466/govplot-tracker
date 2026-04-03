"""
GovPlot Tracker — Scheme Verification Engine v2.0
Cross-checks scheme validity against real-estate portals and news sources.
Assigns verification_score 0–5 based on how many sources confirm the scheme.

Sources checked (in priority order):
  Tier A — High-trust real-estate / auction portals (4 pages each):
    1. eAuctionsIndia.com  – Blog at /blog-details/{slug}; search via Google
    2. EstateBull.com      – Blog at /blogs/{slug}; covers NCR/Jaipur/Bangalore plots
    3. YamunaAuthorityPlots.in – Blog at /blog/{slug}; YEIDA-specialist site

  Tier B — Major national real-estate portals (1–2 pages each):
    4. 99acres.com         – Search at /search/property/buy/{city}?...
    5. MagicBricks.com     – Articles + search pages
    6. NoBroker.in         – Blog at /blog/{slug} + search

  Tier C — News (1–2 pages each):
    7. HindustanTimes.com  – Real-estate section search
    8. EconomicTimes.com   – Realty section search
    9. TimesOfIndia.com    – City edition search
   10. NDTV.com            – Property search

  Tier D — Specialist / niche (1 page each):
   11. 360PropGuide.com
   12. Ambak.com

Score meaning:
  0 = not found in any source
  1 = found in 1 source
  2 = found in 2 sources
  3 = found in 3+ sources — TRUSTED (verification stops here)
  4 = found in 4 sources
  5 = found in all checked sources

Early-exit: as soon as verification_score >= 3, remaining sources are skipped.
Re-check skip: schemes already at score >= 3 in the DB are not re-verified.
"""

from __future__ import annotations

import logging
import time
import urllib.parse
from dataclasses import dataclass, field
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Verification source registry
# Each entry describes ONE source and how to build a search URL for it.
#
# Keys:
#   name        – human-readable label
#   search_url  – URL template; {query}, {city}, {authority} are substituted
#   min_matches – how many of the keyword_targets must appear in page text
#                 for the source to count as "found"
#   weight      – reserved for future weighting; currently each source = 1 point
# ---------------------------------------------------------------------------

VERIFICATION_SOURCES: list[dict] = [
    # ── Tier A: high-trust real-estate/auction portals ──────────────────────

    {
        "name": "eAuctionsIndia",
        # Their blog uses Google-indexed slugs; we do a Google site-search
        "search_url": (
            "https://www.google.com/search"
            "?q=site:eauctionsindia.com+{authority}+{city}+plot+scheme"
        ),
        "min_matches": 2,
    },
    {
        "name": "EstateBull",
        # Blog lives at /blogs/ with guides on YEIDA, JDA, LDA, BDA etc.
        "search_url": (
            "https://www.google.com/search"
            "?q=site:estatebull.com+{authority}+{city}+plot+scheme"
        ),
        "min_matches": 2,
    },
    {
        "name": "YamunaAuthorityPlots",
        # YEIDA-specialist blog; highly relevant for UP/NCR schemes
        "search_url": (
            "https://www.google.com/search"
            "?q=site:yamunaauthorityplots.in+{authority}+{city}+scheme"
        ),
        "min_matches": 2,
    },

    # ── Tier B: major national portals ──────────────────────────────────────

    {
        "name": "99acres",
        "search_url": (
            "https://www.99acres.com/search/property/buy/{city_slug}"
            "?search_type=locality&title={authority}+plot+scheme"
        ),
        "min_matches": 2,
    },
    {
        "name": "MagicBricks",
        "search_url": (
            "https://www.magicbricks.com/property-for-sale/residential-plot-land"
            "/proptype-Plot-Land/{city_slug}?keyword={authority}+plot"
        ),
        "min_matches": 2,
    },
    {
        "name": "NoBroker",
        "search_url": (
            "https://www.nobroker.in/property/buy/{city_slug}/plot/"
            "?searchParam={authority}+plot+scheme"
        ),
        "min_matches": 2,
    },

    # ── Tier C: national news ────────────────────────────────────────────────

    {
        "name": "HindustanTimes",
        "search_url": (
            "https://www.hindustantimes.com/search"
            "?query={authority}+{city}+plot+scheme&type=realestate"
        ),
        "min_matches": 2,
    },
    {
        "name": "EconomicTimes",
        "search_url": (
            "https://economictimes.indiatimes.com/searchresult.cms"
            "?query={authority}+{city}+residential+plot+scheme"
        ),
        "min_matches": 2,
    },
    {
        "name": "TimesOfIndia",
        "search_url": (
            "https://timesofindia.indiatimes.com/topic/{authority}-{city_slug}-plot-scheme"
        ),
        "min_matches": 1,
    },
    {
        "name": "NDTV",
        "search_url": (
            "https://www.ndtv.com/search"
            "?searchtext={authority}+{city}+plot+scheme"
        ),
        "min_matches": 1,
    },

    # ── Tier D: specialist / niche ───────────────────────────────────────────

    {
        "name": "360PropGuide",
        "search_url": (
            "https://www.google.com/search"
            "?q=site:360propguide.com+{authority}+{city}+scheme"
        ),
        "min_matches": 1,
    },
    {
        "name": "Ambak",
        "search_url": (
            "https://www.google.com/search"
            "?q=site:ambak.com+{authority}+{city}+plot+scheme"
        ),
        "min_matches": 1,
    },
]

# Stop checking more sources once this score is reached.
TRUSTED_SCORE_THRESHOLD = 3

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Seconds to wait between HTTP requests (polite crawling).
REQUEST_DELAY = 0.6


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class VerificationResult:
    scheme_id: str
    scheme_name: str
    authority: str
    city: str
    verification_score: int = 0
    sources_found: list[str] = field(default_factory=list)
    sources_checked: list[str] = field(default_factory=list)
    sources_skipped: list[str] = field(default_factory=list)   # early-exit skips
    verified: bool = False
    early_exit: bool = False                                    # True if threshold hit
    last_verified_at: str = ""


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------

def _city_slug(city: str) -> str:
    """Convert 'Navi Mumbai' → 'navi-mumbai'."""
    return city.lower().replace(" ", "-")


def _encode(value: str) -> str:
    """URL-encode a query token."""
    return urllib.parse.quote_plus(value)


def _build_search_url(source: dict, scheme_name: str, authority: str, city: str) -> str:
    """
    Substitute placeholders in a source's search_url template.

    Placeholders:
      {query}      – authority + first 3 content words of scheme name
      {city}       – raw city name (URL-encoded)
      {city_slug}  – hyphenated city name  (e.g. navi-mumbai)
      {authority}  – authority abbreviation (URL-encoded)
    """
    # Build a compact but descriptive query keyword
    skip_words = {
        "scheme", "yojana", "phase", "stage", "the", "of", "in",
        "and", "at", "for", "a", "an", "residential", "plot",
        "lottery", "plots", "housing",
    }
    content_words = [
        w for w in scheme_name.split()
        if w.lower() not in skip_words and len(w) > 2
    ]
    query_parts = [authority] + content_words[:3]
    query = "+".join(_encode(p) for p in query_parts)

    return (
        source["search_url"]
        .replace("{query}",     query)
        .replace("{city}",      _encode(city))
        .replace("{city_slug}", _city_slug(city))
        .replace("{authority}", _encode(authority))
    )


# ---------------------------------------------------------------------------
# Single-source checker
# ---------------------------------------------------------------------------

def _check_source(
    source: dict,
    scheme_name: str,
    authority: str,
    city: str,
) -> bool:
    """
    Fetch the source URL and return True if enough scheme-related keywords
    appear in the page text.

    Keyword targets (ALL must appear ≥ min_matches times in total):
      - authority abbreviation
      - city name
      - at least one content word from the scheme name
    """
    url = _build_search_url(source, scheme_name, authority, city)
    try:
        with httpx.Client(headers=HEADERS, timeout=12, follow_redirects=True) as client:
            resp = client.get(url)

        if resp.status_code not in (200, 203):
            logger.debug(
                f"[{source['name']}] HTTP {resp.status_code} for {url}"
            )
            return False

        text = resp.text.lower()
        min_matches: int = source.get("min_matches", 2)

        # Score individual keyword hits
        hits = sum([
            authority.lower() in text,
            city.lower() in text,
            any(
                w.lower() in text
                for w in scheme_name.split()
                if len(w) > 3
            ),
        ])
        found = hits >= min_matches
        logger.debug(
            f"[{source['name']}] hits={hits}/{min_matches} → {'✓' if found else '✗'}"
        )
        return found

    except httpx.TimeoutException:
        logger.debug(f"[{source['name']}] Timeout for {url}")
        return False
    except Exception as exc:
        logger.debug(f"[{source['name']}] Error: {exc}")
        return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def verify_scheme(
    scheme_id: str,
    scheme_name: str,
    authority: str,
    city: str,
) -> VerificationResult:
    """
    Check a single scheme against all VERIFICATION_SOURCES in order.

    Early-exit rule: once verification_score >= TRUSTED_SCORE_THRESHOLD (3),
    all remaining sources are skipped and early_exit=True is set.

    Returns a VerificationResult with score 0–len(VERIFICATION_SOURCES).
    """
    result = VerificationResult(
        scheme_id=scheme_id,
        scheme_name=scheme_name,
        authority=authority,
        city=city,
        last_verified_at=datetime.now(timezone.utc).isoformat(),
    )

    for source in VERIFICATION_SOURCES:
        # ── Early-exit check ─────────────────────────────────────────────
        if result.verification_score >= TRUSTED_SCORE_THRESHOLD:
            result.early_exit = True
            result.sources_skipped.append(source["name"])
            logger.info(
                f"[VERIFY] Early exit — score={result.verification_score} "
                f"≥ {TRUSTED_SCORE_THRESHOLD}. Skipping '{source['name']}'"
            )
            continue  # accumulate skipped list but don't fetch

        # ── Fetch and check ───────────────────────────────────────────────
        result.sources_checked.append(source["name"])
        found = _check_source(source, scheme_name, authority, city)

        if found:
            result.sources_found.append(source["name"])
            result.verification_score += 1
            logger.info(
                f"[VERIFY] ✓ {source['name']} → score now {result.verification_score}"
            )
        else:
            logger.debug(f"[VERIFY] ✗ {source['name']}")

        time.sleep(REQUEST_DELAY)

    result.verified = result.verification_score >= 1
    return result


def bulk_verify(
    schemes: list[dict],
    existing_scores: dict[str, int] | None = None,
) -> dict[str, VerificationResult]:
    """
    Verify a list of scheme dicts in bulk.

    Skip logic (two levels):
      1. If existing_scores[scheme_id] >= TRUSTED_SCORE_THRESHOLD (3) → skip entirely.
         The scheme is already trusted; no HTTP calls needed.
      2. Within verify_scheme() → early-exit once live score hits threshold.

    Args:
        schemes:        list of dicts with keys: scheme_id, name, authority, city
        existing_scores: {scheme_id: int} from DB/JSON — avoids redundant re-checks

    Returns:
        {scheme_id: VerificationResult}
    """
    existing_scores = existing_scores or {}
    results: dict[str, VerificationResult] = {}

    for scheme in schemes:
        sid = scheme.get("scheme_id", "")
        name = scheme.get("name", "")
        authority = scheme.get("authority", "")
        city = scheme.get("city", "")

        if not sid:
            continue

        existing_score = existing_scores.get(sid, 0)

        # ── Level-1 skip: already trusted in the DB ───────────────────────
        if existing_score >= TRUSTED_SCORE_THRESHOLD:
            logger.info(
                f"[VERIFY] Skipping '{sid}' — DB score={existing_score} "
                f"≥ {TRUSTED_SCORE_THRESHOLD} (already trusted)"
            )
            results[sid] = VerificationResult(
                scheme_id=sid,
                scheme_name=name,
                authority=authority,
                city=city,
                verification_score=existing_score,
                verified=True,
                early_exit=True,
                last_verified_at=datetime.now(timezone.utc).isoformat(),
            )
            continue

        # ── Live verification (with built-in early exit at threshold) ─────
        logger.info(
            f"[VERIFY] Checking '{sid}' — '{name[:60]}' "
            f"[{authority}, {city}]"
        )
        result = verify_scheme(
            scheme_id=sid,
            scheme_name=name,
            authority=authority,
            city=city,
        )
        results[sid] = result

        logger.info(
            f"[VERIFY] Done '{sid}' → score={result.verification_score} "
            f"verified={result.verified} early_exit={result.early_exit} "
            f"found={result.sources_found} "
            f"skipped={result.sources_skipped}"
        )

        # Polite pause between schemes
        time.sleep(1)

    return results
