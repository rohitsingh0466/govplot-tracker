import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import SchemeCard from "../../components/SchemeCard";
import FilterBar from "../../components/FilterBar";
import StatsBar from "../../components/StatsBar";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import AdSenseSlot from "../../components/AdSenseSlot";
import BrandLoader from "../../components/BrandLoader";
import { normalizeScheme } from "../../lib/schemeStatus";
import { withMinimumLoader } from "../../lib/uiLoading";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SchemesPage() {
  const router = useRouter();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity]       = useState((router.query.city as string) || "");
  const [status, setStatus]   = useState("");
  const [search, setSearch]   = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("govplot_auth_user") : null;
    setIsLoggedIn(!!raw);
    const handler = () => setIsLoggedIn(!!localStorage.getItem("govplot_auth_user"));
    window.addEventListener("govplot-auth-changed", handler);
    return () => window.removeEventListener("govplot-auth-changed", handler);
  }, []);

  useEffect(() => {
    if (router.isReady) setCity((router.query.city as string) || "");
  }, [router.isReady, router.query.city]);

  useEffect(() => { fetchAll(); }, [city, isLoggedIn]);

  async function fetchAll() {
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("govplot_auth_token") : null;
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [sRes, stRes] = await withMinimumLoader(Promise.all([
        axios.get(`${API}/api/v1/schemes/`, { params: { limit: 200, ...(city && { city }) }, headers }),
        axios.get(`${API}/api/v1/schemes/stats`),
      ]));
      setSchemes(sRes.data);
      setStats(stRes.data);
    } catch {
      setSchemes([]);
      setStats({ total_schemes: 0, open: 0, active: 0, upcoming: 0, closed: 0, cities_tracked: 20 });
    } finally {
      setLoading(false);
    }
  }

  const normalizedSchemes = schemes.map(normalizeScheme);
  const filtered = normalizedSchemes.filter((s) => {
    const matchesStatus = !status || s.status === status;
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()) || s.authority.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <Head>
        <title>All Government Plot Schemes — GovPlot Tracker</title>
        <meta name="description" content="Browse government residential plot lottery schemes across India's top 20 watched cities. Filter by city, status, and authority." />
        <link rel="canonical" href="https://govplottracker.com/schemes" />
      </Head>

      <Navbar />

      <div className="page-container page-top-offset pb-8">
        <div className="mb-6">
          <h1 className="text-[32px] sm:text-[40px] font-[Outfit] font-900 text-[--ink-900] mt-1">
            Government Plot Lottery Schemes
          </h1>
          <p className="text-[--ink-500] text-[15px] mt-1">
            Curated top-20 city watchlist · Weekly full pull · Daily status refresh
          </p>
        </div>

        {/* Anonymous CTA banner */}
        {!isLoggedIn && (
          <div className="mb-6 bg-gradient-to-r from-[--teal-700] to-[--teal-900] rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔓</span>
              <div>
                <p className="text-[14px] font-[Outfit] font-700 text-white">Sign up to view Open &amp; Active scheme details</p>
                <p className="text-[12px] text-[--teal-300]/90">Free account — full access to all scheme details across the 20-city watchlist</p>
              </div>
            </div>
            <button onClick={() => setAuthOpen(true)} className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[13px] py-2.5 px-6 flex-shrink-0" style={{ fontFamily: "var(--font-display)" }}>
              Sign Up Free →
            </button>
          </div>
        )}

        {stats && <StatsBar stats={stats} />}

        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEMES_TOP} format="horizontal" className="mb-6" label="Schemes List — Top Ad" />

        <FilterBar city={city} setCity={setCity} status={status} setStatus={setStatus} search={search} setSearch={setSearch} />

        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] text-[--ink-500] font-medium">
            {loading ? "Loading…" : `${filtered.length} scheme${filtered.length !== 1 ? "s" : ""} found`}
          </p>
          {!isLoggedIn && (
            <button onClick={() => setAuthOpen(true)} className="text-[12px] text-[--teal-600] font-semibold underline">
              Sign in to unlock full details
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-6">
            <BrandLoader compact label="Fetching scheme listings..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => <div key={i} className="h-72 skeleton" />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-[Outfit] font-700 text-[--ink-700] mb-2">No schemes found</h3>
            <p className="text-[--ink-500]">Try different filters or check back later.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.slice(0, 9).map(s => <SchemeCard key={s.scheme_id} scheme={s} onSignUpClick={() => setAuthOpen(true)} />)}
            </div>
            {filtered.length > 9 && (
              <>
                <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEMES_MID} format="horizontal" className="my-8" label="Schemes List — Mid Ad" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.slice(9).map(s => <SchemeCard key={s.scheme_id} scheme={s} onSignUpClick={() => setAuthOpen(true)} />)}
                </div>
              </>
            )}
          </>
        )}

        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEMES_BTM} format="horizontal" className="mt-10" label="Schemes List — Bottom Ad" />
      </div>

      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
