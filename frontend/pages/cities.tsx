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

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200", green: "bg-green-50 border-green-200",
  purple: "bg-purple-50 border-purple-200", orange: "bg-orange-50 border-orange-200",
  teal: "bg-teal-50 border-teal-200", indigo: "bg-indigo-50 border-indigo-200",
  red: "bg-red-50 border-red-200", cyan: "bg-cyan-50 border-cyan-200",
  yellow: "bg-yellow-50 border-yellow-200",
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

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏙️ Tracked Cities</h1>
          <p className="text-gray-500">9 major Indian cities • IT hubs, tourism destinations & government capitals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CITIES.map(city => (
            <div key={city.name} className={`rounded-xl border p-5 ${COLOR_MAP[city.color]}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{city.emoji}</span>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">{city.name}</h2>
                  <p className="text-xs text-gray-500">{city.state}</p>
                </div>
              </div>

              <div className="mb-3">
                <span className="text-xs font-semibold text-gray-500">Authority: </span>
                <span className="text-xs font-bold text-gray-800">{city.authority}</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {city.tags.map(tag => (
                  <span key={tag} className="text-xs bg-white/70 border border-white px-2 py-0.5 rounded-full text-gray-600">{tag}</span>
                ))}
              </div>

              <div className="flex gap-2">
                <a
                  href={`/?city=${city.name}`}
                  className="flex-1 text-center bg-white border border-gray-300 hover:border-blue-400 text-gray-700 text-xs font-semibold py-2 rounded-lg transition"
                >
                  View Schemes →
                </a>
                <a
                  href={city.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center bg-white border border-gray-300 hover:border-blue-400 text-gray-500 text-xs font-semibold px-3 py-2 rounded-lg transition"
                >
                  🌐
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>

      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
