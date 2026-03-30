import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import SchemeCard from "../components/SchemeCard";
import StatsBar from "../components/StatsBar";
import FilterBar from "../components/FilterBar";
import AlertModal from "../components/AlertModal";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AdSenseSlot from "../components/AdSenseSlot";
import BrandLoader from "../components/BrandLoader";
import { normalizeScheme } from "../lib/schemeStatus";
import { withMinimumLoader } from "../lib/uiLoading";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MOCK_SCHEMES = [
  { scheme_id: "LDA-abc1",   name: "LDA Gomti Nagar Extension Plot Scheme 2025",       city: "Lucknow",   authority: "LDA",   status: "UPCOMING", price_min: 35, price_max: 120, total_plots: 800,  apply_url: "https://lda.up.nic.in",     open_date: "2025-04-01" },
  { scheme_id: "BDA-abc1",   name: "BDA Arkavathy Layout 2E Residential Sites",        city: "Bangalore", authority: "BDA",   status: "ACTIVE",   price_min: 45, price_max: 300, total_plots: 6588, apply_url: "https://bdabangalore.org",  close_date: "2025-03-31", area_sqft_min: 600, area_sqft_max: 4800 },
  { scheme_id: "GNIDA-abc1", name: "Greater Noida Residential Plot Scheme 2025",       city: "Noida",     authority: "GNIDA", status: "OPEN",     price_min: 30, price_max: 150, total_plots: 1100, apply_url: "https://greaternoida.in",   close_date: "2025-03-15" },
  { scheme_id: "YEIDA-abc1", name: "YEIDA Plot Scheme Sector 18 Expressway",           city: "Noida",     authority: "YEIDA", status: "UPCOMING", price_min: 15, price_max: 80,  total_plots: 2000, apply_url: "https://yamunaexpresswayauthority.com", open_date: "2025-06-01" },
  { scheme_id: "MHADA-abc1", name: "MHADA Mumbai Board Lottery 2025 — Konkan Region", city: "Mumbai",    authority: "MHADA", status: "OPEN",     price_min: 40, price_max: 800, total_plots: 4000, apply_url: "https://mhada.gov.in",      close_date: "2025-03-10" },
  { scheme_id: "HSVP-abc1",  name: "HSVP Affordable Residential Plot Scheme Pataudi", city: "Gurgaon",   authority: "HSVP",  status: "ACTIVE",   price_min: 25, price_max: 90,  total_plots: 850,  apply_url: "https://hsvphry.gov.in",    close_date: "2025-10-14", area_sqft_min: 900, area_sqft_max: 2700 },
];

