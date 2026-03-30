import { useEffect, useState } from "react";
import BrandLoader from "./BrandLoader";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AuthModal({
  open,
  onClose,
  returnAction,
}: {
  open: boolean;
  onClose: () => void;
  returnAction?: "open-alert";
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  function handleGoogleLogin() {
    setLoading(true);
    const next = `${window.location.pathname}${window.location.search}`;
    const params = new URLSearchParams({ next });
    if (returnAction) params.set("action", returnAction);
    window.location.href = `${API}/api/v1/auth/google?${params.toString()}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[--ink-900]/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-[--r-2xl] overflow-hidden shadow-[--shadow-xl]">
        <div className="bg-gradient-to-br from-[--teal-900] to-[--teal-700] px-8 pt-8 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white text-sm"
          >
            ✕
          </button>
          <div className="text-2xl mb-2">🏠</div>
          <h2 className="text-[22px] font-[Outfit] font-800 text-white">
            Sign in with Google
          </h2>
          <p className="text-[13px] text-[--teal-300] mt-1">
            Use your Google account to access alerts, dashboard updates, and subscriptions.
          </p>
        </div>

        <div className="relative p-6">
          {loading && <BrandLoader overlay compact label="Redirecting to Google..." />}
          <div className="rounded-2xl border border-[--ink-100] bg-[--ink-50] p-4 text-[13px] leading-relaxed text-[--ink-600]">
            Email and password sign in has been removed. Google sign in is now the only account access method.
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-5 w-full flex items-center justify-center gap-3 py-3 px-4 border-[1.5px] border-[--ink-200] rounded-xl hover:border-[--ink-300] hover:bg-[--ink-50] transition text-[13.5px] font-semibold text-[--ink-700] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? "Redirecting to Google..." : "Continue with Google"}
          </button>

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
