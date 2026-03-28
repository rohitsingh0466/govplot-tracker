import { useState, useEffect } from "react";
import Head from "next/head";
import axios from "axios";
import SchemeCard from "../components/SchemeCard";
import StatsBar from "../components/StatsBar";
import FilterBar from "../components/FilterBar";
import AlertModal from "../components/AlertModal";
import Navbar from "../components/Navbar";
import AdSenseSlot from "../components/AdSenseSlot";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [city, status]);

  async function fetchData() {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (city) params.city = city;
      if (status) params.status = status;
      const { data } = await axios.get(`${API}/api/v1/schemes/`, { params });
      setSchemes(data);
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
      setStats({ total_schemes: 12, open: 3, active: 4, upcoming: 2, closed: 3, cities_tracked: 9 });
    }
  }

  const filtered = schemes.filter(
    (s) =>
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>GovPlot Tracker - Government Plot Schemes India</title>
        <meta
          name="description"
          content="Track government residential plot schemes across Lucknow, Bangalore, Noida, Gurgaon, Hyderabad, Pune, Mumbai and more with real-time alerts."
        />
        <meta
          name="keywords"
          content="government plot scheme India, LDA plot scheme, BDA residential plots, government land scheme alerts"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="GovPlot Tracker - Government Plot Schemes India" />
        <meta
          property="og:description"
          content="Track government residential plot schemes across India's major cities with real-time alerts and scheme detail pages."
        />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://govplottracker.com"}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || "https://govplottracker.com"}`} />
        <meta property="og:site_name" content="GovPlot Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <section className="animate-fade-in-up mb-8 rounded-3xl border border-amber-100 bg-gradient-to-br from-white/95 via-white/90 to-amber-50/80 px-5 py-8 shadow-md sm:mb-12 sm:px-10 sm:py-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-amber-800 sm:text-sm">
            Live Intelligence for Plot Buyers
          </div>

          <h1 className="mb-4 max-w-4xl text-3xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Track Government Plot Schemes with
            <span className="block bg-gradient-to-r from-teal-700 via-cyan-700 to-slate-900 bg-clip-text text-transparent">One Clear Dashboard</span>
          </h1>

          <p className="mb-6 max-w-3xl text-base text-slate-600 sm:text-xl">
            Discover active and upcoming residential plot schemes across 9 major Indian cities, filter quickly, and receive instant alerts when applications open.
          </p>

          <div className="mb-6 flex flex-wrap gap-2 sm:gap-3">
            {[
              "9 Cities",
              "Official Source Links",
              "Instant Alerts",
              "Daily Refresh",
            ].map((item) => (
              <span key={item} className="rounded-full border border-teal-100 bg-teal-50/70 px-3 py-1 text-xs font-semibold text-teal-800 sm:text-sm">
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setAlertOpen(true)}
              className="rounded-xl bg-gradient-to-r from-teal-600 to-cyan-700 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-teal-700 hover:to-cyan-800 sm:text-base"
            >
              Get Free Alerts
            </button>
            <button
              onClick={() => document.getElementById("scheme-list")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700 sm:text-base"
            >
              Browse Schemes
            </button>
          </div>
        </section>

        {stats && <StatsBar stats={stats} />}

        <section id="scheme-list">
          <FilterBar city={city} setCity={setCity} status={status} setStatus={setStatus} search={search} setSearch={setSearch} />

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="surface-card py-20 text-center text-slate-500">
              <div className="mb-4 text-6xl">🔍</div>
              <p className="mb-1 text-2xl font-bold text-slate-700">No schemes found</p>
              <p className="text-base">Try a different city, status, or keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <SchemeCard key={s.scheme_id} scheme={s} />
              ))}
            </div>
          )}
        </section>

        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT} className="mt-16" />
      </main>

      <footer className="mt-16 border-t border-slate-800 bg-slate-900 py-10 text-slate-300 sm:mt-20 sm:py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-white">
              <span className="text-2xl">🏠</span>
              <span className="text-lg font-bold">GovPlot Tracker</span>
            </div>
            <p className="text-sm text-slate-400">Real-time monitoring for government residential plot schemes in India.</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-white">Schemes</a></li>
              <li><a href="/cities" className="hover:text-white">Cities</a></li>
              <li><a href="/about" className="hover:text-white">About</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white">Terms of Use</a></li>
              <li><a href="/contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">Newsletter</h4>
            <p className="mb-3 text-sm text-slate-400">Get weekly updates when new schemes launch.</p>
            <button className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 text-sm font-semibold text-white transition hover:from-teal-600 hover:to-cyan-700">
              Subscribe
            </button>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-slate-800 px-4 pt-6 text-center text-xs text-slate-500 sm:text-sm">
          <p>© 2026 GovPlot Tracker · Data sourced from official government portals</p>
        </div>
      </footer>

      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}

const MOCK_SCHEMES = [
  { scheme_id: "LDA-abc1", name: "LDA Vasant Kunj Residential Plot Scheme 2024", city: "Lucknow", authority: "LDA", status: "CLOSED", price_min: 25, price_max: 85, total_plots: 1200, apply_url: "https://lda.up.nic.in", close_date: "2024-02-28" },
  { scheme_id: "LDA-abc2", name: "LDA Gomti Nagar Extension Plot Scheme 2025", city: "Lucknow", authority: "LDA", status: "UPCOMING", price_min: 35, price_max: 120, total_plots: 800, apply_url: "https://lda.up.nic.in", open_date: "2025-04-01" },
  { scheme_id: "BDA-abc1", name: "BDA Arkavathy Layout 2E Residential Sites", city: "Bangalore", authority: "BDA", status: "ACTIVE", price_min: 45, price_max: 300, total_plots: 6588, apply_url: "https://bdabangalore.org", close_date: "2025-03-31" },
  { scheme_id: "BDA-abc2", name: "BDA JP Nagar 9th Phase Extension Plots", city: "Bangalore", authority: "BDA", status: "UPCOMING", price_min: 80, price_max: 450, total_plots: 920, apply_url: "https://bdabangalore.org", open_date: "2025-07-01" },
  { scheme_id: "GNIDA-abc1", name: "Greater Noida Residential Plot Scheme 2025", city: "Noida", authority: "GNIDA", status: "OPEN", price_min: 30, price_max: 150, total_plots: 1100, apply_url: "https://greaternoida.in", close_date: "2025-03-15" },
  { scheme_id: "YEIDA-abc1", name: "YEIDA Plot Scheme Sector 18 Expressway", city: "Noida", authority: "YEIDA", status: "UPCOMING", price_min: 15, price_max: 80, total_plots: 2000, apply_url: "https://yamunaexpresswayauthority.com", open_date: "2025-06-01" },
];
