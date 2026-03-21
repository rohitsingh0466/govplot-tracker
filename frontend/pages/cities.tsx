import Head from "next/head";
import Navbar from "../components/Navbar";
import { useState } from "react";
import AlertModal from "../components/AlertModal";

const CITIES = [
  { name: "Lucknow",    authority: "LDA",        state: "Uttar Pradesh",    tags: ["IT", "Government Capital"], color: "blue",   emoji: "🏛️", url: "https://lda.up.nic.in" },
  { name: "Bangalore",  authority: "BDA",        state: "Karnataka",        tags: ["IT Hub", "Silicon Valley of India"], color: "green",  emoji: "💻", url: "https://bdabangalore.org" },
  { name: "Noida",      authority: "GNIDA/NUDA", state: "Uttar Pradesh",    tags: ["IT", "NCR", "YEIDA"], color: "purple", emoji: "🏙️", url: "https://noidaauthorityonline.in" },
  { name: "Gurgaon",    authority: "HSVP",       state: "Haryana",          tags: ["IT", "Finance Hub", "NCR"], color: "orange", emoji: "🏢", url: "https://hsvphry.gov.in" },
  { name: "Hyderabad",  authority: "HMDA",       state: "Telangana",        tags: ["IT Hub", "Pharma", "HITEC City"], color: "teal",  emoji: "🔬", url: "https://hmda.gov.in" },
  { name: "Pune",       authority: "PMRDA",      state: "Maharashtra",      tags: ["IT", "Education", "Auto Hub"], color: "indigo", emoji: "🎓", url: "https://pmrda.gov.in" },
  { name: "Mumbai",     authority: "MHADA",      state: "Maharashtra",      tags: ["Finance", "Bollywood", "Port City"], color: "red",   emoji: "🌊", url: "https://mhada.gov.in" },
  { name: "Chandigarh", authority: "GMADA",      state: "Punjab/Haryana",   tags: ["Planned City", "Tourism", "Clean City"], color: "cyan",  emoji: "🌿", url: "https://gmada.gov.in" },
  { name: "Agra",       authority: "ADA",        state: "Uttar Pradesh",    tags: ["Tourism", "Heritage", "Taj Mahal"], color: "yellow", emoji: "🕌", url: "https://adaagra.gov.in" },
];

const COLOR_MAP: Record<string, { bg: string; gradient: string; text: string }> = {
  blue: { bg: "bg-blue-50", gradient: "from-blue-500 to-blue-600", text: "text-blue-700" },
  green: { bg: "bg-emerald-50", gradient: "from-emerald-500 to-emerald-600", text: "text-emerald-700" },
  purple: { bg: "bg-purple-50", gradient: "from-purple-500 to-purple-600", text: "text-purple-700" },
  orange: { bg: "bg-orange-50", gradient: "from-orange-500 to-orange-600", text: "text-orange-700" },
  teal: { bg: "bg-teal-50", gradient: "from-teal-500 to-teal-600", text: "text-teal-700" },
  indigo: { bg: "bg-indigo-50", gradient: "from-indigo-500 to-indigo-600", text: "text-indigo-700" },
  red: { bg: "bg-red-50", gradient: "from-red-500 to-red-600", text: "text-red-700" },
  cyan: { bg: "bg-cyan-50", gradient: "from-cyan-500 to-cyan-600", text: "text-cyan-700" },
  yellow: { bg: "bg-amber-50", gradient: "from-amber-500 to-amber-600", text: "text-amber-700" },
};

export default function CitiesPage() {
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Cities — GovPlot Tracker</title>
        <meta name="description" content="Track government residential plot schemes in Lucknow, Bangalore, Noida, Gurgaon, Hyderabad, Pune, Mumbai, Chandigarh and Agra." />
      </Head>

      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 py-14">
        {/* Header */}
        <div className="text-center mb-14 animate-fade-in-up">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-slate-900 bg-clip-text text-transparent mb-3">
            🏙️ 9 Major Cities
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Real-time scheme tracking across India's top IT hubs, tourism destinations, and government capitals
          </p>
        </div>

        {/* City Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CITIES.map((city, i) => {
            const colors = COLOR_MAP[city.color];
            return (
              <div
                key={city.name}
                className={`${colors.bg} rounded-2xl border-2 border-white/50 p-6 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 animate-fade-in-up overflow-hidden group relative`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Gradient accent */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${colors.gradient} rounded-full opacity-10 group-hover:opacity-20 transition`} />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`text-4xl bg-gradient-to-br ${colors.gradient} rounded-xl p-3 text-white shadow-lg`}>
                      {city.emoji}
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-2xl">{city.name}</h2>
                      <p className="text-sm text-slate-600 font-medium">{city.state}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-xs font-bold text-slate-600 block mb-1">Authority:</span>
                    <span className={`text-sm font-bold ${colors.text}`}>{city.authority}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {city.tags.map(tag => (
                      <span key={tag} className={`text-xs font-semibold px-3 py-1 rounded-full bg-white/80 ${colors.text} border-2 border-white/50`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`/?city=${city.name}`}
                      className={`flex-1 text-center bg-gradient-to-r ${colors.gradient} text-white text-sm font-bold py-3 rounded-xl hover:shadow-lg transition transform hover:scale-105`}
                    >
                      View Schemes →
                    </a>
                    <a
                      href={city.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-center bg-white text-2xl py-3 px-4 rounded-xl border-2 ${colors.text} border-opacity-30 hover:shadow-lg transition transform hover:scale-105`}
                    >
                      🌐
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
