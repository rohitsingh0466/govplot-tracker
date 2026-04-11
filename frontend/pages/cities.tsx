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

const FALLBACK_CITIES: CityData[] = [
  { rank: 1, name: "Greater Noida", city: "Greater Noida", state: "Uttar Pradesh", authority: "YEIDA", authority_full_name: "Yamuna Expressway Industrial Development Authority", official_url: "https://yamunaexpresswayauthority.com", demand_level: "EXTREME", demand_tags: ["Jewar Airport", "Film City", "Yamuna Expressway"], emoji: "🏆", color: "#006d6d", bg_color: "#e0f2f2", scraper_tier: 2, tags: [], tier: 1, href: "https://yamunaexpresswayauthority.com" },
  { rank: 2, name: "Lucknow", city: "Lucknow", state: "Uttar Pradesh", authority: "LDA", authority_full_name: "Lucknow Development Authority", official_url: "https://www.ldalucknow.in", demand_level: "VERY_HIGH", demand_tags: ["State capital", "Metro expansion", "Airport upgrade"], emoji: "🕌", color: "#0f766e", bg_color: "#f0fdf4", scraper_tier: 1, tags: [], tier: 1, href: "https://www.ldalucknow.in" },
  { rank: 3, name: "Jaipur", city: "Jaipur", state: "Rajasthan", authority: "JDA", authority_full_name: "Jaipur Development Authority", official_url: "https://jda.rajasthan.gov.in", demand_level: "EXTREME", demand_tags: ["Pink City", "Tourism", "Expressway growth"], emoji: "🏰", color: "#c2600a", bg_color: "#fff7ed", scraper_tier: 2, tags: [], tier: 1, href: "https://jda.rajasthan.gov.in" },
  { rank: 4, name: "Agra", city: "Agra", state: "Uttar Pradesh", authority: "ADA", authority_full_name: "Agra Development Authority", official_url: "https://www.adaagra.org.in", demand_level: "VERY_HIGH", demand_tags: ["Heritage tourism", "Metro", "Gwalior highway"], emoji: "🕍", color: "#b45309", bg_color: "#fffbeb", scraper_tier: 1, tags: [], tier: 1, href: "https://www.adaagra.org.in" },
  { rank: 5, name: "Prayagraj", city: "Prayagraj", state: "Uttar Pradesh", authority: "PDA", authority_full_name: "Prayagraj Development Authority", official_url: "http://www.pdaprayagraj.org", demand_level: "HIGH", demand_tags: ["Maha Kumbh", "Infrastructure", "UP growth"], emoji: "🏛️", color: "#4338ca", bg_color: "#eef2ff", scraper_tier: 1, tags: [], tier: 2, href: "http://www.pdaprayagraj.org" },
  { rank: 6, name: "Chandigarh", city: "Chandigarh", state: "Punjab", authority: "GMADA", authority_full_name: "Greater Mohali Area Development Authority", official_url: "https://gmada.gov.in", demand_level: "VERY_HIGH", demand_tags: ["Airport expansion", "IT City", "Mohali demand"], emoji: "🌿", color: "#0369a1", bg_color: "#eff6ff", scraper_tier: 2, tags: [], tier: 1, href: "https://gmada.gov.in" },
  { rank: 7, name: "Navi Mumbai", city: "Navi Mumbai", state: "Maharashtra", authority: "CIDCO", authority_full_name: "City and Industrial Development Corporation", official_url: "https://www.cidco.maharashtra.gov.in", demand_level: "VERY_HIGH", demand_tags: ["Airport", "Planned city", "MMR"], emoji: "🏙️", color: "#0e7490", bg_color: "#ecfeff", scraper_tier: 2, tags: [], tier: 1, href: "https://www.cidco.maharashtra.gov.in" },
  { rank: 8, name: "Hyderabad", city: "Hyderabad", state: "Telangana", authority: "HMDA", authority_full_name: "Hyderabad Metropolitan Development Authority", official_url: "https://www.hmda.gov.in", demand_level: "HIGH", demand_tags: ["IT corridor", "Outer Ring Road", "Growth market"], emoji: "🔬", color: "#7c3aed", bg_color: "#f5f3ff", scraper_tier: 2, tags: [], tier: 2, href: "https://www.hmda.gov.in" },
  { rank: 9, name: "Pune", city: "Pune", state: "Maharashtra", authority: "PMRDA", authority_full_name: "Pune Metropolitan Region Development Authority", official_url: "https://pmrda.gov.in", demand_level: "HIGH", demand_tags: ["IT hub", "Auto belt", "Education"], emoji: "🎓", color: "#4338ca", bg_color: "#eef2ff", scraper_tier: 2, tags: [], tier: 2, href: "https://pmrda.gov.in" },
  { rank: 10, name: "Bengaluru", city: "Bengaluru", state: "Karnataka", authority: "BDA", authority_full_name: "Bangalore Development Authority", official_url: "https://bdabangalore.org", demand_level: "VERY_HIGH", demand_tags: ["IT capital", "Airport corridor", "Site demand"], emoji: "💻", color: "#0369a1", bg_color: "#f0f9ff", scraper_tier: 2, tags: [], tier: 1, href: "https://bdabangalore.org" },
  { rank: 11, name: "Raipur", city: "Raipur", state: "Chhattisgarh", authority: "NRDA", authority_full_name: "Nava Raipur Atal Nagar Development Authority", official_url: "https://nava-raipur.com", demand_level: "HIGH", demand_tags: ["Nava Raipur", "Capital region", "Smart city"], emoji: "🌾", color: "#15803d", bg_color: "#f0fdf4", scraper_tier: 1, tags: [], tier: 2, href: "https://nava-raipur.com" },
  { rank: 12, name: "Varanasi", city: "Varanasi", state: "Uttar Pradesh", authority: "VDA", authority_full_name: "Varanasi Development Authority", official_url: "https://vdavns.com", demand_level: "RISING", demand_tags: ["Spiritual hub", "Tourism", "UP growth"], emoji: "🪔", color: "#d97706", bg_color: "#fffbeb", scraper_tier: 1, tags: [], tier: 3, href: "https://vdavns.com" },
  { rank: 13, name: "Bhubaneswar", city: "Bhubaneswar", state: "Odisha", authority: "BDA-OD", authority_full_name: "Bhubaneswar Development Authority", official_url: "https://bda.odisha.gov.in", demand_level: "RISING", demand_tags: ["Smart city", "East India", "Capital"], emoji: "⛩️", color: "#0d9488", bg_color: "#f0fdfa", scraper_tier: 1, tags: [], tier: 3, href: "https://bda.odisha.gov.in" },
  { rank: 14, name: "Nagpur", city: "Nagpur", state: "Maharashtra", authority: "NIT", authority_full_name: "Nagpur Improvement Trust", official_url: "https://www.nitnagpur.org", demand_level: "HIGH", demand_tags: ["MIHAN", "Zero Mile", "Logistics"], emoji: "🟠", color: "#ea580c", bg_color: "#fff7ed", scraper_tier: 1, tags: [], tier: 2, href: "https://www.nitnagpur.org" },
  { rank: 15, name: "Ahmedabad", city: "Ahmedabad", state: "Gujarat", authority: "AUDA", authority_full_name: "Ahmedabad Urban Development Authority", official_url: "https://auda.org.in", demand_level: "RISING", demand_tags: ["GIFT City", "Industrial", "Western market"], emoji: "🏭", color: "#15803d", bg_color: "#f0fdf4", scraper_tier: 1, tags: [], tier: 3, href: "https://auda.org.in" },
  { rank: 16, name: "Delhi", city: "Delhi", state: "Delhi", authority: "DDA", authority_full_name: "Delhi Development Authority", official_url: "https://dda.gov.in", demand_level: "EXTREME", demand_tags: ["National capital", "Lottery demand", "NCR"], emoji: "🏛️", color: "#0d7a68", bg_color: "#f0fdf8", scraper_tier: 3, tags: [], tier: 1, href: "https://dda.gov.in" },
  { rank: 17, name: "Bhopal", city: "Bhopal", state: "Madhya Pradesh", authority: "VP-BPL", authority_full_name: "Vikas Pradhikaran Bhopal", official_url: "https://vpasthan.com", demand_level: "HIGH", demand_tags: ["Capital city", "Lake city", "Central India"], emoji: "💧", color: "#0284c7", bg_color: "#f0f9ff", scraper_tier: 1, tags: [], tier: 2, href: "https://vpasthan.com" },
  { rank: 18, name: "Udaipur", city: "Udaipur", state: "Rajasthan", authority: "UIT", authority_full_name: "Urban Improvement Trust Udaipur", official_url: "https://uitudaipur.org", demand_level: "VERY_HIGH", demand_tags: ["Lake city", "Tourism", "Rajasthan demand"], emoji: "🌊", color: "#0891b2", bg_color: "#ecfeff", scraper_tier: 1, tags: [], tier: 1, href: "https://uitudaipur.org" },
  { rank: 19, name: "Dehradun", city: "Dehradun", state: "Uttarakhand", authority: "MDDA", authority_full_name: "Mussoorie Dehradun Development Authority", official_url: "https://mddaonline.in", demand_level: "RISING", demand_tags: ["Hill capital", "IT city", "Lifestyle demand"], emoji: "⛰️", color: "#16a34a", bg_color: "#f0fdf4", scraper_tier: 1, tags: [], tier: 3, href: "https://mddaonline.in" },
  { rank: 20, name: "Meerut", city: "Meerut", state: "Uttar Pradesh", authority: "MDA", authority_full_name: "Meerut Development Authority", official_url: "https://mda.up.gov.in", demand_level: "HIGH", demand_tags: ["NCR connector", "RRTS", "UP growth"], emoji: "🚆", color: "#64748b", bg_color: "#f8fafc", scraper_tier: 1, tags: [], tier: 2, href: "https://mda.up.gov.in" },
];

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
      .then(r => {
        const apiCities = r.data as CityData[];
        setCities(apiCities.length ? apiCities : FALLBACK_CITIES);
      })
      .catch(() => setCities(FALLBACK_CITIES))
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
            GovPlot Tracker now focuses on a curated 20-city watchlist ranked by applicant demand, infrastructure growth, and residential plot scheme frequency.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-3xl">
            {[
              { value: "20", label: "watched cities" },
              { value: "4", label: "demand bands" },
              { value: "₹25L+", label: "plot focus" },
              { value: "0", label: "private builders" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-2xl border border-[--ink-100] bg-white p-4 shadow-sm">
                <div className="font-[Outfit] text-[24px] font-900 text-[--teal-700]">{value}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[--ink-400]">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            {["Official authority links", "No E-Auction", "Weekly Pull", "Alert-ready watchlist"].map(t => (
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
