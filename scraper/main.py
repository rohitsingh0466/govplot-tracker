"""
GovPlot Tracker — Scraper Orchestrator v2.1
============================================
Modes: full | refresh | verify | auto

EXECUTION FLOW (what runs when):
─────────────────────────────────────────────────────────────
  mode=full    → Phase 1 (scrape) + Phase 2 (save+push)
                 Verification is handled by scrape.yml Step B separately.
                 Nothing runs twice.

  mode=refresh → Phase 1 (active schemes only) + Phase 2 (save+push)
                 No verification.

  mode=verify  → Load from disk + Phase 3 (verify) + re-save+push with scores.
                 Called by scrape.yml Step B on full/verify runs.

  mode=auto    → Detects day: Sunday=full, Mon-Sat=refresh.
─────────────────────────────────────────────────────────────

KEY DESIGN PRINCIPLE:
  Data is saved to disk and pushed to Supabase BEFORE verification begins.
  This means even if verification times out (it makes 100s of HTTP calls),
  scraped scheme data is already safe in Supabase.

  Verification (scraper/verifier.py) is called ONLY in mode=verify.
  The scrape.yml workflow orchestrates the two phases as separate steps.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from scraper.cities.all_cities import ALL_SCRAPERS

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

OUTPUT_DIR = Path("data/schemes")
ACTIVE_STATUS = {"OPEN", "ACTIVE"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_weekly_run() -> bool:
    return (
        os.getenv("GOVPLOT_FORCE_FULL", "").strip() == "1"
        or datetime.now(timezone.utc).weekday() == 6   # Sunday
    )


def _load_existing() -> dict:
    p = OUTPUT_DIR / "latest.json"
    if p.exists():
        try:
            return {
                s["scheme_id"]: s
                for s in json.loads(p.read_text())
                if isinstance(s, dict)
            }
        except Exception:
            pass
    return {}


def _load_scores() -> dict:
    p = OUTPUT_DIR / "verification_scores.json"
    if p.exists():
        try:
            return json.loads(p.read_text())
        except Exception:
            pass
    return {}


def _recalc_status(scheme: dict) -> dict:
    """Re-derive OPEN/UPCOMING/CLOSED from open_date and close_date."""
    from datetime import date
    today = date.today().isoformat()
    od = scheme.get("open_date")
    cd = scheme.get("close_date")
    if cd and cd < today:
        scheme["status"] = "CLOSED"
    elif od and od > today:
        scheme["status"] = "UPCOMING"
    elif od and od <= today and (not cd or cd >= today):
        scheme["status"] = "OPEN"
    return scheme


def _save_to_disk(schemes: list[dict]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    payload = json.dumps(schemes, ensure_ascii=False, indent=2)
    (OUTPUT_DIR / f"schemes_{ts}.json").write_text(payload)
    (OUTPUT_DIR / "latest.json").write_text(payload)
    logger.info(f"📁 {len(schemes)} schemes saved to disk (snapshot={ts})")


def _push(schemes: list[dict]) -> None:
    """Upsert all schemes to Supabase via REST API."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        logger.warning("⚠️  SUPABASE_URL / SUPABASE_SERVICE_KEY not set — skipping push")
        return
    try:
        import httpx
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        }
        pushed = 0
        for i in range(0, len(schemes), 100):
            batch = [
                {k: v for k, v in s.items() if k not in ("raw_data", "verification_sources")}
                for s in schemes[i:i + 100]
            ]
            httpx.post(
                f"{url}/rest/v1/schemes",
                json=batch,
                headers=headers,
                timeout=60,
            ).raise_for_status()
            pushed += len(batch)
        logger.info(f"✅ Pushed {pushed} schemes to Supabase")
    except Exception as e:
        logger.error(f"❌ Supabase push failed: {e}")


def _apply_existing_scores(schemes: list[dict], scores: dict) -> list[dict]:
    """Stamp known verification scores onto schemes — no HTTP calls."""
    for s in schemes:
        sid = s.get("scheme_id", "")
        if sid in scores:
            s["verification_score"] = scores[sid]
            s["verified"] = scores[sid] >= 1
    return schemes


