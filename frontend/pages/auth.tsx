import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("govplot_auth_token");
    if (token) {
      const next = typeof router.query.next === "string" ? router.query.next : "/dashboard";
      router.replace(next);
    }
  }, [router, router.query.next]);

  function handleGoogleLogin() {
    const next = typeof router.query.next === "string" ? router.query.next : "/dashboard";
    const params = new URLSearchParams({ next });
    if (router.query.openAlert === "1") params.set("action", "open-alert");
    window.location.href = `${API}/api/v1/auth/google?${params.toString()}`;
  }

  return (
    <>
      <Head>
        <title>Sign In — GovPlot Tracker</title>
        <meta name="description" content="Sign in to GovPlot Tracker with Google to manage dashboard access, alerts, and subscriptions across 100+ Indian cities." />
      </Head>

      <div className="min-h-screen flex">
        <div className="hidden lg:flex flex-col flex-1 bg-gradient-to-br from-[--teal-900] to-[--ink-900] p-12 justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[--teal-600]/30 border border-[--teal-500]/30 flex items-center justify-center text-xl">🏠</div>
            <span className="text-white font-[Outfit] font-800 text-lg">GovPlot Tracker</span>
          </Link>

          <div>
            <blockquote className="text-[--teal-300]/90 text-[18px] leading-relaxed mb-6 font-light">
              "I got the YEIDA allotment because GovPlot Tracker alerted me the moment applications opened. It was only a 3-day window — I would have missed it."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[--teal-700] flex items-center justify-center text-white font-bold">R</div>
              <div>
                <p className="text-white text-[13.5px] font-semibold">Rohit Verma</p>
                <p className="text-[--teal-400] text-[12px]">Plot allottee, Noida / Yamuna Expressway</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "100+", label: "Cities" },
              { value: "50+", label: "Authorities" },
              { value: "Google", label: "Sign in" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-[28px] font-[Outfit] font-900 text-white">{value}</p>
                <p className="text-[11px] text-[--teal-400] uppercase tracking-wider font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 lg:max-w-lg flex flex-col justify-center p-6 sm:p-12">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[--teal-600] to-[--teal-800] flex items-center justify-center text-base">🏠</div>
            <span className="font-[Outfit] font-800 text-[--teal-700]">GovPlot Tracker</span>
          </Link>

          <div className="mb-7">
            <h1 className="text-[28px] font-[Outfit] font-900 text-[--ink-900] mb-1.5">Sign in with Google</h1>
            <p className="text-[14px] text-[--ink-500]">Use your Google account to manage alerts across 100+ cities, subscriptions, and dashboard access.</p>
          </div>

          <div className="rounded-2xl border border-[--ink-100] bg-[--ink-50] p-4 text-[13px] leading-relaxed text-[--ink-600]">
            We keep account access simple: Google sign in only, with your dashboard and alert permissions tied to the same account.
          </div>

          <button onClick={handleGoogleLogin}
            className="w-full mt-6 flex items-center justify-center gap-3 py-3 border-[1.5px] border-[--ink-200] rounded-xl hover:border-[--ink-300] hover:bg-[--ink-50] transition text-[14px] font-semibold text-[--ink-700]"
            style={{ fontFamily: "var(--font-display)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

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
