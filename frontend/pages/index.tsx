import { useState, useEffect } from "react";
import Head from "next/head";
import axios from "axios";
import SchemeCard from "../components/SchemeCard";
import StatsBar from "../components/StatsBar";
import FilterBar from "../components/FilterBar";
import AlertModal from "../components/AlertModal";
import Navbar from "../components/Navbar";

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🏠 GovPlot Tracker
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            India&apos;s most complete tracker for Government Residential Plot Schemes.
            Real-time status across <strong>9 top cities</strong>. Get notified the moment a scheme opens.
          </p>
          <button
            onClick={() => setAlertOpen(true)}
            className="mt-5 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition"
          >
            🔔 Get Free Alerts
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">No schemes found for the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filtered.map(s => (
              <SchemeCard key={s.scheme_id} scheme={s} />
            ))}
          </div>
        )}

        {/* Ad Slot — Google AdSense */}
        <div className="mt-12 bg-gray-100 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 text-sm">
          {/* Replace this div with your AdSense code snippet */}
          📢 Advertisement Slot — Google AdSense
        </div>
      </main>

      <footer className="mt-16 border-t bg-white py-8 text-center text-gray-400 text-sm">
        <p>© 2025 GovPlot Tracker · Data sourced from official government portals</p>
        <p className="mt-1">
          <a href="/about" className="hover:underline">About</a> ·{" "}
          <a href="/privacy" className="hover:underline">Privacy</a> ·{" "}
          <a href="/contact" className="hover:underline">Contact</a>
        </p>
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
