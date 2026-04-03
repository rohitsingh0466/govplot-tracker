import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AuthModal from "./AuthModal";
import ProUpgradeModal from "./ProUpgradeModal";
import TelegramLinkModal from "./TelegramLinkModal";

type AuthUser = {
  id: number;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  subscription_tier: string;
  telegram_username?: string | null;
};

export default function Navbar({ onAlertClick }: { onAlertClick?: () => void }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function loadUser() {
      try {
        const raw = window.localStorage.getItem("govplot_auth_user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch { setUser(null); }
    }
    loadUser();
    window.addEventListener("govplot-auth-changed", loadUser);
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("govplot-auth-changed", loadUser);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [router.pathname]);

  function signOut() {
    localStorage.removeItem("govplot_auth_token");
    localStorage.removeItem("govplot_auth_user");
    setUser(null);
    window.dispatchEvent(new Event("govplot-auth-changed"));
    router.push("/");
  }

  const displayName = user?.first_name || user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "";
  const tier = user?.subscription_tier || "free";
  const isPaid = tier === "pro" || tier === "premium";

  const TIER_BADGE: Record<string, string> = {
    free: "bg-[--ink-100] text-[--ink-500]",
    pro: "bg-[--teal-100] text-[--teal-700]",
    premium: "bg-[--saffron-100] text-[--saffron-600]",
  };

  const NAV_LINKS = [
    { href: "/schemes", label: "Schemes" },
    { href: "/cities",  label: "Cities" },
    { href: "/pricing", label: "Pricing", highlight: true },
    { href: "/blog",    label: "Blog" },
    { href: "/about",   label: "About" },
  ];

  const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(href + "/");

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-lg shadow-[0_2px_20px_rgba(12,20,32,0.10)] border-b border-[--ink-100]" : "bg-white/80 backdrop-blur-md border-b border-transparent"}`}>
        <div className="page-container">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[--teal-600] to-[--teal-800] flex items-center justify-center shadow-[--shadow-teal] text-lg">🏠</div>
              <div className="flex flex-col leading-none">
                <span className="font-[Outfit] font-800 text-[15px] bg-gradient-to-r from-[--teal-700] to-[--teal-500] bg-clip-text text-transparent">GovPlot</span>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-[--ink-400]">Tracker</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label, highlight }) => (
                <Link key={href} href={href}
                  className={`relative px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-all duration-150 ${isActive(href) ? "bg-[--teal-100] text-[--teal-700]" : highlight ? "text-[--saffron-600] hover:bg-[--saffron-100]" : "text-[--ink-600] hover:text-[--ink-900] hover:bg-[--ink-50]"}`}
                  style={{ fontFamily: "var(--font-display)" }}>
                  {label}
                  {highlight && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[--saffron-500]" />}
                </Link>
              ))}
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 bg-[--ink-50] border border-[--ink-100] rounded-full px-3 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[--teal-500] to-[--teal-700] flex items-center justify-center text-white text-[10px] font-bold">
                      {displayName[0]?.toUpperCase()}
                    </div>
                    <span className="text-[13px] font-semibold text-[--ink-700]">{displayName}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${TIER_BADGE[tier] || TIER_BADGE.free}`}>{tier}</span>
                  </div>
                  <Link href="/dashboard" className="btn-secondary text-[13px] py-2 px-4">Dashboard</Link>
                  <button onClick={signOut} className="btn-ghost text-[13px] py-2 px-3">Sign out</button>
                  {!isPaid && (
                    <button onClick={() => setProOpen(true)} className="btn-saffron text-[13px] py-2 px-4">✦ Upgrade</button>
                  )}
                </>
              ) : (
                <>
                  <button onClick={() => setAuthOpen(true)} className="btn-ghost text-[13px] py-2">Sign in</button>
                  <button onClick={() => setAuthOpen(true)} className="btn-primary text-[13px] py-2 px-5">Get Started →</button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(v => !v)} className="md:hidden p-2 rounded-lg hover:bg-[--ink-50] transition" aria-label="Toggle menu">
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-[--ink-700] rounded transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                <span className={`block h-0.5 bg-[--ink-700] rounded transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 bg-[--ink-700] rounded transition-all duration-200 ${mobileOpen ? "-rotate-45 -translate-y-[9px]" : ""}`} />
              </div>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-[--ink-100] py-4 space-y-1 animate-slide-down">
              {NAV_LINKS.map(({ href, label, highlight }) => (
                <Link key={href} href={href}
                  className={`block px-4 py-3 rounded-xl text-[14px] font-semibold transition-all ${isActive(href) ? "bg-[--teal-100] text-[--teal-700]" : highlight ? "text-[--saffron-600]" : "text-[--ink-700] hover:bg-[--ink-50]"}`}
                  style={{ fontFamily: "var(--font-display)" }}>
                  {label}
                </Link>
              ))}
              <div className="pt-3 flex flex-col gap-2 px-1">
                {user ? (
                  <>
                    <div className="bg-[--ink-50] border border-[--ink-100] rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[--teal-500] to-[--teal-700] flex items-center justify-center text-white text-sm font-bold">{displayName[0]?.toUpperCase()}</div>
                      <div>
                        <p className="text-[13px] font-bold text-[--ink-900]">{displayName}</p>
                        <p className="text-[11px] text-[--ink-500]">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/dashboard" className="btn-secondary w-full justify-center">Dashboard</Link>
                    {!isPaid && (
                      <button onClick={() => { setProOpen(true); setMobileOpen(false); }} className="btn-saffron w-full justify-center">✦ Upgrade to Pro</button>
                    )}
                    <button onClick={signOut} className="btn-ghost w-full justify-center text-red-600">Sign out</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }} className="btn-secondary w-full justify-center">Sign in</button>
                    <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }} className="btn-primary w-full justify-center">Get Started →</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProUpgradeModal open={proOpen} onClose={() => setProOpen(false)} onUpgraded={(u) => setUser(u)} />
      <TelegramLinkModal open={telegramOpen} onClose={() => setTelegramOpen(false)} onLinked={(u) => setUser(u)} />
    </>
  );
}
