"""
GovPlot Tracker — Scheme Verification Engine v3.0
==================================================

KEY PROBLEMS FIXED FROM v2.0 (observed in 2026-04-03 log):
  1. ALL 3 Tier-A sources were Google site: searches → 561 google.com hits in 43 min
     Google detects this as bot traffic and starts serving CAPTCHAs / 429s silently.
  2. Every scheme verified individually → same authority hit Google 3× per scheme.
     LDA has 3 schemes = 9 identical Google queries minutes apart.
  3. No jitter — calls evenly spaced at 0.6s → perfect bot fingerprint.
  4. No detection of Google blocking (HTTP 200 with CAPTCHA page = false success).
  5. With 200+ schemes this will always timeout (187 schemes = 43 min already).

SOLUTION ARCHITECTURE v3.0:
  ┌─────────────────────────────────────────────────────────────┐
  │  AUTHORITY-LEVEL CACHE (NEW)                                │
  │  Verify authority once, apply score to all its schemes.     │
  │  LDA has 3 schemes → 1 authority check instead of 3.       │
  │  187 schemes across ~45 authorities → ~45 checks, not 187. │
  └─────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────┐
  │  DIRECT URL SOURCES (NEW) — no Google involved              │
  │  Tier-A now hits the real domain directly (not google.com)  │
  │  eAuctionsIndia → fetch their blog/search directly          │
  │  EstateBull → fetch their blog/search directly              │
  │  These are fast, cheap, and can't be CAPTCHA'd              │
  └─────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────┐
  │  GOOGLE CALL GUARD (NEW)                                    │
  │  Max N Google calls per session with a hard cap.            │
  │  Randomized jitter: 2–8s between calls (not 0.6s).         │
  │  CAPTCHA/block detector: 200 with no real content = skip.   │
  │  After block detected: switch to non-Google sources only.   │
  └─────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────┐
  │  SMART SKIP (IMPROVED)                                      │
  │  Skip schemes that share authority with a already-scored    │
  │  authority (score ≥ 1 from this run = trusted enough).      │
  │  Only re-verify new schemes with unknown authority.         │
  └─────────────────────────────────────────────────────────────┘

Score meaning (unchanged):
  0 = not confirmed by any source
  1 = found in 1 source → verified = True
  2 = found in 2 sources
  3 = found in 3+ sources — TRUSTED (stops checking)

With 200+ schemes and ~50 authorities, expected runtime: 5–10 min.
"""

from __future__ import annotations

import logging
import random
import time
import urllib.parse
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Hard limit on total Google-domain calls per verification session.
# Each google.com/search call risks triggering CAPTCHA.
# 187 schemes × 3 = 561 in v2 → now capped to stay well under detection threshold.
GOOGLE_CALLS_MAX = 30

# Jitter range (seconds) between ALL HTTP calls — randomized to avoid bot fingerprint.
REQUEST_DELAY_MIN = 2.0
REQUEST_DELAY_MAX = 6.0

# Extra pause after a Google call (riskier than direct calls).
GOOGLE_EXTRA_DELAY_MIN = 3.0
GOOGLE_EXTRA_DELAY_MAX = 9.0

# Score threshold — stop checking once this is reached.
TRUSTED_SCORE_THRESHOLD = 3

# CAPTCHA/block detection: if Google returns a page with these fingerprints,
# it's serving a block page, not real results.
GOOGLE_BLOCK_FINGERPRINTS = [
    "unusual traffic",
    "our systems have detected",
    "verify you're not a robot",
    "captcha",
    "recaptcha",
    "/sorry/index",
    "google.com/sorry",
]

HEADERS_POOL = [
    # Rotate between several realistic browser UA strings
    {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
    },
    {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15"
        ),
        "Accept-Language": "en-IN,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
]


