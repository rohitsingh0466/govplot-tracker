import { useMemo, useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AuthUser = {
  id: number;
  email: string;
  name?: string | null;
  is_premium: boolean;
  subscription_tier: string;
  subscription_status: string;
  telegram_username?: string | null;
};

type AuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
};

export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(
    () => (mode === "login" ? "Sign in to GovPlot Tracker" : "Create your GovPlot account"),
    [mode]
  );

  if (!open) return null;

  async function submit() {
    if (!email || !password || (mode === "register" && !name)) {
      setError("Please fill in the required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload =
        mode === "login"
          ? { email, password }
          : { email, password, name, phone: phone || null };

      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const { data } = await axios.post<AuthResponse>(`${API}${endpoint}`, payload);

      localStorage.setItem("govplot_auth_token", data.access_token);
      localStorage.setItem("govplot_auth_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("govplot-auth-changed"));
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "We could not complete that request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 p-8 text-white">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 rounded-full p-2 text-white transition hover:bg-white/10"
            aria-label="Close auth modal"
          >
            ✕
          </button>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
            v1.1 Access
          </p>
          <h2 className="text-3xl font-black leading-tight">{title}</h2>
          <p className="mt-3 text-sm text-blue-100">
            Start with the free tier now. Pro billing and Telegram linking are the next v1.1 steps.
          </p>
        </div>

        <div className="p-8">
          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => setMode("login")}
              className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Rohit Singh"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-900">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="+91 98xxxxxx"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-900">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                placeholder="Minimum 8 characters"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 py-3.5 text-sm font-bold text-white transition hover:from-blue-700 hover:to-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Free Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
