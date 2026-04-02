"""
GovPlot Tracker — Scheme Verification Engine
Cross-checks scheme validity against news/real-estate portals.
Assigns verification_score 1-5 based on how many sources confirm the scheme.

Sources checked:
  - AajTak (news)
  - 99acres (listings)
  - MagicBricks (listings)
  - NoBroker (listings)
  - Housing.com (listings)

Score meaning:
  0 = unverified (not found in any source)
  1 = found in 1 source
  2 = found in 2 sources
  3 = found in 3 sources
  4 = found in 4 sources
  5 = found in all 5 sources (most trusted)
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger(__name__)

# Sources to check — these are the real-estate and news portals
VERIFICATION_SOURCES: list[dict] = [
    {
        "name": "99acres",
        "search_url": "https://www.99acres.com/search/property/buy/{city}?search_type=locality&title={query}",
        "keyword_match": True,
    },
    {
        "name": "MagicBricks",
        "search_url": "https://www.magicbricks.com/property-for-sale/residential-plot-land/proptype-Plot-Land/{city}",
        "keyword_match": True,
    },
    {
        "name": "NoBroker",
        "search_url": "https://www.nobroker.in/property/buy/{city}/plot/?searchParam={query}",
        "keyword_match": True,
    },
    {
        "name": "Housing.com",
        "search_url": "https://housing.com/in/buy/plots-in-{city}?q={query}",
        "keyword_match": True,
    },
    {
        "name": "AajTak",
        "search_url": "https://www.aajtak.in/search?q={query}+%E0%A4%AA%E0%A5%8D%E0%A4%B2%E0%A5%89%E0%A4%9F+%E0%A4%AF%E0%A5%8B%E0%A4%9C%E0%A4%A8%E0%A4%BE",
        "keyword_match": True,
    },
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
}


@dataclass
class VerificationResult:
    scheme_id: str
    scheme_name: str
    authority: str
    city: str
    verification_score: int = 0
    sources_found: list[str] = field(default_factory=list)
    sources_checked: list[str] = field(default_factory=list)
    verified: bool = False
    last_verified_at: str = ""


def _build_query(scheme_name: str, authority: str) -> str:
    """Build a search-friendly query from scheme name."""
    keywords = [authority]
    # Extract meaningful words — skip generic words
    skip = {"scheme", "yojana", "phase", "stage", "the", "of", "in", "and", "at", "for", "a"}
    words = [w for w in scheme_name.split() if w.lower() not in skip and len(w) > 2]
    keywords.extend(words[:5])
    return "+".join(keywords)


def _city_slug(city: str) -> str:
    return city.lower().replace(" ", "-")


def _check_source(source: dict, scheme_name: str, authority: str, city: str) -> bool:
    """
    Returns True if scheme-related content is found on the source page.
    Uses lightweight HTTP GET + keyword matching.
    """
    query = _build_query(scheme_name, authority)
    city_slug = _city_slug(city)
    url = (
        source["search_url"]
        .replace("{city}", city_slug)
        .replace("{query}", query)
    )
    try:
        with httpx.Client(headers=HEADERS, timeout=10, follow_redirects=True) as client:
            resp = client.get(url)
        if resp.status_code != 200:
            return False
        text = resp.text.lower()
        # Check if scheme authority or key words appear in the page
        checks = [
            authority.lower() in text,
            city.lower() in text,
            any(w.lower() in text for w in scheme_name.split()[:4]),
        ]
        return sum(checks) >= 2
    except Exception as exc:
        logger.debug(f"[{source['name']}] Request failed: {exc}")
        return False


def verify_scheme(
    scheme_id: str,
    scheme_name: str,
    authority: str,
    city: str,
    max_sources: int = 5,
) -> VerificationResult:
    """
    Check scheme against all verification sources.
    Returns a VerificationResult with score 0–5.
    """
    from datetime import datetime, timezone
    result = VerificationResult(
        scheme_id=scheme_id,
        scheme_name=scheme_name,
        authority=authority,
        city=city,
        last_verified_at=datetime.now(timezone.utc).isoformat(),
    )

    for source in VERIFICATION_SOURCES[:max_sources]:
        result.sources_checked.append(source["name"])
        found = _check_source(source, scheme_name, authority, city)
        if found:
            result.sources_found.append(source["name"])
        time.sleep(0.5)  # polite delay between requests

    result.verification_score = len(result.sources_found)
    result.verified = result.verification_score >= 1
    return result


def bulk_verify(
    schemes: list[dict],
    existing_scores: dict[str, int] | None = None,
) -> dict[str, VerificationResult]:
    """
    Verify a list of scheme dicts.
    Skips re-verification if existing_scores already has score >= 3.

    Args:
        schemes: list of scheme dicts with keys: scheme_id, name, authority, city
        existing_scores: {scheme_id: verification_score} from DB — avoids redundant checks

    Returns:
        {scheme_id: VerificationResult}
    """
    existing_scores = existing_scores or {}
    results: dict[str, VerificationResult] = {}

    for scheme in schemes:
        sid = scheme.get("scheme_id", "")
        existing = existing_scores.get(sid, 0)

        # If already verified 3+ times, skip re-check (saves bandwidth)
        if existing >= 3:
            logger.info(f"[VERIFY] Skipping {sid} — already has score {existing}")
            results[sid] = VerificationResult(
                scheme_id=sid,
                scheme_name=scheme.get("name", ""),
                authority=scheme.get("authority", ""),
                city=scheme.get("city", ""),
                verification_score=existing,
                verified=True,
            )
            continue

        logger.info(f"[VERIFY] Checking {sid} — {scheme.get('name', '')[:50]}")
        result = verify_scheme(
            scheme_id=sid,
            scheme_name=scheme.get("name", ""),
            authority=scheme.get("authority", ""),
            city=scheme.get("city", ""),
        )
        results[sid] = result
        logger.info(
            f"[VERIFY] {sid} → score={result.verification_score} "
            f"sources={result.sources_found}"
        )
        time.sleep(1)  # rate limiting between schemes

    return results
