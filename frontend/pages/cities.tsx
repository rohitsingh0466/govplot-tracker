import Head from "next/head";
import Navbar from "../components/Navbar";
import { useState } from "react";
import AlertModal from "../components/AlertModal";

const CITIES = [
  { name: "Lucknow", authority: "LDA", state: "Uttar Pradesh", tags: ["Govt Capital", "Fast Growth"], color: "teal", emoji: "🏛️", url: "https://lda.up.nic.in" },
  { name: "Bangalore", authority: "BDA", state: "Karnataka", tags: ["IT Hub", "High Demand"], color: "emerald", emoji: "💻", url: "https://bdabangalore.org" },
  { name: "Noida", authority: "GNIDA/NUDA", state: "Uttar Pradesh", tags: ["NCR", "Expressway"], color: "sky", emoji: "🏙️", url: "https://noidaauthorityonline.in" },
  { name: "Gurgaon", authority: "HSVP", state: "Haryana", tags: ["Corporate", "NCR"], color: "amber", emoji: "🏢", url: "https://hsvphry.gov.in" },
  { name: "Hyderabad", authority: "HMDA", state: "Telangana", tags: ["IT Corridor", "Pharma"], color: "cyan", emoji: "🔬", url: "https://hmda.gov.in" },
  { name: "Pune", authority: "PMRDA", state: "Maharashtra", tags: ["Education", "Auto Hub"], color: "indigo", emoji: "🎓", url: "https://pmrda.gov.in" },
  { name: "Mumbai", authority: "MHADA", state: "Maharashtra", tags: ["Finance", "Premium Land"], color: "rose", emoji: "🌊", url: "https://mhada.gov.in" },
  { name: "Chandigarh", authority: "GMADA", state: "Punjab/Haryana", tags: ["Planned City", "Clean City"], color: "lime", emoji: "🌿", url: "https://gmada.gov.in" },
  { name: "Agra", authority: "ADA", state: "Uttar Pradesh", tags: ["Tourism", "Heritage"], color: "orange", emoji: "🕌", url: "https://adaagra.gov.in" },
];

const COLOR_MAP: Record<string, { bg: string; text: string; button: string; chip: string }> = {
  teal: { bg: "from-teal-50 to-cyan-50", text: "text-teal-800", button: "from-teal-600 to-cyan-700", chip: "bg-teal-100 text-teal-800" },
  emerald: { bg: "from-emerald-50 to-green-50", text: "text-emerald-800", button: "from-emerald-600 to-green-700", chip: "bg-emerald-100 text-emerald-800" },
  sky: { bg: "from-sky-50 to-blue-50", text: "text-sky-800", button: "from-sky-600 to-blue-700", chip: "bg-sky-100 text-sky-800" },
  amber: { bg: "from-amber-50 to-orange-50", text: "text-amber-800", button: "from-amber-500 to-orange-600", chip: "bg-amber-100 text-amber-800" },
  cyan: { bg: "from-cyan-50 to-slate-50", text: "text-cyan-800", button: "from-cyan-600 to-slate-700", chip: "bg-cyan-100 text-cyan-800" },
  indigo: { bg: "from-indigo-50 to-violet-50", text: "text-indigo-800", button: "from-indigo-600 to-violet-700", chip: "bg-indigo-100 text-indigo-800" },
  rose: { bg: "from-rose-50 to-pink-50", text: "text-rose-800", button: "from-rose-600 to-pink-700", chip: "bg-rose-100 text-rose-800" },
  lime: { bg: "from-lime-50 to-emerald-50", text: "text-lime-800", button: "from-lime-600 to-emerald-700", chip: "bg-lime-100 text-lime-800" },
  orange: { bg: "from-orange-50 to-amber-50", text: "text-orange-800", button: "from-orange-600 to-amber-700", chip: "bg-orange-100 text-orange-800" },
};

export default function CitiesPage() {
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Cities - GovPlot Tracker</title>
        <meta
          name="description"
          content="Track government residential plot schemes in Lucknow, Bangalore, Noida, Gurgaon, Hyderabad, Pune, Mumbai, Chandigarh and Agra."
        />
      </Head>

      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <section className="mb-10 rounded-3xl border border-amber-100 bg-white/85 px-6 py-8 shadow-sm sm:mb-14 sm:px-10 sm:py-12">
          <h1 className="mb-3 text-3xl font-bold text-slate-900 sm:text-5xl">
            City Coverage
            <span className="block bg-gradient-to-r from-teal-700 via-cyan-700 to-slate-900 bg-clip-text text-transparent">9 Major Markets Across India</span>
          </h1>
          <p className="max-w-3xl text-base text-slate-600 sm:text-xl">
            Explore plot scheme authorities, official portals, and city-level demand hotspots from one curated map of opportunities.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((city, i) => {
            const colors = COLOR_MAP[city.color];
            return (
              <article
                key={city.name}
                className={`animate-fade-in-up overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br ${colors.bg} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:p-6`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-xl bg-white p-3 text-3xl shadow-sm">{city.emoji}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{city.name}</h2>
                    <p className="text-sm font-medium text-slate-600">{city.state}</p>
                  </div>
                </div>

                <div className="mb-3 text-sm">
                  <span className="text-slate-500">Authority: </span>
                  <span className={`font-bold ${colors.text}`}>{city.authority}</span>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  {city.tags.map((tag) => (
                    <span key={tag} className={`rounded-full px-3 py-1 text-xs font-semibold ${colors.chip}`}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/?city=${city.name}`}
                    className={`flex-1 rounded-xl bg-gradient-to-r ${colors.button} py-2.5 text-center text-sm font-bold text-white transition hover:opacity-95`}
                  >
                    View Schemes
                  </a>
                  <a
                    href={city.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Official Site
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
