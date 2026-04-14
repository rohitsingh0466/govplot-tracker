"""
GovPlot Tracker — SCM Run Logger
==================================
Writes scraper execution results back to Supabase:
  - public.scraper_run_logs    (one row per authority per run)
  - public.scraper_run_summaries (one row per full GitHub Actions run)

Also updates scraper_url_configs.failure_count / last_success_at / last_failure_at
so the admin portal health view stays accurate.

Called from scraper/main.py — never from individual city files.
"""

import logging
import os
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional

logger = logging.getLogger(__name__)


@dataclass
class AuthorityRunResult:
    """
    Populated by main.py after each authority scraper finishes.
    Passed to SCMRunLogger.record().
    """
    authority_code:     str
    authority_id:       Optional[str]  = None
    city:               str            = ""
    url_config_id:      Optional[str]  = None
    url_attempted:      Optional[str]  = None
    url_type:           Optional[str]  = None
    status:             str            = "ok"   # ok | fallback | failed | timeout
    schemes_found:      int            = 0
    schemes_live:       int            = 0
    schemes_static:     int            = 0
    duration_ms:        Optional[int]  = None
    error_type:         Optional[str]  = None
    error_detail:       Optional[str]  = None
    tier_attempted:     Optional[int]  = None
    used_proxy:         bool           = False
    used_playwright:    bool           = False
    scraper_version:    str            = "v4.1"
    github_run_url:     Optional[str]  = None