def _run_verification(unique: list[dict], scores: dict) -> dict:
    """
    Call verifier.bulk_verify(), write updated scores to disk,
    and return the new scores dict.
    Called ONLY in mode=verify.
    """
    try:
        from scraper.verifier import bulk_verify
        logger.info(f"[VERIFY] Starting verification for {len(unique)} schemes...")
        vr = bulk_verify(unique, existing_scores=scores)
        new_scores = dict(scores)
        for sid, v in vr.items():
            new_scores[sid] = v.verification_score
            for s in unique:
                if s.get("scheme_id") == sid:
                    s["verification_score"] = v.verification_score
                    s["verified"] = v.verified
        (OUTPUT_DIR / "verification_scores.json").write_text(
            json.dumps(new_scores, indent=2)
        )
        logger.info(
            f"[VERIFY] ✅ Verification complete — "
            f"scores updated for {len(vr)} schemes."
        )
        return new_scores
    except Exception as e:
        logger.warning(f"[VERIFY] ⚠️  Verification skipped: {e}")
        return scores


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

def run_all(mode: str = "auto") -> list[dict]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    existing = _load_existing()
    scores = _load_scores()
    is_weekly = (mode == "full") or (mode == "auto" and _is_weekly_run())

    # ── PHASE 1: SCRAPE ───────────────────────────────────────────────────────
    # Runs for: full | refresh | auto
    # Skipped for: verify (uses what's already on disk)
    all_schemes: list[dict] = []
    errors: list[dict] = []

    if mode != "verify":
        logger.info(f"🕷️  Scraping phase — mode={mode}, weekly={is_weekly}")

        for SC in ALL_SCRAPERS:
            sc = SC()

            # refresh mode (non-weekly): only re-scrape authorities with active schemes.
            # All others carry over from the last full run.
            if mode == "refresh" and not is_weekly:
                has_active = any(
                    s.get("authority") == sc.authority
                    and s.get("status") in ACTIVE_STATUS
                    for s in existing.values()
                )
                if not has_active:
                    all_schemes.extend(
                        v for v in existing.values()
                        if v.get("authority") == sc.authority
                    )
                    continue

            try:
                results = [_recalc_status(r) for r in sc.run()]
                all_schemes.extend(results)
                logger.info(f"✅ {sc.authority} ({sc.city}): {len(results)} schemes")
            except Exception as e:
                errors.append({"scraper": sc.authority, "error": str(e)})
                logger.error(f"❌ {sc.authority}: {e}")
                # Fall back to cached data so we don't lose existing schemes
                all_schemes.extend(
                    v for v in existing.values()
                    if v.get("authority") == sc.authority
                )

    else:
        # verify mode: load from disk, don't re-scrape anything
        logger.info("🔍 Verify mode — loading existing schemes from disk...")
        all_schemes = list(existing.values())

    # Deduplicate by scheme_id
    seen: set = set()
    unique: list[dict] = []
    for s in all_schemes:
        sid = s.get("scheme_id", "")
        if sid and sid not in seen:
            seen.add(sid)
            unique.append(s)

    logger.info(
        f"📊 Scraped {len(unique)} unique schemes "
        f"({len(errors)} scraper errors)"
    )
    if errors:
        logger.warning(f"⚠️  Failed scrapers: {[e['scraper'] for e in errors]}")

    # Stamp known scores without HTTP (safe, fast)
    unique = _apply_existing_scores(unique, scores)

    # ── PHASE 2: SAVE + PUSH (always before any verification) ─────────────────
    # This is the critical ordering fix: data hits Supabase BEFORE verification.
    # If verification later times out, scheme data is already safe.
    if mode != "verify":
        logger.info("💾 Saving scraped data and pushing to Supabase...")
        _save_to_disk(unique)
        _push(unique)
        logger.info("✅ Phase 2 complete — data is live in Supabase.")

    # ── PHASE 3: VERIFICATION ─────────────────────────────────────────────────
    # Runs ONLY when mode=verify (called as a separate step by scrape.yml).
    # This separation means scrape.yml controls whether/when verification runs,
    # with continue-on-error: true so a timeout doesn't block the commit step.
    if mode == "verify":
        logger.info("🔎 Verify phase — running verification engine...")
        _run_verification(unique, scores)
        # Re-save with updated scores so Supabase reflects verified=true flags
        logger.info("💾 Re-saving with updated verification scores...")
        _save_to_disk(unique)
        _push(unique)
        logger.info("✅ Phase 3 complete — verification scores live in Supabase.")

    logger.info(f"🏁 Done — {len(unique)} schemes | mode={mode}")
    return unique


if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "auto"
    result = run_all(mode=mode)
    print(f"\n✅ Done — {len(result)} schemes, mode={mode}")
