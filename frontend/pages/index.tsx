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
  const [schemes, setSchemes]     = useState<any[]>([]);
  const [stats, setStats]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [city, setCity]           = useState("");
  const [status, setStatus]       = useState("");
  const [search, setSearch]       = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [city, status]);

  async function fetchData() {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (city)   params.city   = city;
      if (status) params.status = status;
      const { data } = await axios.get(`${API}/api/v1/schemes/`, { params });
      setSchemes(data);
    } catch {
      // fallback mock data for demo
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

  const filtered = schemes.filter(s =>
    search === "" ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>GovPlot Tracker — Government Plot Schemes India</title>
        <meta name="description" content="Track government residential plot schemes across Lucknow, Bangalore, Noida, Gurgaon, Hyderabad, Pune, Mumbai & more. Get real-time alerts." />
        <meta name="keywords" content="government plot scheme India, LDA plot scheme, BDA residential plots, government land scheme alerts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="GovPlot Tracker — Government Plot Schemes India" />
        <meta property="og:description" content="Track government residential plot schemes across India's major cities with real-time alerts and scheme detail pages." />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://govplottracker.com"}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || "https://govplottracker.com"}`} />
        <meta property="og:site_name" content="GovPlot Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 py-12">

        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in-up px-2 sm:px-4">
          <div className="inline-block mb-3 sm:mb-4 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full border border-blue-200">
            <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ✨ Track Government Plot Schemes in Real-Time
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r from-blue-600 via-blue-700 to-slate-900 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight px-1">
            🏠 GovPlot Tracker
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-700 max-w-4xl mx-auto mb-2 leading-relaxed px-2">
            India&apos;s <span className="font-bold text-blue-600">most complete</span> real-time tracker for Government Residential Plot Schemes.
          </p>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-4xl mx-auto mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-8 flex-wrap px-2">
            <span className="flex items-center gap-1"><span className="text-base">📍</span> <strong>9 Major Cities</strong></span>
            <span className="flex items-center gap-1"><span className="text-base">🔔</span> <strong>Instant Alerts</strong></span>
            <span className="flex items-center gap-1"><span className="text-base">✅</span> <strong>Live Updates</strong></span>
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center px-2">
            <button
              onClick={() => setAlertOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 text-sm sm:text-base md:text-lg"

            >
              🔔 Get Free Alerts
            </button>
            <button
              onClick={() => {/* scroll to schemes */}}
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-xl transition text-sm sm:text-base md:text-lg hover:shadow-lg"
            >
              Browse Schemes →
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && <StatsBar stats={stats} />}

        {/* Filters */}
        <FilterBar
          city={city} setCity={setCity}
          status={status} setStatus={setStatus}
          search={search} setSearch={setSearch}
        />

        {/* Scheme Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <div className="text-7xl mb-6">🔍</div>
            <p className="text-2xl font-bold mb-2">No schemes found</p>
            <p className="text-lg">Try adjusting your filters to find what you&apos;re looking for</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(s => (
              <SchemeCard key={s.scheme_id} scheme={s} />
            ))}
          </div>
        )}

        {/* Advertisement Slot */}
        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT} className="mt-16" />
      </main>

      {/* Footer */}
      <footer className="mt-16 sm:mt-20 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🏠</span>
                <span className="font-bold text-blue-600 text-base sm:text-lg">GovPlot Tracker</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Real-time tracking for government residential plot schemes across India.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="text-slate-600 hover:text-blue-600 transition">Schemes</a></li>
                <li><a href="/cities" className="text-slate-600 hover:text-blue-600 transition">Cities</a></li>
                <li><a href="/about" className="text-slate-600 hover:text-blue-600 transition">About</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy" className="text-slate-600 hover:text-blue-600 transition">Privacy Policy</a></li>
                <li><a href="/terms" className="text-slate-600 hover:text-blue-600 transition">Terms of Use</a></li>
                <li><a href="/contact" className="text-slate-600 hover:text-blue-600 transition">Contact</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h4 className="font-bold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Newsletter</h4>
              <p className="text-sm text-slate-600 mb-3">Get weekly updates on new schemes</p>
              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition text-sm">
                Subscribe
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 sm:pt-8 text-center text-slate-600 text-xs sm:text-sm">
            <p className="mb-2">© 2025 GovPlot Tracker · Data sourced from official government portals</p>
            <p>Built with ❤️ for every Indian looking to invest in government land</p>
          </div>
        </div>
      </footer>

      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}

// ── Mock data (shown when API is offline / first load) ────────────────────────
const MOCK_SCHEMES = [
  { scheme_id: "LDA-abc1", name: "LDA Vasant Kunj Residential Plot Scheme 2024", city: "Lucknow", authority: "LDA", status: "CLOSED", price_min: 25, price_max: 85, total_plots: 1200, apply_url: "https://lda.up.nic.in", close_date: "2024-02-28" },
  { scheme_id: "LDA-abc2", name: "LDA Gomti Nagar Extension Plot Scheme 2025", city: "Lucknow", authority: "LDA", status: "UPCOMING", price_min: 35, price_max: 120, total_plots: 800, apply_url: "https://lda.up.nic.in", open_date: "2025-04-01" },
  { scheme_id: "BDA-abc1", name: "BDA Arkavathy Layout 2E Residential Sites", city: "Bangalore", authority: "BDA", status: "ACTIVE", price_min: 45, price_max: 300, total_plots: 6588, apply_url: "https://bdabangalore.org", close_date: "2025-03-31" },
  { scheme_id: "BDA-abc2", name: "BDA JP Nagar 9th Phase Extension Plots", city: "Bangalore", authority: "BDA", status: "UPCOMING", price_min: 80, price_max: 450, total_plots: 920, apply_url: "https://bdabangalore.org", open_date: "2025-07-01" },
  { scheme_id: "GNIDA-abc1", name: "Greater Noida Residential Plot Scheme 2025", city: "Noida", authority: "GNIDA", status: "OPEN", price_min: 30, price_max: 150, total_plots: 1100, apply_url: "https://greaternoida.in", close_date: "2025-03-15" },
  { scheme_id: "YEIDA-abc1", name: "YEIDA Plot Scheme Sector 18 Expressway", city: "Noida", authority: "YEIDA", status: "UPCOMING", price_min: 15, price_max: 80, total_plots: 2000, apply_url: "https://yamunaexpresswayauthority.com", open_date: "2025-06-01" },
];