export default function Home() {
  const router = useRouter();
  const [schemes, setSchemes]   = useState<any[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [city, setCity]         = useState("");
  const [status, setStatus]     = useState("");
  const [search, setSearch]     = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => { fetchSchemes(); }, [city]);
  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (!router.isReady || router.query.openAlert !== "1") return;
    setAlertOpen(true);
    const nextQuery = { ...router.query };
    delete nextQuery.openAlert;
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  }, [router]);

  async function fetchSchemes() {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (city) params.city = city;
      const { data } = await withMinimumLoader(axios.get(`${API}/api/v1/schemes/`, { params }));
      setSchemes(data.length ? data : MOCK_SCHEMES);
    } catch {
      setSchemes(MOCK_SCHEMES);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const { data } = await axios.get(`${API}/api/v1/schemes/stats`);
      setStats(data);
    } catch {
      setStats({ total_schemes: 24, open: 6, active: 8, upcoming: 5, closed: 5, cities_tracked: 9 });
    }
  }

  const normalizedSchemes = schemes.map(normalizeScheme);

  const filtered = normalizedSchemes.filter((s) => {
    const matchesStatus = !status || s.status === status;
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.authority.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <Head>
        <title>GovPlot Tracker — Government Plot Schemes India</title>
        <meta name="description" content="Track government residential plot schemes across Lucknow, Bangalore, Noida, Gurgaon, Hyderabad, Pune, Mumbai and more with real-time alerts." />
        <meta name="keywords" content="government plot scheme India, LDA plot scheme, BDA residential plots, government land scheme alerts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="GovPlot Tracker — Government Plot Schemes India" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://govplottracker.com" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar onAlertClick={() => setAlertOpen(true)} />

      {/* ── Top Ad Banner ──────────────────────────────────── */}
      <div className="page-container pt-4">
        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_TOP} format="horizontal" label="Top Leaderboard — Homepage" className="mb-4" />
      </div>

      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="page-container pt-10 pb-14">
        <div className="max-w-3xl">
          <h1 className="text-[38px] sm:text-[52px] lg:text-[60px] font-[Outfit] font-900 text-[--ink-900] mb-5" style={{ lineHeight: "1.08" }}>
            Never miss a{" "}
            <span className="bg-gradient-to-r from-[--teal-600] to-[--teal-400] bg-clip-text text-transparent">
              Government Plot
            </span>{" "}
            Scheme Again
          </h1>
          <p className="text-[17px] sm:text-[19px] text-[--ink-600] leading-relaxed mb-8 max-w-2xl">
            Real-time monitoring of LDA, BDA, GNIDA, HSVP, HMDA &amp; 6 more authorities.
            Get instant alerts the moment applications open — free.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <button onClick={() => setAlertOpen(true)} className="btn-primary text-[15px] py-3.5 px-7">
              🔔 Get Free Alerts
            </button>
            <button
              onClick={() => document.getElementById("scheme-list")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-secondary text-[15px] py-3.5 px-7"
            >
              Browse Schemes →
            </button>
            <Link href="/pricing" className="btn-ghost text-[15px] py-3.5 px-5 text-[--saffron-600] border-[--saffron-200] hover:bg-[--saffron-100]">
              View Plans
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {["✅ Free forever", "🏙️ 9 cities", "⚡ Real-time alerts", "🔐 No spam, ever"].map(t => (
              <span key={t} className="text-[12.5px] font-semibold text-[--ink-500] bg-[--ink-50] border border-[--ink-100] px-3 py-1.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────── */}
      <div className="page-container">
        {stats && <StatsBar stats={stats} />}
      </div>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="page-container pb-14">
        <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-10">
            <span className="section-label text-[--teal-400]">How it works</span>
            <h2 className="text-[28px] font-[Outfit] font-800 text-white mt-2">Three steps to never miss a scheme</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "🤖", title: "We scrape", desc: "Our bots scan LDA, BDA, GNIDA, HMDA and 6 other authorities every 6 hours." },
              { step: "02", icon: "📊", title: "We normalise", desc: "Scheme data is parsed, enriched with dates, prices, and plot counts." },
              { step: "03", icon: "🔔", title: "We alert you", desc: "The moment a scheme changes status, you get an Email, Telegram, or WhatsApp notification." },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[--teal-700]/40 border border-[--teal-600]/30 flex items-center justify-center font-[Outfit] font-800 text-[--teal-400] text-[13px]">
                  {step}
                </div>
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

      {/* ── Scheme list ────────────────────────────────────── */}
      <section id="scheme-list" className="page-container pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="section-label">Browse Schemes</span>
            <h2 className="text-[26px] font-[Outfit] font-800 text-[--ink-900] mt-1">
              {filtered.length} scheme{filtered.length !== 1 ? "s" : ""} found
            </h2>
          </div>
          <Link href="/schemes" className="btn-ghost text-[13px]">View all →</Link>
        </div>

        <FilterBar city={city} setCity={setCity} status={status} setStatus={setStatus} search={search} setSearch={setSearch} />

        {loading ? (
          <div className="space-y-6">
            <BrandLoader compact label="Loading the latest schemes..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 skeleton" />
              ))}
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
              {filtered.slice(0, 6).map(s => <SchemeCard key={s.scheme_id} scheme={s} />)}
            </div>

            {/* Mid-page ad */}
            <div className="my-8">
              <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_MID} format="horizontal" label="Mid-page — Schemes List" />
            </div>

            {filtered.length > 6 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.slice(6).map(s => <SchemeCard key={s.scheme_id} scheme={s} />)}
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Pricing teaser ─────────────────────────────────── */}
      <section className="page-container pb-16">
        <div className="card p-8 sm:p-12 text-center bg-gradient-to-br from-[--saffron-100] to-white border-[--saffron-200]">
          <span className="section-label text-[--saffron-600]">Upgrade to Pro</span>
          <h2 className="text-[28px] font-[Outfit] font-800 text-[--ink-900] mt-2 mb-3">
            Unlock WhatsApp alerts &amp; unlimited tracking
          </h2>
          <p className="text-[15px] text-[--ink-600] mb-7 max-w-lg mx-auto">
            Free plan covers 2 cities. Pro unlocks all 9 cities, WhatsApp delivery, PDF downloads, and priority notifications.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/pricing" className="btn-saffron text-[15px] py-3 px-8">
              See Pricing Plans →
            </Link>
            <Link href="/auth" className="btn-secondary text-[15px] py-3 px-8">
              Start Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom ad ──────────────────────────────────────── */}
      <div className="page-container pb-8">
        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_BTM} format="horizontal" label="Bottom Leaderboard" />
      </div>

      <Footer />
      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
