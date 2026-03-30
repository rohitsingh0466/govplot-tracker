import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
type AuthMode = "login" | "register";

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

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode]           = useState<AuthMode>("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("govplot_auth_token");
    if (token) router.push("/dashboard");
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const { token, user } = router.query;
    if (token && user) {
      try {
        localStorage.setItem("govplot_auth_token", token as string);
        localStorage.setItem("govplot_auth_user", decodeURIComponent(user as string));
        window.dispatchEvent(new Event("govplot-auth-changed"));
        router.push("/dashboard");
      } catch {}
    }
  }, [router.query]);

  function storeAuth(data: any) {
    localStorage.setItem("govplot_auth_token", data.access_token);
    localStorage.setItem("govplot_auth_user", JSON.stringify(data.user));
    window.dispatchEvent(new Event("govplot-auth-changed"));
    router.push("/dashboard");
  }

  async function handleEmailSubmit() {
    if (!email || !password || (mode === "register" && (!firstName || !lastName))) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true); setError("");
    try {
      const payload = mode === "login"
        ? { email, password }
        : { email, password, first_name: firstName, last_name: lastName, name: `${firstName} ${lastName}` };
      const { data } = await axios.post(`${API}/api/v1/auth/${mode === "login" ? "login" : "register"}`, payload);
      storeAuth(data);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally { setLoading(false); }
  }

  const TABS: { id: AuthMode; label: string }[] = [
    { id: "login",    label: "Sign In" },
    { id: "register", label: "Register" },
  ];

  return (
    <>
      <Head>
        <title>Sign In — GovPlot Tracker</title>
        <meta name="description" content="Sign in or create your GovPlot Tracker account to get real-time government plot scheme alerts." />
      </Head>

      <div className="min-h-screen flex">
        {/* Left panel — branding */}
        <div className="hidden lg:flex flex-col flex-1 bg-gradient-to-br from-[--teal-900] to-[--ink-900] p-12 justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[--teal-600]/30 border border-[--teal-500]/30 flex items-center justify-center text-xl">🏠</div>
            <span className="text-white font-[Outfit] font-800 text-lg">GovPlot Tracker</span>
          </Link>

          <div>
            <blockquote className="text-[--teal-300]/90 text-[18px] leading-relaxed mb-6 font-light">
              "I got the GNIDA allotment because GovPlot Tracker alerted me the moment applications opened. It was only a 3-day window."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[--teal-700] flex items-center justify-center text-white font-bold">R</div>
              <div>
                <p className="text-white text-[13.5px] font-semibold">Rohit Verma</p>
                <p className="text-[--teal-400] text-[12px]">Plot allottee, Greater Noida</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "9",    label: "Cities" },
              { value: "24+",  label: "Active schemes" },
              { value: "Free", label: "Base plan" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-[28px] font-[Outfit] font-900 text-white">{value}</p>
                <p className="text-[11px] text-[--teal-400] uppercase tracking-wider font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 lg:max-w-lg flex flex-col justify-center p-6 sm:p-12">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[--teal-600] to-[--teal-800] flex items-center justify-center text-base">🏠</div>
            <span className="font-[Outfit] font-800 text-[--teal-700]">GovPlot Tracker</span>
          </Link>

          <div className="mb-7">
            <h1 className="text-[28px] font-[Outfit] font-900 text-[--ink-900] mb-1.5">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-[14px] text-[--ink-500]">
              {mode === "login" ? "Sign in to access your scheme alerts and dashboard." : "Join 10,000+ plot buyers tracking schemes across India."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-[--ink-50] border border-[--ink-100] rounded-xl p-1 mb-6">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setMode(id); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                  mode === id ? "bg-white text-[--teal-700] shadow-sm" : "text-[--ink-500] hover:text-[--ink-800]"
                }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            onClick={() => { window.location.href = `${API}/api/v1/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 py-3 border-[1.5px] border-[--ink-200] rounded-xl hover:border-[--ink-300] hover:bg-[--ink-50] transition mb-5 text-[14px] font-semibold text-[--ink-700]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[--ink-100]" />
            <span className="text-[11px] text-[--ink-400] font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[--ink-100]" />
          </div>

          {/* Email/Password */}
          {(mode === "login" || mode === "register") && (
            <div className="space-y-4">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">First Name *</label>
                    <input className="input-field" placeholder="Rahul" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Last Name *</label>
                    <input className="input-field" placeholder="Sharma" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Email *</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11.5px] font-bold text-[--ink-600] uppercase tracking-wider">Password *</label>
                  {mode === "login" && (
                    <button className="text-[12px] text-[--teal-600] font-medium">Forgot?</button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="input-field pr-12"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[--ink-400] hover:text-[--ink-700] font-medium"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700 font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="mt-6">
            <button onClick={handleEmailSubmit} disabled={loading} className="btn-primary w-full justify-center text-[15px] py-3.5" style={{ fontFamily: "var(--font-display)" }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Free Account →"}
            </button>
          </div>

          <p className="text-[12px] text-[--ink-400] text-center mt-5">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-[--teal-600] underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-[--teal-600] underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
