import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import SchemeCard from "../components/SchemeCard";
import StatsBar from "../components/StatsBar";
import FilterBar from "../components/FilterBar";
import AuthModal from "../components/AuthModal";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AdSenseSlot from "../components/AdSenseSlot";
import BrandLoader from "../components/BrandLoader";
import { normalizeScheme } from "../lib/schemeStatus";
import { withMinimumLoader } from "../lib/uiLoading";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MOCK_SCHEMES = [
  { scheme_id: "YEIDA-RPS10-2026", name: "YEIDA Sector 18 Yamuna Expressway Residential Plot Lottery 2026", city: "Greater Noida", authority: "YEIDA", status: "UPCOMING", price_min: 30, price_max: 90, total_plots: 2000, apply_url: "https://yamunaexpresswayauthority.com", open_date: "2026-06-01", close_date: "2026-08-31" },
  { scheme_id: "LDA-ANANT-NAGAR-PHASE3-2025", name: "LDA Anant Nagar Yojna Phase 3 Residential Plot Lottery", city: "Lucknow", authority: "LDA", status: "OPEN", price_min: 40, price_max: 120, total_plots: 600, apply_url: "https://www.ldalucknow.in", close_date: "2026-04-30" },
  { scheme_id: "JDA-JAIPUR-2026", name: "JDA Residential Plot Scheme Lottery Draw 2026", city: "Jaipur", authority: "JDA", status: "UPCOMING", price_min: 25, price_max: 110, total_plots: 1200, apply_url: "https://jda.rajasthan.gov.in" },
  { scheme_id: "ADA-AGRA-2026", name: "ADA Agra Residential Plot Lottery 2026", city: "Agra", authority: "ADA", status: "OPEN", price_min: 32, price_max: 95, total_plots: 450, apply_url: "https://www.adaagra.org.in", close_date: "2026-05-31" },
  { scheme_id: "CIDCO-NAVI-MUMBAI-2026", name: "CIDCO Navi Mumbai Residential Plot Lottery Watch", city: "Navi Mumbai", authority: "CIDCO", status: "UPCOMING", price_min: 35, price_max: 180, total_plots: 900, apply_url: "https://www.cidco.maharashtra.gov.in" },
  { scheme_id: "BDA-BENGALURU-2026", name: "BDA Bengaluru Residential Sites Lottery Watch", city: "Bengaluru", authority: "BDA", status: "ACTIVE", price_min: 45, price_max: 300, total_plots: 650, apply_url: "https://bdabangalore.org" },
];

