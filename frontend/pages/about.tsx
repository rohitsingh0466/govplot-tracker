import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AlertModal from "../components/AlertModal";

const DATA_SOURCES = [
  { city: "Lucknow",    authority: "LDA",       url: "lda.up.nic.in",               emoji: "🏛️" },
  { city: "Bangalore",  authority: "BDA",        url: "bdabangalore.org",             emoji: "💻" },
  { city: "Noida",      authority: "GNIDA/NUDA", url: "noidaauthorityonline.in",      emoji: "🏙️" },
  { city: "Gurgaon",    authority: "HSVP",       url: "hsvphry.gov.in",               emoji: "🏢" },
  { city: "Hyderabad",  authority: "HMDA",       url: "hmda.gov.in",                  emoji: "🔬" },
  { city: "Pune",       authority: "PMRDA",      url: "pmrda.gov.in",                 emoji: "🎓" },
  { city: "Mumbai",     authority: "MHADA",      url: "mhada.gov.in",                 emoji: "🌊" },
  { city: "Chandigarh", authority: "GMADA",      url: "gmada.gov.in",                 emoji: "🌿" },
  { city: "Agra",       authority: "ADA",        url: "adaagra.gov.in",               emoji: "🕌" },
];

const HOW_IT_WORKS = [
  { step: "01", icon: "🤖", title: "Automated Scraping",     desc: "Our bots run every 6 hours via GitHub Actions, scanning all 9 official government authority portals." },
  { step: "02", icon: "📊", title: "Data Normalisation",     desc: "Raw HTML is parsed and standardised — scheme name, status, dates, prices, and plot count are extracted." },
  { step: "03", icon: "🔔", title: "Instant Notifications",  desc: "The moment a scheme status changes — OPEN, UPCOMING, CLOSED — you get an alert via Email, Telegram, or WhatsApp." },
  { step: "04", icon: "📱", title: "Live Dashboard",         desc: "Every visitor sees scheme data as fresh as 6 hours old. No stale listings, no manual updates." },
];

const WHY_USE = [
  { icon: "🚀", title: "Real-time updates",     desc: "6-hour scraper cycle means you always see the latest scheme status." },
  { icon: "🔔", title: "Multi-channel alerts",  desc: "Email, Telegram, and WhatsApp — choose what works for you." },
  { icon: "🏙️", title: "Multi-city coverage",   desc: "9 major cities, 12+ authorities, all in one place." },
  { icon: "🆓", title: "Free tier forever",     desc: "Track 2 cities and receive email alerts at no cost, ever." },
  { icon: "🔒", title: "Official sources only", desc: "We link directly to government portals — no middlemen, no fabricated data." },
  { icon: "📊", title: "Scheme comparison",     desc: "Compare prices, plot sizes, and deadlines across cities side by side." },
];

export default function AboutPage() {
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
        <title>About — GovPlot Tracker | India's Government Plot Scheme Monitor</title>
        <meta name="description" content="GovPlot Tracker monitors government residential plot schemes across 9 major Indian cities. Learn how our automated scraper works and why 10,000+ buyers trust us." />
        <link rel="canonical" href="https://govplottracker.com/about" />
      </Head>
      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <div className="page-container pt-12 pb-20">

        {/* Hero */}
        <div className="max-w-3xl mb-16 animate-fade-in-up">
          <span className="section-label">About Us</span>
          <h1 className="text-[40px] sm:text-[52px] font-[Outfit] font-900 text-[--ink-900] mt-2 mb-5" style={{ lineHeight: 1.1 }}>
            India's most complete{" "}
            <span className="bg-gradient-to-r from-[--teal-600] to-[--teal-400] bg-clip-text text-transparent">
              plot scheme tracker
            </span>
          </h1>
          <p className="text-[17px] text-[--ink-600] leading-relaxed">
            GovPlot Tracker is a free tool that automatically monitors official housing authority portals across 9 major Indian cities — so you never miss an application window for a government residential plot scheme.
          </p>
        </div>

        {/* What is it */}
        <div className="card p-8 sm:p-10 mb-8 bg-gradient-to-br from-[--teal-100]/40 to-white border-[--teal-200]/60">
          <h2 className="text-[24px] font-[Outfit] font-800 text-[--ink-900] mb-4">🏠 What is GovPlot Tracker?</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-[14.5px] text-[--ink-700] leading-relaxed">
            <p>
              Whether you're looking for an affordable plot from <strong>LDA in Lucknow</strong>, a premium site from <strong>BDA in Bangalore</strong>, or a lottery plot from <strong>MHADA in Mumbai</strong> — GovPlot Tracker gives you instant visibility without checking 9 different government websites.
            </p>
            <p>
              Our scrapers run every 6 hours, parsing official portals for scheme name, status, open/close dates, plot count, price range, and application links. When anything changes, we push alerts to your preferred channel.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-12">
          <span className="section-label">Process</span>
          <h2 className="text-[26px] font-[Outfit] font-800 text-[--ink-900] mt-1 mb-7">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map(({ step, icon, title, desc }) => (
              <div key={step} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-[Outfit] font-800 text-[--teal-500] bg-[--teal-100] px-2 py-0.5 rounded-lg">{step}</span>
                  <span className="text-xl">{icon}</span>
                </div>
                <h3 className="text-[14px] font-[Outfit] font-700 text-[--ink-900] mb-1.5">{title}</h3>
                <p className="text-[12.5px] text-[--ink-600] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why use */}
        <div className="mb-12">
          <span className="section-label">Benefits</span>
          <h2 className="text-[26px] font-[Outfit] font-800 text-[--ink-900] mt-1 mb-7">Why use GovPlot Tracker?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY_USE.map(({ icon, title, desc }) => (
              <div key={title} className="card p-5 flex gap-4">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <h3 className="text-[14px] font-[Outfit] font-700 text-[--ink-900] mb-1">{title}</h3>
                  <p className="text-[12.5px] text-[--ink-600] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data sources */}
        <div className="mb-14">
          <span className="section-label">Data Sources</span>
          <h2 className="text-[26px] font-[Outfit] font-800 text-[--ink-900] mt-1 mb-3">Official government portals only</h2>
          <p className="text-[14px] text-[--ink-600] mb-6 max-w-2xl">
            All data is sourced directly from official authority websites. We don't alter, editorialize, or filter any information.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DATA_SOURCES.map(({ city, authority, url, emoji }) => (
              <div key={city} className="card p-4 flex items-center gap-3 hover:border-[--teal-300] transition">
                <span className="text-2xl">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-[Outfit] font-700 text-[--ink-900]">{city}</p>
                  <p className="text-[11.5px] font-semibold text-[--teal-600]">{authority}</p>
                  <p className="text-[11px] text-[--ink-400] truncate">{url}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[--teal-700] to-[--teal-900] rounded-3xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-[28px] font-[Outfit] font-800 mb-3">Ready to never miss a scheme?</h2>
          <p className="text-[15px] text-[--teal-300] mb-7 max-w-lg mx-auto">
            Subscribe in 30 seconds. Free forever. No spam.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => setAlertOpen(true)} className="btn-primary text-[15px] py-3.5 px-8 bg-white text-[--teal-700] hover:bg-[--teal-50]">
              🔔 Get Free Alerts
            </button>
            <Link href="/pricing" className="btn-ghost text-[15px] py-3.5 px-8 text-white border-white/30 hover:bg-white/10">
              View Plans →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
