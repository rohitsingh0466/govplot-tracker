import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuthModal from "../components/AuthModal";
import axios from "axios";
import BrandLoader from "../components/BrandLoader";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CityData = {
  rank: number;
  name: string;
  city: string;
  state: string;
  authority: string;
  authority_full_name: string;
  official_url: string;
  demand_level: string;
  demand_tags: string[];
  emoji: string;
  color: string;
  bg_color: string;
  scraper_tier: number;
  tags: string[];
  tier: number;
  href: string;
};

export default function CitiesPage() {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("govplot_auth_user") : null;
    setIsLoggedIn(!!raw);
    const handler = () => setIsLoggedIn(!!localStorage.getItem("govplot_auth_user"));
    window.addEventListener("govplot-auth-changed", handler);
    return () => window.removeEventListener("govplot-auth-changed", handler);
  }, []);

  useEffect(() => {
    if (!router.isReady || router.query.openAuth !== "1") return;
    setAuthOpen(true);
    const nextQuery = { ...router.query };
    delete nextQuery.openAuth;
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  }, [router]);

  // Fetch cities from backend (reads city_config.py)
  useEffect(() => {
    axios.get(`${API}/api/v1/cities/`)
      .then(r => setCities(r.data as CityData[]))
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, []);

  // Group by demand level for display
  const extremeCities = cities.filter(c => c.demand_level === "EXTREME");
  const veryHighCities = cities.filter(c => c.demand_level === "VERY_HIGH");
  const highCities = cities.filter(c => c.demand_level === "HIGH");
  const risingCities = cities.filter(c => c.demand_level === "RISING");

  return (
    <>
      <Head>
        <title>20 High-Demand Cities — GovPlot Tracker | Government Plot Schemes</title>
        <meta name="description" content="Track government residential plot lottery schemes across India's 20 highest-demand cities — Greater Noida, Lucknow, Jaipur, Delhi, Bengaluru, and more." />
        <link rel="canonical" href="https://govplottracker.com/cities" />
      </Head>
      <Navbar />

      <div className="page-container page-top-offset pb-16">
        {/* Header */}
        <div className="mb-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[--teal-600]">20 High-Demand Cities</span>
          <h1 className="text-[36px] sm:text-[44px] font-[Outfit] font-900 text-[--ink-900] mt-1 mb-3">
            India's Top Plot Lottery Cities
          </h1>
          <p className="text-[15px] text-[--ink-600] max-w-2xl">
            GovPlot Tracker monitors 20 highest-demand cities ranked by applicant volume, infrastructure growth, and scheme frequency — from YEIDA's 2L+ applicants to DDA's 6,000-plot lotteries.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {["20 Cities", "Lottery Only", "Min ₹25L", "No E-Auction", "Weekly Pull"].map(t => (
              <span key={t} className="text-[12.5px] font-semibold text-[--ink-500] bg-[--ink-50] border border-[--ink-100] px-3 py-1.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>

        {!isLoggedIn && (
          <div className="mb-8 bg-gradient-to-r from-[--teal-700] to-[--teal-900] rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔓</span>
              <div>
                <p className="text-[14px] font-[Outfit] font-700 text-white">Sign up to view Open & Active scheme details</p>
                <p className="text-[12px] text-[--teal-300]/90">Free account — full access across all 20 cities</p>
              </div>
            </div>
            <button onClick={() => setAuthOpen(true)} className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[13px] py-2.5 px-6 flex-shrink-0">
              Sign Up Free →
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20"><BrandLoader compact label="Loading city data..." /></div>
        ) : (
          <>
            {extremeCities.length > 0 && (
              <CitySection title="Extreme Demand" badge="🔥 EXTREME" badgeClass="bg-red-100 text-red-700" cities={extremeCities} />
            )}
            {veryHighCities.length > 0 && (
              <CitySection title="Very High Demand" badge="⬆️ VERY HIGH" badgeClass="bg-[--teal-100] text-[--teal-700]" cities={veryHighCities} />
            )}
            {highCities.length > 0 && (
              <CitySection title="High Demand" badge="📈 HIGH" badgeClass="bg-[--saffron-100] text-[--saffron-600]" cities={highCities} />
            )}
            {risingCities.length > 0 && (
              <CitySection title="Rising Demand" badge="🌱 RISING" badgeClass="bg-sky-100 text-sky-700" cities={risingCities} />
            )}
          </>
        )}
      </div>

      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

function CitySection({
  title, badge, badgeClass, cities
}: {
  title: string;
  badge: string;
  badgeClass: string;
  cities: CityData[];
}) {
  return (
    <div className="mb-10">
      <h2 className="text-[20px] font-[Outfit] font-800 text-[--ink-900] mb-5 flex items-center gap-2">
        <span className={`text-[13px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeClass}`}>{badge}</span>
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cities.map((city, i) => (
          <CityCard city={city} key={city.name} index={i} />
        ))}
      </div>
    </div>
  );
}

function CityCard({ city, index }: { city: CityData; index: number }) {
  return (
    <article
      className="card card-hover p-6 animate-fade-in-up"
      style={{
        animationDelay: `${index * 40}ms`,
        borderTopColor: city.color,
        borderTopWidth: 3,
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: city.bg_color }}
        >
          {city.emoji}
        </div>
        <div>
          <h3 className="text-[17px] font-[Outfit] font-800 text-[--ink-900]">{city.name}</h3>
          <p className="text-[12px] text-[--ink-500]">{city.state}</p>
        </div>
        {/* Rank badge */}
        <div className="ml-auto flex-shrink-0">
          <span className="text-[10px] font-bold text-[--ink-400] bg-[--ink-50] border border-[--ink-100] px-2 py-0.5 rounded-full">
            #{city.rank}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11.5px] text-[--ink-500]">Authority:</span>
        <span className="text-[12px] font-bold" style={{ color: city.color }}>{city.authority}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {city.demand_tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: city.bg_color, color: city.color }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/schemes?city=${city.name}`}
          className="btn-primary flex-1 justify-center text-[13px] py-2.5"
          style={{ background: `linear-gradient(135deg, ${city.color}, ${city.color}dd)` }}
        >
          View Schemes
        </Link>
        <a
          href={city.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-shrink-0 text-[12px] py-2.5 px-3"
        >
          Official ↗
        </a>
      </div>
    </article>
  );
}