export default function Home() {
  const router = useRouter();
  const [schemes, setSchemes]     = useState<any[]>([]);
  const [stats, setStats]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [city, setCity]           = useState("");
  const [status, setStatus]       = useState("");
  const [search, setSearch]       = useState("");
  const [authOpen, setAuthOpen]   = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("govplot_auth_user") : null;
    setIsLoggedIn(!!raw);
    function onAuthChange() {
      const r = localStorage.getItem("govplot_auth_user");
      setIsLoggedIn(!!r);
    }
    window.addEventListener("govplot-auth-changed", onAuthChange);
    return () => window.removeEventListener("govplot-auth-changed", onAuthChange);
  }, []);

  useEffect(() => { fetchSchemes(); }, [city]);
  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.openAuth === "1") {
      setAuthOpen(true);
      const q = { ...router.query }; delete q.openAuth;
      router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query]);

  async function fetchSchemes() {
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("govplot_auth_token") : null;
    try {
      const params: any = { limit: 100 };
      if (city) params.city = city;
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await withMinimumLoader(axios.get(`${API}/api/v1/schemes/`, { params, headers }));
      setSchemes(data.length ? data : MOCK_SCHEMES);
    } catch {
      setSchemes(MOCK_SCHEMES);
    } finally { setLoading(false); }
  }

  async function fetchStats() {
    try {
      const { data } = await axios.get(`${API}/api/v1/schemes/stats`);
      setStats(data);
    } catch { setStats(null); }
  }

  const normalizedSchemes = schemes.map(normalizeScheme);
  const derivedStats = useMemo(() => {
    const total = normalizedSchemes.length;
    const open = normalizedSchemes.filter(s => s.status === "OPEN").length;
    const active = normalizedSchemes.filter(s => s.status === "ACTIVE").length;
    const upcoming = normalizedSchemes.filter(s => s.status === "UPCOMING").length;
    const cities = new Set(normalizedSchemes.map(s => s.city).filter(Boolean)).size;
    return { total_schemes: total, open, active, upcoming, closed: Math.max(total - open - active - upcoming, 0), cities_tracked: cities };
  }, [normalizedSchemes]);

  const resolvedStats = stats && stats.total_schemes > 0 ? stats : derivedStats;
  const filtered = normalizedSchemes.filter(s => {
    const matchesStatus = !status || s.status === status;
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()) || s.authority.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const hasBlurred = !isLoggedIn && filtered.some(s => s.blurred || (s.status === "OPEN" || s.status === "ACTIVE"));

  return (
    <>
      <Head>
        <title>GovPlot Tracker — Government Plot Lottery Schemes Across India</title>
        <meta name="description" content="Track government residential plot lottery schemes across India's curated top 20 high-demand cities — Greater Noida, Lucknow, Jaipur, Agra, Delhi, Bengaluru and more." />
        <meta name="keywords" content="government plot scheme India, YEIDA plot scheme, DDA lottery, LDA plot scheme, JDA plot lottery, BDA residential plots, CIDCO lottery, government land scheme alerts, plot lottery India" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="GovPlot Tracker — Government Plot Lottery Schemes Across India" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://govplottracker.com" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <div className="page-container pt-4">
        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_TOP} format="horizontal" label="Top Leaderboard — Homepage" className="mb-4" />
      </div>

      {/* Hero */}
      <section className="page-container page-top-offset pb-14">
        <div className="max-w-3xl">
          <h1 className="text-[38px] sm:text-[52px] lg:text-[60px] font-[Outfit] font-900 text-[--ink-900] mb-5" style={{ lineHeight: "1.08" }}>
            Never miss a{" "}
            <span className="bg-gradient-to-r from-[--teal-600] to-[--teal-400] bg-clip-text text-transparent">Government Plot Lottery</span>{" "}
            in India's highest-demand cities
          </h1>
          <p className="text-[17px] sm:text-[19px] text-[--ink-600] leading-relaxed mb-8 max-w-2xl">
            A curated 20-city watchlist for government residential plot lotteries across YEIDA, LDA, JDA, DDA, BDA, CIDCO, HMDA and other high-demand authorities.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            {!isLoggedIn ? (
              <>
                <button onClick={() => setAuthOpen(true)} className="btn-primary text-[15px] py-3.5 px-7">🔐 Sign Up Free</button>
                <button onClick={() => document.getElementById("scheme-list")?.scrollIntoView({ behavior: "smooth" })} className="btn-secondary text-[15px] py-3.5 px-7">Browse Schemes →</button>
                <Link href="/pricing" className="btn-ghost text-[15px] py-3.5 px-5 text-[--saffron-600] border-[--saffron-200] hover:bg-[--saffron-100]">View Plans</Link>
              </>
            ) : (
              <>
                <button onClick={() => document.getElementById("scheme-list")?.scrollIntoView({ behavior: "smooth" })} className="btn-primary text-[15px] py-3.5 px-7">Browse Schemes →</button>
                <Link href="/dashboard" className="btn-secondary text-[15px] py-3.5 px-7">My Dashboard</Link>
                <Link href="/pricing" className="btn-ghost text-[15px] py-3.5 px-5 text-[--saffron-600] border-[--saffron-200] hover:bg-[--saffron-100]">Upgrade Plan</Link>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {["Free forever", "20-city watchlist", "Weekly full pull", "Lottery schemes only", "Official-source links", "Google sign in"].map(t => (
              <span key={t} className="text-[12.5px] font-semibold text-[--ink-500] bg-[--ink-50] border border-[--ink-100] px-3 py-1.5 rounded-full">{t}</span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-8 max-w-xl">
            {[
              { value: "20", label: "watched cities" },
              { value: resolvedStats.total_schemes || 0, label: "scheme rows" },
              { value: resolvedStats.cities_tracked || 0, label: "cities with data" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-2xl border border-[--ink-100] bg-white p-4 shadow-sm">
                <div className="font-[Outfit] text-[26px] font-900 text-[--teal-700]">{value}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[--ink-400]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="page-container">
        {resolvedStats.total_schemes > 0 && <StatsBar stats={resolvedStats} />}
      </div>

      {/* Sign up to see open/active banner — anonymous only */}
      {!isLoggedIn && (
        <div className="page-container mb-6">
          <div className="bg-gradient-to-r from-[--teal-700] to-[--teal-900] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">🔓</div>
              <div>
                <h2 className="text-[18px] font-[Outfit] font-800 text-white mb-1">Sign up to view Open &amp; Active schemes</h2>
                <p className="text-[13px] text-[--teal-300]/90 leading-relaxed">
                  Free account gives you full access to all scheme details — OPEN, ACTIVE, UPCOMING and CLOSED.
                </p>
              </div>
            </div>
            <button onClick={() => setAuthOpen(true)} className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[14px] py-3 px-7 flex-shrink-0" style={{ fontFamily: "var(--font-display)" }}>
              Create Free Account →
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      <section className="page-container pb-14">
        <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-[28px] font-[Outfit] font-800 text-white mt-2">Three steps to never miss a lottery scheme</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "🤖", title: "We watch the top 20", desc: "The scraper now focuses on the highest-demand plot lottery markets, ranked by scheme frequency, infrastructure growth, and buyer demand." },
              { step: "02", icon: "✅", title: "We keep the list useful", desc: "Scheme data is cleaned into one format with status, dates, prices, plots, and official-source links where available." },
              { step: "03", icon: "🔔", title: "You act before windows close", desc: "Pro and Premium alerts help you move when a watched city opens or changes a lottery scheme window." },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[--teal-700]/40 border border-[--teal-600]/30 flex items-center justify-center font-[Outfit] font-800 text-[--teal-400] text-[13px]">{step}</div>
                <div>
                  <div className="text-2xl mb-2">{icon}</div>
                  <h3 className="text-white font-[Outfit] font-700 text-[15px] mb-1">{title}</h3>
                  <p className="text-white/90 text-[13px] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scheme listing */}
      <section id="scheme-list" className="page-container pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[26px] font-[Outfit] font-800 text-[--ink-900] mt-1">
              {filtered.length} scheme{filtered.length !== 1 ? "s" : ""} found
            </h2>
            {!isLoggedIn && (
              <p className="text-[13px] text-[--ink-500] mt-1">
                <button onClick={() => setAuthOpen(true)} className="text-[--teal-600] font-semibold underline">Sign up free</button> to view Open & Active scheme details
              </p>
            )}
          </div>
          <Link href="/schemes" className="btn-ghost text-[13px]">View all →</Link>
        </div>

        <FilterBar city={city} setCity={setCity} status={status} setStatus={setStatus} search={search} setSearch={setSearch} />

        {loading ? (
          <div className="space-y-6">
            <BrandLoader compact label="Loading the latest lottery schemes..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <div key={i} className="h-72 skeleton" />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-[Outfit] font-700 text-[--ink-700] mb-2">No schemes found</h3>
            <p className="text-[--ink-500]">Try a different city, status filter, or keyword.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.slice(0, 6).map(s => <SchemeCard key={s.scheme_id} scheme={s} onSignUpClick={() => setAuthOpen(true)} />)}
            </div>
            <div className="my-8">
              <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_MID} format="horizontal" label="Mid-page — Schemes List" />
            </div>
            {filtered.length > 6 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.slice(6).map(s => <SchemeCard key={s.scheme_id} scheme={s} onSignUpClick={() => setAuthOpen(true)} />)}
              </div>
            )}
          </>
        )}
      </section>

      {/* Upgrade CTA */}
      <section className="page-container pb-16">
        <div className="card p-8 sm:p-12 text-center bg-gradient-to-br from-[--saffron-100] to-white border-[--saffron-200]">
          <h2 className="text-[28px] font-[Outfit] font-800 text-[--ink-900] mt-2 mb-3">
            Upgrade to stay updated with active scheme alerts
          </h2>
          <p className="text-[15px] text-[--ink-600] mb-7 max-w-lg mx-auto">
            Pro gives you Email + Telegram alerts for 2 watched cities. Premium unlocks WhatsApp and alerts across the full 20-city watchlist.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/pricing" className="btn-saffron text-[15px] py-3 px-8">See Pricing Plans →</Link>
            {!isLoggedIn && <button onClick={() => setAuthOpen(true)} className="btn-secondary text-[15px] py-3 px-8">Start Free</button>}
          </div>
        </div>
      </section>

      <div className="page-container pb-8">
        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_BTM} format="horizontal" label="Bottom Leaderboard" />
      </div>

      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
