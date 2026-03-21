import Head from "next/head";
import Navbar from "../components/Navbar";
import { useState } from "react";
import AlertModal from "../components/AlertModal";

export default function AboutPage() {
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <Head>
        <title>About — GovPlot Tracker</title>
        <meta name="description" content="Learn about GovPlot Tracker - India's most comprehensive real-time tracker for government residential plot schemes" />
      </Head>
      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-12 sm:mb-16 animate-fade-in-up px-4 sm:px-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-slate-900 bg-clip-text text-transparent mb-3 sm:mb-4">
            About GovPlot Tracker
          </h1>
          <p className="text-lg sm:text-xl text-slate-600">
            India's most comprehensive real-time monitor for Government Residential Plot Schemes
          </p>
        </div>

        {/* Main content */}
        <div className="space-y-8 sm:space-y-12">
          {/* What is GovPlot */}
          <section className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100 hover:shadow-lg transition mx-4 sm:mx-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">🏠 What is GovPlot Tracker?</h2>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-3 sm:mb-4">
              GovPlot Tracker is your personal assistant for finding government residential plots across India.
              We automatically scan official housing authority portals across <strong>9 major cities</strong> every 6 hours,
              tracking the real-time status of hundreds of schemes.
            </p>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
              Whether you're looking for an affordable plot from <strong>LDA in Lucknow</strong>, a premium site from
              <strong> BDA in Bangalore</strong>, or a lottery plot from <strong>MHADA in Mumbai</strong> —
              GovPlot Tracker gives you instant visibility and alerts you the moment a scheme opens.
            </p>
          </section>

          {/* How it works */}
          <section className="px-4 sm:px-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6">⚙️ How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                { icon: "🤖", title: "Automated Scraping", desc: "Our scrapers run 24/7 via GitHub Actions, scanning official portals every 6 hours" },
                { icon: "📊", title: "Data Normalization", desc: "We parse and standardize scheme data from multiple government sources" },
                { icon: "🔔", title: "Instant Alerts", desc: "Status changes trigger real-time notifications via Email, Telegram & WhatsApp" },
                { icon: "📱", title: "Live Dashboard", desc: "See the latest data updated in real-time — always current and accurate" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 sm:p-6 border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{item.icon}</div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm sm:text-base">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Data sources */}
          <section className="bg-gradient-to-br from-purple-50 to-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100 mx-4 sm:mx-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">🏛️ Official Data Sources</h2>
            <p className="text-base sm:text-lg text-slate-700 mb-4 sm:mb-6">
              All data is sourced directly from official government authority portals. We don't alter, editorialize, or filter any information.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { city: "Lucknow", authority: "LDA", url: "lda.up.nic.in" },
                { city: "Bangalore", authority: "BDA", url: "bdabangalore.org" },
                { city: "Noida", authority: "GNIDA/NUDA", url: "noidaauthorityonline.in" },
                { city: "Gurgaon", authority: "HSVP", url: "hsvphry.gov.in" },
                { city: "Hyderabad", authority: "HMDA", url: "hmda.gov.in" },
                { city: "Pune", authority: "PMRDA", url: "pmrda.gov.in" },
                { city: "Mumbai", authority: "MHADA", url: "mhada.gov.in" },
                { city: "Chandigarh", authority: "GMADA", url: "gmada.gov.in" },
                { city: "Agra", authority: "ADA", url: "agra.up.nic.in" },
              ].map((source, i) => (
                <div key={i} className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200 text-center">
                  <div className="font-bold text-slate-900 text-base sm:text-lg">{source.city}</div>
                  <div className="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2">{source.authority}</div>
                  <div className="text-xs text-slate-500 truncate">{source.url}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Why use it */}
          <section className="px-4 sm:px-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6">✨ Why Use GovPlot Tracker?</h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                "🚀 <strong>Real-time updates</strong> — Never miss a scheme opening",
                "🔔 <strong>Instant alerts</strong> — Get notified via Email, Telegram & WhatsApp",
                "📊 <strong>Compare schemes</strong> — View prices, plot sizes, and dates side-by-side",
                "🏙️ <strong>Multi-city tracking</strong> — Monitor schemes across 9 major Indian cities",
                "🆓 <strong>Completely free</strong> — No registration fees or hidden charges",
              ].map((text, i) => (
                <div key={i} className="bg-white rounded-xl p-4 sm:p-4 border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition">
                  <p className="text-base sm:text-lg text-slate-700" dangerouslySetInnerHTML={{ __html: text }} />
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 sm:p-12 text-center text-white shadow-2xl mx-4 sm:mx-0">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">🔔 Ready to get started?</h2>
            <p className="text-base sm:text-xl mb-6 sm:mb-8 text-blue-100">
              Subscribe to get instant alerts when new schemes open in your city
            </p>
            <button
              onClick={() => setAlertOpen(true)}
              className="bg-white text-blue-700 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-blue-50 transition transform hover:scale-105 shadow-lg text-base sm:text-lg"
            >
              Get Free Alerts →
            </button>
          </section>
        </div>
      </main>

      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
