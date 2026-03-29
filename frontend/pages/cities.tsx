import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AlertModal from "../components/AlertModal";

const CITIES = [
  { name: "Lucknow",    authority: "LDA",       state: "Uttar Pradesh",  tags: ["Govt Capital", "Growing Fast"], emoji: "🏛️", color: "#0d7a68", bg: "#f0fdf8", href: "https://lda.up.nic.in" },
  { name: "Bangalore",  authority: "BDA",        state: "Karnataka",       tags: ["IT Hub", "High Demand"],        emoji: "💻", color: "#0369a1", bg: "#f0f9ff", href: "https://bdabangalore.org" },
  { name: "Noida",      authority: "GNIDA/NUDA", state: "Uttar Pradesh",  tags: ["NCR", "Expressway Zone"],       emoji: "🏙️", color: "#6d28d9", bg: "#f5f3ff", href: "https://noidaauthorityonline.in" },
  { name: "Gurgaon",    authority: "HSVP",       state: "Haryana",         tags: ["Corporate Hub", "NCR"],         emoji: "🏢", color: "#b45309", bg: "#fffbeb", href: "https://hsvphry.gov.in" },
  { name: "Hyderabad",  authority: "HMDA",       state: "Telangana",       tags: ["IT Corridor", "Pharma Hub"],    emoji: "🔬", color: "#0e7490", bg: "#ecfeff", href: "https://hmda.gov.in" },
  { name: "Pune",       authority: "PMRDA",      state: "Maharashtra",     tags: ["Education Hub", "Auto Belt"],   emoji: "🎓", color: "#4338ca", bg: "#eef2ff", href: "https://pmrda.gov.in" },
  { name: "Mumbai",     authority: "MHADA",      state: "Maharashtra",     tags: ["Finance Capital", "Premium"],   emoji: "🌊", color: "#be123c", bg: "#fff1f2", href: "https://mhada.gov.in" },
  { name: "Chandigarh", authority: "GMADA",      state: "Punjab/Haryana",  tags: ["Planned City", "Clean City"],   emoji: "🌿", color: "#15803d", bg: "#f0fdf4", href: "https://gmada.gov.in" },
  { name: "Agra",       authority: "ADA",        state: "Uttar Pradesh",  tags: ["Tourism Zone", "Heritage"],     emoji: "🕌", color: "#c2600a", bg: "#fff7ed", href: "https://adaagra.gov.in" },
];

export default function CitiesPage() {
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Cities — GovPlot Tracker | Track Schemes in 9 Major Indian Cities</title>
        <meta name="description" content="Track government residential plot schemes in Lucknow, Bangalore, Noida, Gurgaon, Hyderabad, Pune, Mumbai, Chandigarh and Agra." />
        <link rel="canonical" href="https://govplottracker.com/cities" />
      </Head>
      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <div className="page-container pt-10 pb-16">
        {/* Header */}
        <div className="mb-10">
          <span className="section-label">Coverage</span>
          <h1 className="text-[36px] sm:text-[44px] font-[Outfit] font-900 text-[--ink-900] mt-1 mb-3">
            9 Major Markets, One Dashboard
          </h1>
          <p className="text-[15px] text-[--ink-600] max-w-2xl">
            We track the official housing authority portals for each city every 6 hours — so you always know what's open, upcoming, or just closed.
          </p>
        </div>

        {/* City grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CITIES.map((city, i) => (
            <article
              key={city.name}
              className="card card-hover p-6 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms`, borderTopColor: city.color, borderTopWidth: 3 }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: city.bg }}
                >
                  {city.emoji}
                </div>
                <div>
                  <h2 className="text-[18px] font-[Outfit] font-800 text-[--ink-900]">{city.name}</h2>
                  <p className="text-[12px] text-[--ink-500]">{city.state}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11.5px] text-[--ink-500]">Authority:</span>
                <span className="text-[12px] font-bold" style={{ color: city.color }}>{city.authority}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {city.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: city.bg, color: city.color }}
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
          ))}
        </div>
      </div>

      <Footer />
      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