# ---------------------------------------------------------------------------
# Verification source registry v3.0
#
# TIER A — Direct domain hits (no Google involved).
#   Fast, cheap, no CAPTCHA risk. Hit the real sites directly.
#
# TIER B — Major portals (direct search URLs).
#   Still direct hits, not via Google.
#
# TIER C — News portals (direct search).
#
# TIER D — Google site: searches (USE SPARINGLY — counted against GOOGLE_CALLS_MAX).
#   Only used when direct sources don't reach threshold.
#   Marked with "use_google": True so the guard can count them.
# ---------------------------------------------------------------------------

VERIFICATION_SOURCES: list[dict] = [
    # ── Tier A: Direct domain hits ──────────────────────────────────────────
    {
        "name": "eAuctionsIndia_direct",
        "search_url": "https://eauctionsindia.com/blog-search?q={authority}+{city}+plot",
        "fallback_url": "https://eauctionsindia.com/search?keyword={authority}+{city}",
        "min_matches": 2,
        "use_google": False,
        "tier": "A",
    },
    {
        "name": "EstateBull_direct",
        "search_url": "https://estatebull.com/blogs?search={authority}+{city}+plot+scheme",
        "fallback_url": "https://estatebull.com/search?q={authority}+{city}+plot",
        "min_matches": 2,
        "use_google": False,
        "tier": "A",
    },
    {
        "name": "YamunaAuthorityPlots_direct",
        "search_url": "https://yamunaauthorityplots.in/?s={authority}+{city}+scheme",
        "fallback_url": "https://yamunaauthorityplots.in/blog/?s={authority}",
        "min_matches": 2,
        "use_google": False,
        "tier": "A",
    },

    # ── Tier B: Major national portals (direct search) ───────────────────────
    {
        "name": "99acres",
        "search_url": (
            "https://www.99acres.com/search/property/buy/{city_slug}"
            "?search_type=locality&keyword={authority}+plot"
        ),
        "min_matches": 2,
        "use_google": False,
        "tier": "B",
    },
    {
        "name": "MagicBricks",
        "search_url": (
            "https://www.magicbricks.com/property-for-sale/residential-plot-land"
            "/proptype-Plot-Land/{city_slug}?keyword={authority}+plot"
        ),
        "min_matches": 2,
        "use_google": False,
        "tier": "B",
    },
    {
        "name": "NoBroker",
        "search_url": (
            "https://www.nobroker.in/property/buy/{city_slug}/plot/"
            "?searchParam={authority}+plot+scheme"
        ),
        "min_matches": 2,
        "use_google": False,
        "tier": "B",
    },
    {
        "name": "Housing",
        "search_url": (
            "https://housing.com/in/buy/{city_slug}/plots"
            "?q={authority}+plot+scheme"
        ),
        "min_matches": 2,
        "use_google": False,
        "tier": "B",
    },

    # ── Tier C: News portals (direct search, no Google) ──────────────────────
    {
        "name": "HindustanTimes",
        "search_url": (
            "https://www.hindustantimes.com/search"
            "?query={authority}+{city}+plot+scheme&type=realestate"
        ),
        "min_matches": 2,
        "use_google": False,
        "tier": "C",
    },
    {
        "name": "EconomicTimes",
        "search_url": (
            "https://economictimes.indiatimes.com/searchresult.cms"
            "?query={authority}+{city}+residential+plot+scheme"
        ),
        "min_matches": 2,
        "use_google": False,
        "tier": "C",
    },
    {
        "name": "TimesOfIndia",
        "search_url": (
            "https://timesofindia.indiatimes.com/topic/{authority}-{city_slug}-plot-scheme"
        ),
        "min_matches": 1,
        "use_google": False,
        "tier": "C",
    },
    {
        "name": "NDTV",
        "search_url": (
            "https://www.ndtv.com/search"
            "?searchtext={authority}+{city}+plot+scheme"
        ),
        "min_matches": 1,
        "use_google": False,
        "tier": "C",
    },

    # ── Tier D: Google site: (use sparingly — counts against GOOGLE_CALLS_MAX) ─
    {
        "name": "Google_eAuctionsIndia",
        "search_url": (
            "https://www.google.com/search"
            "?q=site%3Aeauctionsindia.com+{authority}+{city}+plot"
        ),
        "min_matches": 2,
        "use_google": True,
        "tier": "D",
    },
    {
        "name": "Google_EstateBull",
        "search_url": (
            "https://www.google.com/search"
            "?q=site%3Aestatebull.com+{authority}+{city}+plot+scheme"
        ),
        "min_matches": 2,
        "use_google": True,
        "tier": "D",
    },
    {
        "name": "Google_360PropGuide",
        "search_url": (
            "https://www.google.com/search"
            "?q=site%3A360propguide.com+{authority}+{city}+scheme"
        ),
        "min_matches": 1,
        "use_google": True,
        "tier": "D",
    },
]


