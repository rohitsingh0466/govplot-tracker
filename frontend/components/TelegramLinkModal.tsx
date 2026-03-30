import { useEffect, useState } from "react";
import axios from "axios";
import BrandLoader from "./BrandLoader";
import { withMinimumLoader } from "../lib/uiLoading";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type TelegramLinkResponse = {
  link_token: string;
  bot_username: string;
  deep_link_url: string;
  expires_in: number;
};

type TelegramStatus = {
  is_linked: boolean;
  telegram_username?: string | null;
  deep_link_url?: string | null;
  bot_username?: string | null;
};

type AuthUser = {
  id: number;
  email: string;
  name?: string | null;
  is_premium: boolean;
  subscription_tier: string;
  subscription_status: string;
  telegram_username?: string | null;
};

export default function TelegramLinkModal({
  open,
  onClose,
  onLinked,
}: {
  open: boolean;
  onClose: () => void;
  onLinked: (user: AuthUser) => void;
}) {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const token = window.localStorage.getItem("govplot_auth_token");
    if (!token) {
      setError("Please sign in first.");
      return;
    }

    setLoading(true);
    setError("");
    withMinimumLoader(
      axios.get<TelegramStatus>(`${API}/api/v1/telegram/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    )
      .then((response) => setStatus(response.data))
      .catch((err) => setError(err?.response?.data?.detail || "Could not load Telegram status."))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  async function generateLink() {
    const token = window.localStorage.getItem("govplot_auth_token");
    if (!token) {
      setError("Please sign in first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await withMinimumLoader(
        axios.post<TelegramLinkResponse>(
          `${API}/api/v1/telegram/link`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      setStatus({
        is_linked: false,
        bot_username: response.data.bot_username,
        deep_link_url: response.data.deep_link_url,
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not create a Telegram link.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    const token = window.localStorage.getItem("govplot_auth_token");
    if (!token) {
      setError("Please sign in first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const statusResponse = await withMinimumLoader(
        axios.get<TelegramStatus>(`${API}/api/v1/telegram/status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      setStatus(statusResponse.data);

      if (statusResponse.data.is_linked) {
        const me = await withMinimumLoader(
          axios.get<AuthUser>(`${API}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
        window.localStorage.setItem("govplot_auth_user", JSON.stringify(me.data));
        window.dispatchEvent(new Event("govplot-auth-changed"));
        onLinked(me.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not refresh Telegram status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-sky-200 via-cyan-100 to-white p-8">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 rounded-full p-2 text-slate-900 transition hover:bg-black/5"
            aria-label="Close Telegram modal"
          >
            ✕
          </button>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">
            Telegram Alerts
          </p>
          <h2 className="text-3xl font-black leading-tight text-slate-950">
            Link your Telegram account
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Generate a secure bot link, open Telegram, tap start, then come back here to confirm the connection.
          </p>
        </div>

        <div className="relative p-8">
          {loading && <BrandLoader overlay compact label="Working on Telegram setup..." />}
          {status?.is_linked ? (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-6">
              <h3 className="text-2xl font-black text-slate-950">Telegram connected</h3>
              <p className="mt-3 text-sm text-slate-700">
                {status.telegram_username ? `Linked as @${status.telegram_username}.` : "Your Telegram chat is linked."}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-xl font-black text-slate-950">How it works</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  1. Generate your secure link.
                  2. Open the bot in Telegram.
                  3. Tap Start.
                  4. Come back here and refresh status.
                </p>
              </div>

              {status?.deep_link_url && (
                <div className="mt-5 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Ready to link</p>
                  <a
                    href={status.deep_link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Open Telegram Bot
                  </a>
                  <p className="mt-3 text-xs text-slate-600">
                    Bot: @{status.bot_username || "your_bot"}
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!status?.is_linked && (
              <button
                onClick={generateLink}
                disabled={loading}
                className="flex-1 rounded-2xl bg-sky-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : status?.deep_link_url ? "Generate Fresh Link" : "Generate Telegram Link"}
              </button>
            )}
            <button
              onClick={refreshStatus}
              disabled={loading}
              className="flex-1 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
