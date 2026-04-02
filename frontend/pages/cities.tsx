import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AlertModal from "../components/AlertModal";

const CITIES = [
  // Tier 1 metros
  { name: "Delhi",             authority: "DDA",       state: "Delhi",           tags: ["Lottery Schemes", "NCR Capital"],   emoji: "🏛️", color: "#0d7a68", bg: "#f0fdf8", href: "https://dda.gov.in" },
  { name: "Mumbai",            authority: "MHADA",     state: "Maharashtra",     tags: ["Housing Lottery", "Premium Zone"],  emoji: "🌊", color: "#be123c", bg: "#fff1f2", href: "https://mhada.gov.in" },
  { name: "Bangalore",         authority: "BDA",       state: "Karnataka",       tags: ["IT Hub", "High Demand"],            emoji: "💻", color: "#0369a1", bg: "#f0f9ff", href: "https://bdabangalore.org" },
  { name: "Hyderabad",         authority: "HMDA",      state: "Telangana",       tags: ["IT Corridor", "Growing Fast"],      emoji: "🔬", color: "#0e7490", bg: "#ecfeff", href: "https://hmda.gov.in" },
  { name: "Chennai",           authority: "CMDA/TNHB", state: "Tamil Nadu",      tags: ["Industrial Belt", "IT South"],      emoji: "🎭", color: "#7c3aed", bg: "#f5f3ff", href: "https://cmdachennai.gov.in" },
  { name: "Kolkata",           authority: "KMDA/WBHB", state: "West Bengal",     tags: ["Heritage City", "East India Hub"],  emoji: "🌉", color: "#b45309", bg: "#fffbeb", href: "https://kmda.gov.in" },
  // Tier 2 - Major Markets
  { name: "Ahmedabad",         authority: "AUDA",      state: "Gujarat",         tags: ["GIFT City Zone", "Industrial"],     emoji: "🏭", color: "#15803d", bg: "#f0fdf4", href: "https://auda.org.in" },
  { name: "Pune",              authority: "PMRDA",     state: "Maharashtra",     tags: ["Education Hub", "Auto Belt"],       emoji: "🎓", color: "#4338ca", bg: "#eef2ff", href: "https://pmrda.gov.in" },
  { name: "Jaipur",            authority: "JDA",       state: "Rajasthan",       tags: ["Pink City", "Tourism & Growth"],    emoji: "🏰", color: "#c2600a", bg: "#fff7ed", href: "https://jda.gov.in" },
  { name: "Noida",             authority: "GNIDA/YEIDA",state: "Uttar Pradesh",  tags: ["NCR", "Expressway Zone"],           emoji: "🏙️", color: "#6d28d9", bg: "#f5f3ff", href: "https://noidaauthorityonline.in" },
  { name: "Gurgaon",           authority: "HSVP",      state: "Haryana",         tags: ["Corporate Hub", "NCR"],             emoji: "🏢", color: "#1d4ed8", bg: "#eff6ff", href: "https://hsvphry.gov.in" },
  { name: "Lucknow",           authority: "LDA",       state: "Uttar Pradesh",   tags: ["State Capital", "Growing Fast"],    emoji: "🕌", color: "#0d7a68", bg: "#f0fdf8", href: "https://lda.up.nic.in" },
  { name: "Surat",             authority: "SUDA",      state: "Gujarat",         tags: ["Diamond City", "Fast Growing"],     emoji: "💎", color: "#0891b2", bg: "#ecfeff", href: "https://suda.gujarat.gov.in" },
  { name: "Indore",            authority: "IDA",       state: "Madhya Pradesh",  tags: ["Smart City", "Cleanest City"],      emoji: "🌟", color: "#d97706", bg: "#fffbeb", href: "https://ida.mp.gov.in" },
  { name: "Bhopal",            authority: "BDA-MP",    state: "Madhya Pradesh",  tags: ["Lake City", "Govt Capital"],        emoji: "💧", color: "#0284c7", bg: "#f0f9ff", href: "https://bda.mp.gov.in" },
  { name: "Nagpur",            authority: "NIT",       state: "Maharashtra",     tags: ["MIHAN Zone", "Zero Mile City"],     emoji: "🟠", color: "#ea580c", bg: "#fff7ed", href: "https://nagpurimprovement.gov.in" },
  { name: "Chandigarh",        authority: "GMADA",     state: "Punjab/Haryana",  tags: ["Planned City", "Clean City"],       emoji: "🌿", color: "#16a34a", bg: "#f0fdf4", href: "https://gmada.gov.in" },
  { name: "Vadodara",          authority: "VUDA",      state: "Gujarat",         tags: ["Cultural Capital", "Baroda"],       emoji: "🎨", color: "#9333ea", bg: "#faf5ff", href: "https://vuda.gujarat.gov.in" },
  // Tier 2 - Emerging Markets
  { name: "Visakhapatnam",     authority: "VMRDA",     state: "Andhra Pradesh",  tags: ["Port City", "Beach Corridor"],      emoji: "⛵", color: "#0369a1", bg: "#eff6ff", href: "https://vmrda.gov.in" },
  { name: "Kochi",             authority: "GCDA",      state: "Kerala",          tags: ["Smart Port", "Marine Drive"],       emoji: "🚢", color: "#0891b2", bg: "#ecfeff", href: "https://gcda.kerala.gov.in" },
  { name: "Coimbatore",        authority: "CIDA/TNHB", state: "Tamil Nadu",      tags: ["Manchester of India", "IT Parks"], emoji: "⚙️", color: "#64748b", bg: "#f8fafc", href: "https://tnhb.gov.in" },
  { name: "Thiruvananthapuram",authority: "TRIDA",     state: "Kerala",          tags: ["Technopark Zone", "Govt Hub"],      emoji: "🌴", color: "#16a34a", bg: "#f0fdf4", href: "https://trida.kerala.gov.in" },
  { name: "Kolkata (Satellite)",authority: "KMDA",     state: "West Bengal",     tags: ["New Town", "Rajarhat Zone"],        emoji: "🌆", color: "#7c3aed", bg: "#faf5ff", href: "https://kmda.gov.in" },
  { name: "Agra",              authority: "ADA",       state: "Uttar Pradesh",   tags: ["Tourism Zone", "Heritage"],         emoji: "🕌", color: "#c2600a", bg: "#fff7ed", href: "https://adaagra.gov.in" },
  { name: "Patna",             authority: "BSPHCL",    state: "Bihar",           tags: ["State Capital", "Growing Market"],  emoji: "🏛️", color: "#0d7a68", bg: "#f0fdf8", href: "https://bsphcl.gov.in" },
  { name: "Bhubaneswar",       authority: "BDA-OD",    state: "Odisha",          tags: ["Smart City", "Temple City"],        emoji: "⛩️", color: "#d97706", bg: "#fffbeb", href: "https://bda.odisha.gov.in" },
];

