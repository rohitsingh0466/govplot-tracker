import { useEffect, useMemo, useState } from "react";
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
  { scheme_id: "DDA-abc1",   name: "DDA Awasiya Yojana Lottery 2025 — Dwarka Extension",          city: "Delhi",          authority: "DDA",    status: "UPCOMING", price_min: 40,  price_max: 600, total_plots: 8000,  apply_url: "https://dda.gov.in",                    open_date: "2025-09-01" },
  { scheme_id: "CIDCO-abc1", name: "CIDCO Mass Housing Lottery December 2025 — 16876 Units",       city: "Navi Mumbai",    authority: "CIDCO",  status: "OPEN",     price_min: 30,  price_max: 180, total_plots: 16876, apply_url: "https://cidcohomes.com",                close_date: "2026-01-31", area_sqft_min: 322, area_sqft_max: 567 },
  { scheme_id: "YEIDA-abc1", name: "YEIDA Noida International Airport Zone Plot Lottery 2025",     city: "Noida",          authority: "YEIDA",  status: "UPCOMING", price_min: 12,  price_max: 75,  total_plots: 3500,  apply_url: "https://yamunaexpresswayauthority.com", open_date: "2025-10-01" },
  { scheme_id: "JDA-abc1",   name: "JDA Jagatpura Residential Plot Lottery Scheme 2025",           city: "Jaipur",         authority: "JDA",    status: "OPEN",     price_min: 22,  price_max: 110, total_plots: 1200,  apply_url: "https://jda.gov.in",                    close_date: "2025-04-30", area_sqft_min: 900, area_sqft_max: 5400 },
  { scheme_id: "MHADA-abc1", name: "MHADA Pune Board Plot Lottery 2025 — 6294 Units",              city: "Pune",           authority: "MHADA",  status: "OPEN",     price_min: 25,  price_max: 300, total_plots: 6294,  apply_url: "https://mhada.gov.in",                  close_date: "2025-04-30" },
  { scheme_id: "IDA-abc1",   name: "IDA Super Corridor Residential Plot Lottery 2025",             city: "Indore",         authority: "IDA",    status: "OPEN",     price_min: 20,  price_max: 95,  total_plots: 1400,  apply_url: "https://ida.mp.gov.in",                 close_date: "2025-05-31", area_sqft_min: 900, area_sqft_max: 5400 },
  { scheme_id: "BDA-abc1",   name: "BDA Arkavathy Layout 2E Residential Sites Lottery",            city: "Bangalore",      authority: "BDA",    status: "ACTIVE",   price_min: 45,  price_max: 300, total_plots: 6588,  apply_url: "https://bdabangalore.org",              close_date: "2025-03-31", area_sqft_min: 600, area_sqft_max: 4800 },
  { scheme_id: "HSVP-abc1",  name: "HSVP BPL EWS Residential Plot Lottery Gurugram 2024-25",      city: "Gurgaon",        authority: "HSVP",   status: "OPEN",     price_min: 11,  price_max: 35,  total_plots: 7300,  apply_url: "https://hsvphry.gov.in",                close_date: "2025-03-31" },
  { scheme_id: "HMDA-abc1",  name: "HMDA Residential Plots Adibatla IT Corridor Lottery 2025",    city: "Hyderabad",      authority: "HMDA",   status: "UPCOMING", price_min: 28,  price_max: 120, total_plots: 2400,  apply_url: "https://hmda.gov.in",                   open_date: "2025-08-01" },
  { scheme_id: "KDA-abc1",   name: "KDA Haldwani Kathgodam Kumaon Gate Plot Lottery 2025",        city: "Haldwani",       authority: "KDA",    status: "OPEN",     price_min: 22,  price_max: 95,  total_plots: 580,   apply_url: "https://mdda.uk.gov.in",                close_date: "2025-04-30" },
  { scheme_id: "AUDA-abc1",  name: "AUDA Sanand Ring Road Residential Plot Lottery 2025",         city: "Ahmedabad",      authority: "AUDA",   status: "UPCOMING", price_min: 25,  price_max: 120, total_plots: 1500,  apply_url: "https://auda.org.in",                   open_date: "2025-06-01" },
  { scheme_id: "LDA-abc1",   name: "LDA Gomti Nagar Extension Residential Plot Lottery 2024",     city: "Lucknow",        authority: "LDA",    status: "ACTIVE",   price_min: 35,  price_max: 120, total_plots: 800,   apply_url: "https://lda.up.nic.in",                 close_date: "2025-06-30" },
];