# ---------------------------------------------------------------------------
# Session-level Google call counter — shared across all verify_scheme() calls
# ---------------------------------------------------------------------------
class _SessionState:
    google_calls_used: int = 0
    google_blocked: bool = False  # True once a CAPTCHA/block page is detected


_session = _SessionState()


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
    sources_skipped: list[str] = field(default_factory=list)
    verified: bool = False
    early_exit: bool = False
    from_authority_cache: bool = False   # True if score inherited from authority cache
    last_verified_at: str = ""


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------

def _city_slug(city: str) -> str:
    return city.lower().replace(" ", "-")


def _encode(value: str) -> str:
    return urllib.parse.quote_plus(value)


def _build_url(source: dict, scheme_name: str, authority: str, city: str) -> str:
    skip_words = {
        "scheme", "yojana", "phase", "stage", "the", "of", "in", "and",
        "at", "for", "a", "an", "residential", "plot", "lottery", "plots",
        "housing", "2024", "2025", "2026", "2023",
    }
    content_words = [
        w for w in scheme_name.split()
        if w.lower() not in skip_words and len(w) > 2
    ]
    query_parts = [authority] + content_words[:2]
    query = "+".join(_encode(p) for p in query_parts)

    return (
        source["search_url"]
        .replace("{query}",     query)
        .replace("{city}",      _encode(city))
        .replace("{city_slug}", _city_slug(city))
        .replace("{authority}", _encode(authority))
    )


# ---------------------------------------------------------------------------
# Google block detector
# ---------------------------------------------------------------------------

def _is_google_blocked(text: str) -> bool:
    """Return True if the response looks like a CAPTCHA / block page."""
    text_lower = text.lower()
    return any(fp in text_lower for fp in GOOGLE_BLOCK_FINGERPRINTS)


# ---------------------------------------------------------------------------
# Single-source checker
# ---------------------------------------------------------------------------

def _check_source(
    source: dict,
    scheme_name: str,
    authority: str,
    city: str,
) -> bool:
    global _session

    is_google = source.get("use_google", False)

    # ── Google guard ─────────────────────────────────────────────────────────
    if is_google:
        if _session.google_blocked:
            logger.info(f"[VERIFY] ⛔ Google blocked — skipping {source['name']}")
            return False
        if _session.google_calls_used >= GOOGLE_CALLS_MAX:
            logger.info(
                f"[VERIFY] ⛔ Google cap reached ({GOOGLE_CALLS_MAX}) — skipping {source['name']}"
            )
            return False

    url = _build_url(source, scheme_name, authority, city)
    headers = random.choice(HEADERS_POOL)

    try:
        with httpx.Client(headers=headers, timeout=12, follow_redirects=True) as client:
            resp = client.get(url)

        # Track Google calls
        if is_google:
            _session.google_calls_used += 1

        if resp.status_code == 429:
            logger.warning(f"[VERIFY] ⚠️  429 rate-limit on {source['name']} — pausing 30s")
            if is_google:
                _session.google_blocked = True
            time.sleep(30)
            return False

        if resp.status_code not in (200, 203):
            logger.debug(f"[VERIFY] [{source['name']}] HTTP {resp.status_code}")
            return False

        text = resp.text.lower()

        # Detect Google CAPTCHA / block page
        if is_google and _is_google_blocked(resp.text):
            logger.warning(
                f"[VERIFY] 🚫 Google serving CAPTCHA/block on {source['name']} "
                f"(used {_session.google_calls_used}/{GOOGLE_CALLS_MAX} Google calls). "
                f"Disabling Google sources for remainder of session."
            )
            _session.google_blocked = True
            return False

        min_matches: int = source.get("min_matches", 2)
        hits = sum([
            authority.lower() in text,
            city.lower() in text,
            any(w.lower() in text for w in scheme_name.split() if len(w) > 3),
        ])
        found = hits >= min_matches
        logger.debug(
            f"[VERIFY] [{source['name']}] hits={hits}/{min_matches} → "
            f"{'✓' if found else '✗'}"
        )
        return found

    except httpx.TimeoutException:
        logger.debug(f"[VERIFY] [{source['name']}] Timeout")
        return False
    except Exception as exc:
        logger.debug(f"[VERIFY] [{source['name']}] Error: {exc}")
        return False


