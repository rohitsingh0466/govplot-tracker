import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";
import ProUpgradeModal from "./ProUpgradeModal";
import TelegramLinkModal from "./TelegramLinkModal";

type AuthUser = {
  id: number;
  name?: string | null;
  email: string;
  subscription_tier: string;
  telegram_username?: string | null;
};

export default function Navbar({ onAlertClick }: { onAlertClick: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    function loadUser() {
      const raw = window.localStorage.getItem("govplot_auth_user");
      setUser(raw ? JSON.parse(raw) : null);
    }

    loadUser();
    window.addEventListener("govplot-auth-changed", loadUser);
    return () => window.removeEventListener("govplot-auth-changed", loadUser);
  }, []);

  function signOut() {
    window.localStorage.removeItem("govplot_auth_token");
    window.localStorage.removeItem("govplot_auth_user");
    setUser(null);
    window.dispatchEvent(new Event("govplot-auth-changed"));
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 shadow-sm backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-base font-bold text-white shadow-lg sm:h-10 sm:w-10 sm:text-lg">
                🏠
              </div>
              <div className="flex flex-col">
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-base font-bold text-transparent sm:text-lg">
                  GovPlot
                </span>
                <span className="hidden text-xs font-medium text-slate-500 sm:block">Tracker</span>
              </div>
            </div>

            <div className="hidden items-center gap-8 text-sm font-medium md:flex">
              <a href="/" className="text-slate-600 transition hover:text-blue-600">
                Schemes
              </a>
              <a href="/cities" className="text-slate-600 transition hover:text-blue-600">
                Cities
              </a>
              <a href="/about" className="text-slate-600 transition hover:text-blue-600">
                About
              </a>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 transition hover:bg-slate-100 md:hidden"
            >
              <div className="flex h-6 w-6 flex-col items-center justify-center">
                <span className={`block h-0.5 w-5 bg-slate-600 transition-transform ${mobileMenuOpen ? "translate-y-1 rotate-45" : "-translate-y-1"}`}></span>
                <span className={`block h-0.5 w-5 bg-slate-600 transition-opacity ${mobileMenuOpen ? "opacity-0" : "opacity-100"}`}></span>
                <span className={`block h-0.5 w-5 bg-slate-600 transition-transform ${mobileMenuOpen ? "-translate-y-1 -rotate-45" : "translate-y-1"}`}></span>
              </div>
            </button>

            <div className="hidden items-center gap-3 sm:flex">
              {user ? (
                <>
                  <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-slate-700">
                    {user.name || user.email}
                    <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                      {user.subscription_tier}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  Sign in
                </button>
              )}
              {user && user.subscription_tier !== "pro" && (
                <button
                  onClick={() => setProOpen(true)}
                  className="rounded-full bg-gradient-to-r from-amber-300 to-orange-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-amber-400 hover:to-orange-400"
                >
                  Upgrade to Pro
                </button>
              )}
              {user && !user.telegram_username && (
                <button
                  onClick={() => setTelegramOpen(true)}
                  className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-900 transition hover:bg-sky-100"
                >
                  Connect Telegram
                </button>
              )}
              <button
                onClick={onAlertClick}
                className="transform rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl sm:px-6 sm:py-2.5"
              >
                🔔 Free Alerts
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="mt-4 border-t border-slate-100 pb-4 pt-4 md:hidden">
              <div className="flex flex-col gap-4">
                <a href="/" className="font-medium text-slate-600 transition hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
                  Schemes
                </a>
                <a href="/cities" className="font-medium text-slate-600 transition hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
                  Cities
                </a>
                <a href="/about" className="font-medium text-slate-600 transition hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
                  About
                </a>
                {user ? (
                  <>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      {user.name || user.email}
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="rounded-full border border-slate-200 px-6 py-3 text-left font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setAuthOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-full border border-slate-200 px-6 py-3 text-left font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Sign in
                    </button>
                )}
                {user && user.subscription_tier !== "pro" && (
                  <button
                    onClick={() => {
                      setProOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-full bg-gradient-to-r from-amber-300 to-orange-300 px-6 py-3 text-left font-semibold text-slate-950 transition hover:from-amber-400 hover:to-orange-400"
                  >
                    Upgrade to Pro
                  </button>
                )}
                {user && !user.telegram_username && (
                  <button
                    onClick={() => {
                      setTelegramOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-full border border-sky-200 bg-sky-50 px-6 py-3 text-left font-semibold text-sky-900 transition hover:bg-sky-100"
                  >
                    Connect Telegram
                  </button>
                )}
                <button
                  onClick={() => {
                    onAlertClick();
                    setMobileMenuOpen(false);
                  }}
                  className="transform rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-left font-semibold text-white shadow-lg transition hover:scale-105 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                >
                  🔔 Get Free Alerts
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProUpgradeModal open={proOpen} onClose={() => setProOpen(false)} onUpgraded={(nextUser) => setUser(nextUser)} />
      <TelegramLinkModal open={telegramOpen} onClose={() => setTelegramOpen(false)} onLinked={(nextUser) => setUser(nextUser)} />
    </>
  );
}