const TIER_LABELS: Record<string, string> = {
  "Tier 1 — Metro Cities": ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Kolkata"].join(","),
  "Tier 2 — Major Markets": ["Ahmedabad", "Pune", "Jaipur", "Noida", "Gurgaon", "Lucknow", "Surat", "Indore", "Bhopal", "Nagpur", "Chandigarh", "Vadodara"].join(","),
  "Tier 2 — Emerging Hubs": ["Visakhapatnam", "Kochi", "Coimbatore", "Thiruvananthapuram", "Kolkata (Satellite)", "Agra", "Patna", "Bhubaneswar"].join(","),
};

export default function CitiesPage() {
  const router = useRouter();
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    if (!router.isReady || router.query.openAlert !== "1") return;
    setAlertOpen(true);
    const nextQuery = { ...router.query };
    delete nextQuery.openAlert;
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  }, [router]);

  return (
    <>
      <Head>
        <title>Top Cities — GovPlot Tracker | Government Plot Schemes Across Major Indian Cities</title>
        <meta name="description" content="Track government residential plot and housing lottery schemes across India's top 25+ cities — Delhi, Mumbai, Bangalore, Hyderabad, Jaipur, Pune, Noida, and more." />
        <link rel="canonical" href="https://govplottracker.com/cities" />
      </Head>
      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <div className="page-container page-top-offset pb-16">
        {/* Header */}
        <div className="mb-10">
          <span className="section-label">Coverage</span>
          <h1 className="text-[36px] sm:text-[44px] font-[Outfit] font-900 text-[--ink-900] mt-1 mb-3">
            Top Cities Across India — One Dashboard
          </h1>
          <p className="text-[15px] text-[--ink-600] max-w-2xl">
            GovPlot Tracker monitors official housing authority portals across India's largest markets — every week for a full data pull, daily for open and active scheme updates. Focused on lottery-based residential plot schemes from the last 5 years.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {[`${CITIES.length}+ Cities`, "Lottery Schemes Focus", "Last 5 Years Data", "Weekly Full Pull", "Daily Status Refresh"].map(t => (
              <span key={t} className="text-[12.5px] font-semibold text-[--ink-500] bg-[--ink-50] border border-[--ink-100] px-3 py-1.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Tier 1 */}
        <div className="mb-10">
          <h2 className="text-[20px] font-[Outfit] font-800 text-[--ink-900] mb-5 flex items-center gap-2">
            <span className="text-[13px] font-bold uppercase tracking-widest bg-[--teal-100] text-[--teal-700] px-3 py-1 rounded-full">Tier 1</span>
            Metro Cities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CITIES.filter(c => ["Delhi","Mumbai","Bangalore","Hyderabad","Chennai","Kolkata"].includes(c.name)).map((city, i) => (
              <CityCard city={city} key={city.name} index={i} />
            ))}
          </div>
        </div>

        {/* Tier 2 major */}
        <div className="mb-10">
          <h2 className="text-[20px] font-[Outfit] font-800 text-[--ink-900] mb-5 flex items-center gap-2">
            <span className="text-[13px] font-bold uppercase tracking-widest bg-[--saffron-100] text-[--saffron-600] px-3 py-1 rounded-full">Tier 2</span>
            Major Markets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CITIES.filter(c => ["Ahmedabad","Pune","Jaipur","Noida","Gurgaon","Lucknow","Surat","Indore","Bhopal","Nagpur","Chandigarh","Vadodara"].includes(c.name)).map((city, i) => (
              <CityCard city={city} key={city.name} index={i} />
            ))}
          </div>
        </div>

        {/* Emerging */}
        <div className="mb-10">
          <h2 className="text-[20px] font-[Outfit] font-800 text-[--ink-900] mb-5 flex items-center gap-2">
            <span className="text-[13px] font-bold uppercase tracking-widest bg-sky-100 text-sky-700 px-3 py-1 rounded-full">Emerging</span>
            Growing Hubs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CITIES.filter(c => !["Delhi","Mumbai","Bangalore","Hyderabad","Chennai","Kolkata","Ahmedabad","Pune","Jaipur","Noida","Gurgaon","Lucknow","Surat","Indore","Bhopal","Nagpur","Chandigarh","Vadodara"].includes(c.name)).map((city, i) => (
              <CityCard city={city} key={city.name} index={i} />
            ))}
          </div>
        </div>

        {/* Coverage note */}
        <div className="card p-6 bg-[--teal-100]/30 border-[--teal-200]/60 text-center">
          <p className="text-[14px] text-[--ink-700]">
            Don't see your city? More authorities are added regularly.{" "}
            <Link href="/contact" className="text-[--teal-600] font-semibold underline">Request a city →</Link>
          </p>
        </div>
      </div>

      <Footer />
      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}

function CityCard({ city, index }: { city: typeof CITIES[0]; index: number }) {
  return (
    <article
      className="card card-hover p-6 animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms`, borderTopColor: city.color, borderTopWidth: 3 }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: city.bg }}>
          {city.emoji}
        </div>
        <div>
          <h3 className="text-[17px] font-[Outfit] font-800 text-[--ink-900]">{city.name}</h3>
          <p className="text-[12px] text-[--ink-500]">{city.state}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11.5px] text-[--ink-500]">Authority:</span>
        <span className="text-[12px] font-bold" style={{ color: city.color }}>{city.authority}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {city.tags.map(tag => (
          <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: city.bg, color: city.color }}>
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
        <a href={city.href} target="_blank" rel="noopener noreferrer"
          className="btn-secondary flex-shrink-0 text-[12px] py-2.5 px-3">
          Official ↗
        </a>
      </div>
    </article>
  );
}
