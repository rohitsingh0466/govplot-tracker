import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import SchemeCard from "../../components/SchemeCard";
import FilterBar from "../../components/FilterBar";
import StatsBar from "../../components/StatsBar";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AlertModal from "../../components/AlertModal";
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
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setCity((router.query.city as string) || "");
    }
  }, [router.isReady, router.query.city]);

  useEffect(() => {
    if (!router.isReady || router.query.openAlert !== "1") return;
    setAlertOpen(true);
    const nextQuery = { ...router.query };
    delete nextQuery.openAlert;
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  }, [router]);

  useEffect(() => { fetchAll(); }, [city]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [sRes, stRes] = await withMinimumLoader(Promise.all([
        axios.get(`${API}/api/v1/schemes/`, { params: { limit: 200, ...(city && { city }) } }),
        axios.get(`${API}/api/v1/schemes/stats`),
      ]));
      setSchemes(sRes.data);
      setStats(stRes.data);
    } catch {
      setSchemes([]);
      setStats({ total_schemes: 0, open: 0, active: 0, upcoming: 0, closed: 0, cities_tracked: 9 });
    } finally {
      setLoading(false);
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
        <title>All Government Plot Schemes — GovPlot Tracker</title>
        <meta name="description" content="Browse all government residential plot schemes across 9 major Indian cities. Filter by city, status, authority." />
        <link rel="canonical" href="https://govplottracker.com/schemes" />
      </Head>

      <Navbar onAlertClick={() => setAlertOpen(true)} />

      {/* Header */}
      <div className="page-container pt-10 pb-8">
        <div className="mb-6">
          <span className="section-label">All Schemes</span>
          <h1 className="text-[32px] sm:text-[40px] font-[Outfit] font-900 text-[--ink-900] mt-1">
            Government Plot Schemes
          </h1>
          <p className="text-[--ink-500] text-[15px] mt-1">
            Live data from 9 city authorities · Updated every 6 hours
          </p>
        </div>

        {stats && <StatsBar stats={stats} />}

        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEMES_TOP} format="horizontal" className="mb-6" label="Schemes List — Top Ad" />

        <FilterBar city={city} setCity={setCity} status={status} setStatus={setStatus} search={search} setSearch={setSearch} />

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] text-[--ink-500] font-medium">
            {loading ? "Loading…" : `${filtered.length} scheme${filtered.length !== 1 ? "s" : ""} found`}
          </p>
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
              {filtered.slice(0, 9).map(s => <SchemeCard key={s.scheme_id} scheme={s} />)}
            </div>
            {filtered.length > 9 && (
              <>
                <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEMES_MID} format="horizontal" className="my-8" label="Schemes List — Mid Ad" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.slice(9).map(s => <SchemeCard key={s.scheme_id} scheme={s} />)}
                </div>
              </>
            )}
          </>
        )}

        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEMES_BTM} format="horizontal" className="mt-10" label="Schemes List — Bottom Ad" />
      </div>

      <Footer />
      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
