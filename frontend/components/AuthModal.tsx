import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getApiErrorMessage(err: any): string {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const firstMessage = detail[0]?.msg;
    if (typeof firstMessage === "string" && firstMessage.trim()) {
      return firstMessage;
    }
  }

  return "Authentication failed. Please check your details and try again.";
}

type AuthUser = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
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

type AuthMode = "login" | "register";

export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (!open) {
      setMode("login");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  function storeAuth(data: AuthResponse) {
    localStorage.setItem("govplot_auth_token", data.access_token);
    localStorage.setItem("govplot_auth_user", JSON.stringify(data.user));
    window.dispatchEvent(new Event("govplot-auth-changed"));
    onClose();
    router.push("/dashboard");
  }

  async function handleEmailSubmit() {
    if (!email || !password || (mode === "register" && (!firstName || !lastName))) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload =
        mode === "login"
          ? { email, password }
          : { email, password, first_name: firstName, last_name: lastName, name: `${firstName} ${lastName}` };
      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const { data } = await axios.post<AuthResponse>(`${API}${endpoint}`, payload);
      storeAuth(data);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${API}/api/v1/auth/google`;
  }

  const TABS = [
    { id: "login" as AuthMode,    label: "Sign In" },
    { id: "register" as AuthMode, label: "Email" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[--ink-900]/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-[--r-2xl] overflow-hidden shadow-[--shadow-xl]">

        {/* Header */}
        <div className="bg-gradient-to-br from-[--teal-900] to-[--teal-700] px-8 pt-8 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white text-sm"
          >
            ✕
          </button>
          <div className="text-2xl mb-2">🏠</div>
          <h2 className="text-[22px] font-[Outfit] font-800 text-white">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-[13px] text-[--teal-300] mt-1">
            Track government plot schemes across India
          </p>
        </div>

        <div className="p-6">
          {/* Mode tabs */}
          <div className="flex bg-[--ink-50] rounded-xl p-1 mb-5">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setMode(id); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-[12.5px] font-semibold transition-all ${
                  mode === id
                    ? "bg-white text-[--teal-700] shadow-[--shadow-sm]"
                    : "text-[--ink-500] hover:text-[--ink-700]"
                }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border-[1.5px] border-[--ink-200] rounded-xl hover:border-[--ink-300] hover:bg-[--ink-50] transition mb-4 text-[13.5px] font-semibold text-[--ink-700]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[--ink-100]" />
            <span className="text-[11px] text-[--ink-400] font-medium">or</span>
            <div className="flex-1 h-px bg-[--ink-100]" />
          </div>

          {/* Email/Password forms */}
          {(mode === "login" || mode === "register") && (
            <div className="space-y-3">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">First Name *</label>
                    <input
                      className="input-field"
                      placeholder="Rahul"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Last Name *</label>
                    <input
                      className="input-field"
                      placeholder="Sharma"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Email *</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="input-field pr-10"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[--ink-400] hover:text-[--ink-700] text-xs"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="mt-5">
            <button onClick={handleEmailSubmit} disabled={loading} className="btn-primary w-full justify-center text-[14px] py-3" style={{ fontFamily: "var(--font-display)" }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Free Account →"}
            </button>
          </div>

          <p className="text-[11.5px] text-[--ink-400] text-center mt-4">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-[--teal-600] underline">Terms</a> and{" "}
            <a href="/privacy" className="text-[--teal-600] underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