export default function Home() {
  const router = useRouter();
  const [schemes, setSchemes]     = useState<any[]>([]);
  const [stats, setStats]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [city, setCity]           = useState("");
  const [status, setStatus]       = useState("");
  const [search, setSearch]       = useState("");
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
    } finally { setLoading(false); }
  }

  async function fetchStats() {
    try {
      const { data } = await axios.get(`${API}/api/v1/schemes/stats`);
      setStats(data);
    } catch {
      setStats(null);
    }
  }

  const normalizedSchemes = schemes.map(normalizeScheme);
  const derivedStats = useMemo(() => {
    const totalSchemes = normalizedSchemes.length;
    const open = normalizedSchemes.filter((scheme) => scheme.status === "OPEN").length;
    const active = normalizedSchemes.filter((scheme) => scheme.status === "ACTIVE").length;
    const upcoming = normalizedSchemes.filter((scheme) => scheme.status === "UPCOMING").length;
    const citiesTracked = new Set(normalizedSchemes.map((scheme) => scheme.city).filter(Boolean)).size;

    return {
      total_schemes: totalSchemes,
      open,
      active,
      upcoming,
      closed: Math.max(totalSchemes - open - active - upcoming, 0),
      cities_tracked: citiesTracked,
    };
  }, [normalizedSchemes]);
  const resolvedStats = stats && stats.total_schemes > 0 ? stats : derivedStats;
  const filtered = normalizedSchemes.filter(s => {
    const matchesStatus = !status || s.status === status;
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.authority.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <Head>
        <title>GovPlot Tracker — Government Plot Lottery Schemes Across India</title>
        <meta name="description" content="Track government residential plot lottery schemes across India's top 100+ cities — Delhi, Mumbai, Bangalore, Hyderabad, Jaipur, Noida, Pune and more. Real-time alerts via Email, Telegram & WhatsApp." />
        <meta name="keywords" content="government plot scheme India, DDA lottery 2025, LDA plot scheme, BDA residential plots, MHADA lottery, CIDCO lottery, government land scheme alerts, plot lottery India" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="GovPlot Tracker — Government Plot Lottery Schemes Across India" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://govplottracker.com" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <div className="page-container pt-4">
        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_TOP} format="horizontal" label="Top Leaderboard — Homepage" className="mb-4" />
      </div>

      <section className="page-container pt-10 pb-14">
        <div className="max-w-3xl">
          <h1 className="text-[38px] sm:text-[52px] lg:text-[60px] font-[Outfit] font-900 text-[--ink-900] mb-5" style={{ lineHeight: "1.08" }}>
            Never miss a{" "}
            <span className="bg-gradient-to-r from-[--teal-600] to-[--teal-400] bg-clip-text text-transparent">
              Government Plot Lottery
            </span>{" "}
            across India
          </h1>
          <p className="text-[17px] sm:text-[19px] text-[--ink-600] leading-relaxed mb-8 max-w-2xl">
            Real-time monitoring of DDA, LDA, BDA, MHADA, CIDCO, GNIDA, JDA, HMDA and 45+ more housing authorities across 100+ cities. Get instant alerts the moment a lottery scheme opens — free.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <button onClick={() => setAlertOpen(true)} className="btn-primary text-[15px] py-3.5 px-7">🔔 Get Free Alerts</button>
            <button onClick={() => document.getElementById("scheme-list")?.scrollIntoView({ behavior: "smooth" })} className="btn-secondary text-[15px] py-3.5 px-7">Browse Schemes →</button>
            <Link href="/pricing" className="btn-ghost text-[15px] py-3.5 px-5 text-[--saffron-600] border-[--saffron-200] hover:bg-[--saffron-100]">View Plans</Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {["✅ Free forever", "🏙️ 100+ cities", "⚡ Weekly full pull", "🎯 Lottery schemes only", "✅ Verified sources", "🔐 No spam, ever"].map(t => (
              <span key={t} className="text-[12.5px] font-semibold text-[--ink-500] bg-[--ink-50] border border-[--ink-100] px-3 py-1.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="page-container">
        {resolvedStats.total_schemes > 0 && <StatsBar stats={resolvedStats} />}
      </div>

      <section className="page-container pb-14">
        <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-10">
            <span className="section-label text-[--teal-400]">How it works</span>
            <h2 className="text-[28px] font-[Outfit] font-800 text-white mt-2">Three steps to never miss a lottery scheme</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "🤖", title: "We scrape weekly + daily",
                desc: "58 scrapers pull all 100+ cities fresh every Sunday. Mon–Sat: only OPEN/ACTIVE schemes are refreshed — 85% faster, same freshness." },
              { step: "02", icon: "✅", title: "We verify schemes",
                desc: "Every scheme is cross-checked against AajTak, 99acres, MagicBricks, NoBroker, and Housing.com. Only schemes from the last 5 years are tracked." },
              { step: "03", icon: "🔔", title: "We alert you instantly",
                desc: "The moment a scheme changes status — OPEN, UPCOMING, CLOSED — you get an Email, Telegram, or WhatsApp notification." },
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
              {filtered.slice(0, 6).map(s => <SchemeCard key={s.scheme_id} scheme={s} />)}
            </div>
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

      <section className="page-container pb-16">
        <div className="card p-8 sm:p-12 text-center bg-gradient-to-br from-[--saffron-100] to-white border-[--saffron-200]">
          <span className="section-label text-[--saffron-600]">Upgrade to Pro</span>
          <h2 className="text-[28px] font-[Outfit] font-800 text-[--ink-900] mt-2 mb-3">
            Unlock WhatsApp alerts &amp; all 100+ cities
          </h2>
          <p className="text-[15px] text-[--ink-600] mb-7 max-w-lg mx-auto">
            Free plan covers 2 cities. Pro unlocks all 100+ cities, WhatsApp delivery, PDF scheme reports, and priority notifications for lottery openings.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/pricing" className="btn-saffron text-[15px] py-3 px-8">See Pricing Plans →</Link>
            <Link href="/auth" className="btn-secondary text-[15px] py-3 px-8">Start Free</Link>
          </div>
        </div>
      </section>

      <div className="page-container pb-8">
        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_BTM} format="horizontal" label="Bottom Leaderboard" />
      </div>

      <Footer />
      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