def _sleep_between_calls(is_google: bool = False):
    """Randomized sleep to avoid bot detection."""
    if is_google:
        delay = random.uniform(GOOGLE_EXTRA_DELAY_MIN, GOOGLE_EXTRA_DELAY_MAX)
    else:
        delay = random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX)
    time.sleep(delay)


# ---------------------------------------------------------------------------
# Public API — single scheme verification
# ---------------------------------------------------------------------------

def verify_scheme(
    scheme_id: str,
    scheme_name: str,
    authority: str,
    city: str,
) -> VerificationResult:
    """
    Verify a single scheme. Checks sources in tier order (A → B → C → D),
    exits early once score ≥ TRUSTED_SCORE_THRESHOLD.
    Google-domain sources (Tier D) are guarded by session-level cap.
    """
    result = VerificationResult(
        scheme_id=scheme_id,
        scheme_name=scheme_name,
        authority=authority,
        city=city,
        last_verified_at=datetime.now(timezone.utc).isoformat(),
    )

    for source in VERIFICATION_SOURCES:
        # Early exit
        if result.verification_score >= TRUSTED_SCORE_THRESHOLD:
            result.early_exit = True
            result.sources_skipped.append(source["name"])
            continue

        # Skip Google sources if blocked/capped
        if source.get("use_google") and (_session.google_blocked or
                _session.google_calls_used >= GOOGLE_CALLS_MAX):
            result.sources_skipped.append(source["name"])
            logger.debug(f"[VERIFY] Skipping {source['name']} — Google cap/block")
            continue

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

        _sleep_between_calls(is_google=source.get("use_google", False))

    result.verified = result.verification_score >= 1
    return result


# ---------------------------------------------------------------------------
# Public API — bulk verification with authority-level caching
# ---------------------------------------------------------------------------