class SCMRunLogger:
    """
    Instantiated once per scraper run in main.py.
    Collects per-authority results then writes everything to Supabase at the end.
    """

    def __init__(self, run_mode: str = "full", scraper_version: str = "v4.1"):
        self.run_id          = str(uuid.uuid4())
        self.run_mode        = run_mode
        self.scraper_version = scraper_version
        self.started_at      = datetime.now(timezone.utc)
        self.github_run_url  = self._get_github_run_url()
        self.results: List[AuthorityRunResult] = []

        self._supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self._service_key  = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY", "")
        self._enabled      = bool(self._supabase_url and self._service_key)

        if not self._enabled:
            logger.warning("[SCMLog] Supabase not configured — run logs will not be saved")

        logger.info("[SCMLog] Run started — id=%s mode=%s", self.run_id, run_mode)

    # ── Public API ────────────────────────────────────────────────────────────

    def record(self, result: AuthorityRunResult):
        """Add one authority result. Call this after each scraper finishes."""
        result.github_run_url = self.github_run_url
        self.results.append(result)

    def flush(
        self,
        total_schemes:    int          = 0,
        live_schemes:     int          = 0,
        static_schemes:   int          = 0,
        open_schemes:     int          = 0,
        upcoming_schemes: int          = 0,
        cities_with_data: int          = 0,
        alert_sent:       bool         = False,
        notes:            Optional[str] = None,
    ):
        """
        Write everything to Supabase. Call once at the very end of main.py.
        Non-blocking — any error is logged and swallowed so scraper never crashes.
        """
        if not self._enabled:
            return

        # Check httpx is available
        try:
            import httpx
        except ImportError:
            logger.warning("[SCMLog] httpx not installed — skipping run log flush")
            return

        # Wrap entire Supabase write in try/except so a DB error never crashes the scraper
        try:
            completed_at  = datetime.now(timezone.utc)
            duration_secs = int((completed_at - self.started_at).total_seconds())

            headers = {
                "apikey":        self._service_key,
                "Authorization": f"Bearer {self._service_key}",
                "Content-Type":  "application/json",
                "Prefer":        "return=minimal",
            }

            with httpx.Client(timeout=20) as client:

                # ── 1. Write per-authority run logs ───────────────────────────
                log_rows = []
                for r in self.results:
                    log_rows.append({
                        "run_id":          self.run_id,
                        "authority_id":    r.authority_id,
                        "authority_code":  r.authority_code,
                        "city":            r.city or r.authority_code,
                        "url_config_id":   r.url_config_id,
                        "url_attempted":   r.url_attempted,
                        "url_type":        r.url_type,
                        "run_mode":        self.run_mode,
                        "status":          r.status,
                        "schemes_found":   r.schemes_found,
                        "schemes_live":    r.schemes_live,
                        "schemes_static":  r.schemes_static,
                        "duration_ms":     r.duration_ms,
                        "error_type":      r.error_type,
                        "error_detail":    r.error_detail,
                        "tier_attempted":  r.tier_attempted,
                        "used_proxy":      r.used_proxy,
                        "used_playwright": r.used_playwright,
                        "scraper_version": r.scraper_version,
                        "github_run_url":  r.github_run_url,
                        "metadata":        {},
                    })

                if log_rows:
                    resp = client.post(
                        f"{self._supabase_url}/rest/v1/scraper_run_logs",
                        json=log_rows,
                        headers=headers,
                    )
                    if resp.status_code not in (200, 201):
                        logger.warning("[SCMLog] run_logs insert failed: %s", resp.text[:200])
                    else:
                        logger.info("[SCMLog] Wrote %d run log rows", len(log_rows))

                # ── 2. Write run summary ──────────────────────────────────────
                success_count  = sum(1 for r in self.results if r.status == "ok")
                fallback_count = sum(1 for r in self.results if r.status == "fallback")
                failed_count   = sum(1 for r in self.results if r.status in ("failed", "timeout"))

                summary_row = {
                    "run_id":            self.run_id,
                    "run_mode":          self.run_mode,
                    "started_at":        self.started_at.isoformat(),
                    "completed_at":      completed_at.isoformat(),
                    "duration_seconds":  duration_secs,
                    "total_scrapers":    len(self.results),
                    "scrapers_success":  success_count,
                    "scrapers_fallback": fallback_count,
                    "scrapers_failed":   failed_count,
                    "total_schemes":     total_schemes,
                    "live_schemes":      live_schemes,
                    "static_schemes":    static_schemes,
                    "open_schemes":      open_schemes,
                    "upcoming_schemes":  upcoming_schemes,
                    "cities_with_data":  cities_with_data,
                    "alert_sent":        alert_sent,
                    "github_run_url":    self.github_run_url,
                    "scraper_version":   self.scraper_version,
                    "notes":             notes,
                }

                resp = client.post(
                    f"{self._supabase_url}/rest/v1/scraper_run_summaries",
                    json=summary_row,
                    headers=headers,
                )
                if resp.status_code not in (200, 201):
                    logger.warning("[SCMLog] run_summaries insert failed: %s", resp.text[:200])
                else:
                    logger.info(
                        "[SCMLog] Run summary saved — id=%s duration=%ds "
                        "ok=%d fallback=%d failed=%d schemes=%d live=%d",
                        self.run_id, duration_secs,
                        success_count, fallback_count, failed_count,
                        total_schemes, live_schemes,
                    )

                # ── 3. Update URL config health stamps ────────────────────────
                for r in self.results:
                    if not r.url_config_id:
                        continue
                    try:
                        if r.status == "ok":
                            client.patch(
                                f"{self._supabase_url}/rest/v1/scraper_url_configs",
                                params={"id": f"eq.{r.url_config_id}"},
                                json={
                                    "failure_count":   0,
                                    "last_success_at": completed_at.isoformat(),
                                },
                                headers=headers,
                            )
                        elif r.status in ("failed", "timeout"):
                            client.post(
                                f"{self._supabase_url}/rest/v1/rpc/increment_url_failure",
                                json={
                                    "url_id": r.url_config_id,
                                    "reason": f"{r.error_type}: {r.error_detail or ''}".strip(": "),
                                },
                                headers=headers,
                            )
                    except Exception as e:
                        logger.debug("[SCMLog] URL health update skipped: %s", e)

        except Exception as exc:
            logger.warning("[SCMLog] flush() failed: %s — run logs not saved", exc)

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _get_github_run_url() -> Optional[str]:
        repo   = os.getenv("GITHUB_REPOSITORY")
        run_id = os.getenv("GITHUB_RUN_ID")
        if repo and run_id:
            return f"https://github.com/{repo}/actions/runs/{run_id}"
        return None