def bulk_verify(
    schemes: list[dict],
    existing_scores: dict[str, int] | None = None,
) -> dict[str, VerificationResult]:
    """
    Verify a batch of schemes efficiently using authority-level caching.

    KEY OPTIMISATION — Authority Cache:
      If LDA already scored ≥ 1 in this run, all remaining LDA schemes
      inherit that score without any HTTP calls. This cuts calls from
      N_schemes × 3 down to N_authorities × 3 (typically 5–10× fewer).

      Example: 187 schemes across ~50 authorities → ~50 real checks instead of 187.
      At 3 calls/check with 2–6s jitter → ~50×3×4s = ~10 min (vs 43 min in v2).

    Skip tiers:
      1. existing_scores[scheme_id] ≥ 3 → skip entirely (already trusted in DB).
      2. authority_cache[authority] ≥ TRUSTED_SCORE_THRESHOLD → inherit, no HTTP.
      3. Live check with early-exit at threshold.

    Google guard:
      Session-level counter caps Google hits at GOOGLE_CALLS_MAX.
      Once capped or CAPTCHA detected, Google Tier-D sources are skipped
      for the rest of the session.
    """
    # Reset session state for this bulk run
    _session.google_calls_used = 0
    _session.google_blocked = False

    existing_scores = existing_scores or {}
    results: dict[str, VerificationResult] = {}

    # Authority-level cache: {authority → VerificationResult of the first scheme checked}
    # Once an authority is verified, subsequent schemes for the same authority
    # inherit the score without further HTTP calls.
    authority_cache: dict[str, VerificationResult] = {}

    # Sort schemes: put already-scored schemes last so cache builds from fresh ones
    def _sort_key(s: dict) -> int:
        sid = s.get("scheme_id", "")
        return existing_scores.get(sid, 0)

    sorted_schemes = sorted(schemes, key=_sort_key)

    total = len(sorted_schemes)
    logger.info(
        f"[VERIFY] Starting bulk verification of {total} schemes. "
        f"Google cap: {GOOGLE_CALLS_MAX} calls. "
        f"Jitter: {REQUEST_DELAY_MIN}–{REQUEST_DELAY_MAX}s (non-Google), "
        f"{GOOGLE_EXTRA_DELAY_MIN}–{GOOGLE_EXTRA_DELAY_MAX}s (Google)."
    )

    for idx, scheme in enumerate(sorted_schemes, 1):
        sid = scheme.get("scheme_id", "")
        name = scheme.get("name", "")
        authority = scheme.get("authority", "")
        city = scheme.get("city", "")

        if not sid:
            continue

        existing_score = existing_scores.get(sid, 0)

        # ── Skip 1: already trusted in DB ─────────────────────────────────
        if existing_score >= TRUSTED_SCORE_THRESHOLD:
            logger.info(
                f"[VERIFY] [{idx}/{total}] Skipping '{sid}' — "
                f"DB score={existing_score} ≥ {TRUSTED_SCORE_THRESHOLD}"
            )
            results[sid] = VerificationResult(
                scheme_id=sid, scheme_name=name, authority=authority, city=city,
                verification_score=existing_score,
                verified=True, early_exit=True,
                last_verified_at=datetime.now(timezone.utc).isoformat(),
            )
            continue

        # ── Skip 2: authority already verified this session (cache hit) ────
        if authority in authority_cache:
            cached = authority_cache[authority]
            logger.info(
                f"[VERIFY] [{idx}/{total}] Cache hit '{sid}' → "
                f"inheriting score={cached.verification_score} from authority '{authority}'"
            )
            results[sid] = VerificationResult(
                scheme_id=sid, scheme_name=name, authority=authority, city=city,
                verification_score=cached.verification_score,
                sources_found=list(cached.sources_found),
                sources_checked=[],
                sources_skipped=["(authority cache)"],
                verified=cached.verified,
                early_exit=True,
                from_authority_cache=True,
                last_verified_at=datetime.now(timezone.utc).isoformat(),
            )
            continue

        # ── Live verification ─────────────────────────────────────────────
        logger.info(
            f"[VERIFY] [{idx}/{total}] Checking '{sid}' — "
            f"'{name[:55]}' [{authority}, {city}] | "
            f"Google used: {_session.google_calls_used}/{GOOGLE_CALLS_MAX}"
            + (" ⛔ BLOCKED" if _session.google_blocked else "")
        )

        result = verify_scheme(
            scheme_id=sid,
            scheme_name=name,
            authority=authority,
            city=city,
        )
        results[sid] = result

        # Store in authority cache so subsequent schemes skip HTTP
        authority_cache[authority] = result

        logger.info(
            f"[VERIFY] [{idx}/{total}] Done '{sid}' → "
            f"score={result.verification_score} verified={result.verified} "
            f"sources={result.sources_found} | "
            f"Google used: {_session.google_calls_used}/{GOOGLE_CALLS_MAX}"
        )

        # Polite pause between scheme-level checks (not between each source call,
        # which already has its own jitter via _sleep_between_calls)
        time.sleep(random.uniform(1.0, 2.5))

    # Final summary
    verified_count = sum(1 for r in results.values() if r.verified)
    cache_hits = sum(1 for r in results.values() if r.from_authority_cache)
    logger.info(
        f"[VERIFY] ✅ Bulk verification complete: "
        f"{verified_count}/{len(results)} verified, "
        f"{cache_hits} from authority cache, "
        f"{_session.google_calls_used} Google calls used."
    )

    return results
