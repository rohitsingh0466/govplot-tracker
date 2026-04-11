import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuthModal from "../components/AuthModal";

const DATA_SOURCES = [
  { city: "Greater Noida", authority: "YEIDA",  url: "yamunaexpresswayauthority.com", emoji: "🏆" },
  { city: "Lucknow",       authority: "LDA",    url: "ldalucknow.in",                 emoji: "🕌" },
  { city: "Jaipur",        authority: "JDA",    url: "jda.rajasthan.gov.in",          emoji: "🏰" },
  { city: "Agra",          authority: "ADA",    url: "adaagra.org.in",                emoji: "🕍" },
  { city: "Prayagraj",     authority: "PDA",    url: "pdaprayagraj.org",              emoji: "🏛️" },
  { city: "Chandigarh",    authority: "GMADA",  url: "gmada.gov.in",                  emoji: "🌿" },
  { city: "Navi Mumbai",   authority: "CIDCO",  url: "cidco.maharashtra.gov.in",      emoji: "🏙️" },
  { city: "Hyderabad",     authority: "HMDA",   url: "hmda.gov.in",                   emoji: "🔬" },
  { city: "Pune",          authority: "PMRDA",  url: "pmrda.gov.in",                  emoji: "🎓" },
  { city: "Bengaluru",     authority: "BDA",    url: "bdabangalore.org",              emoji: "💻" },
  { city: "Raipur",        authority: "NRDA",   url: "nava-raipur.com",               emoji: "🌾" },
  { city: "Varanasi",      authority: "VDA",    url: "vdavns.com",                    emoji: "🪔" },
  { city: "Bhubaneswar",   authority: "BDA-OD", url: "bda.odisha.gov.in",             emoji: "⛩️" },
  { city: "Nagpur",        authority: "NIT",    url: "nitnagpur.org",                 emoji: "🟠" },
  { city: "Ahmedabad",     authority: "AUDA",   url: "auda.org.in",                   emoji: "🏭" },
  { city: "Delhi",         authority: "DDA",    url: "dda.gov.in",                    emoji: "🏛️" },
  { city: "Bhopal",        authority: "VP-BPL", url: "vpasthan.com",                  emoji: "💧" },
  { city: "Udaipur",       authority: "UIT",    url: "uitudaipur.org",                emoji: "🌊" },
  { city: "Dehradun",      authority: "MDDA",   url: "mddaonline.in",                 emoji: "⛰️" },
  { city: "Meerut",        authority: "MDA",    url: "mda.up.gov.in",                 emoji: "🚆" },
];

const HOW_IT_WORKS = [
  { step: "01", icon: "🤖", title: "Automated Monitoring", desc: "GovPlot Tracker continuously monitors official housing authority portals and refreshes scheme availability on a scheduled basis — without you having to check dozens of government websites manually." },
  { step: "02", icon: "✅", title: "Independent Verification", desc: "Each scheme listing goes through an additional confidence check using trusted public signals, helping surface schemes that are timely, credible, and relevant." },
  { step: "03", icon: "📊", title: "Unified Data Format", desc: "Information from different authorities is cleaned and normalised into one consistent format — scheme names, status, pricing, dates, and plot details — easy to compare at a glance." },
  { step: "04", icon: "🔔", title: "Instant Notifications", desc: "When a scheme opens or changes status, Pro and Premium subscribers are notified promptly via Email, Telegram, or WhatsApp (Premium only)." },
];

const WHY_USE = [
  { icon: "🚀", title: "Always fresh data",          desc: "Scheme statuses are refreshed regularly. Active and open schemes are prioritised so you always see what matters most right now." },
  { icon: "🔔", title: "Multi-channel alerts",        desc: "Email, Telegram, and WhatsApp (Premium) — choose what works for you. Never miss a lottery window again." },
  { icon: "🏙️", title: "Curated top 20 cities", desc: "The watchlist now focuses on the markets where lottery demand, infrastructure growth, and scheme frequency are strongest." },
  { icon: "🆓", title: "Free account — full access", desc: "Sign up free to view scheme details across the 20-city watchlist. Pro and Premium plans unlock city alert subscriptions." },
  { icon: "🔒", title: "Official sources only",      desc: "We link directly to government portals. Only recent, lottery-based residential plot schemes — no stale data." },
  { icon: "✅", title: "Confidence-scored listings", desc: "Each scheme is reviewed for reliability before appearing on your dashboard. Higher-confidence schemes are surfaced first." },
];

export default function AboutPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("govplot_auth_user") : null;
    setIsLoggedIn(!!raw);
    const handler = () => setIsLoggedIn(!!localStorage.getItem("govplot_auth_user"));
    window.addEventListener("govplot-auth-changed", handler);
    return () => window.removeEventListener("govplot-auth-changed", handler);
  }, []);

  return (
    <>
      <Head>
        <title>About — GovPlot Tracker | India's Government Plot Scheme Monitor</title>
        <meta name="description" content="GovPlot Tracker monitors government residential plot lottery schemes across India's curated top 20 high-demand cities. Learn how the watchlist works." />
        <link rel="canonical" href="https://govplottracker.com/about" />
      </Head>
      <Navbar />

      <div className="page-container page-top-offset pb-20">
        <div className="max-w-3xl mb-16 animate-fade-in-up">
          <h1 className="text-[40px] sm:text-[52px] font-[Outfit] font-900 text-[--ink-900] mt-2 mb-5" style={{ lineHeight: 1.1 }}>
            India's focused{" "}
            <span className="bg-gradient-to-r from-[--teal-600] to-[--teal-400] bg-clip-text text-transparent">plot scheme tracker</span>
          </h1>
          <p className="text-[17px] text-[--ink-600] leading-relaxed">
            GovPlot Tracker monitors official housing authority portals for a curated 20-city watchlist, built around demand, infrastructure momentum, and recurring government residential plot lottery activity.
          </p>
        </div>

        <div className="card p-8 sm:p-10 mb-8 bg-gradient-to-br from-[--teal-100]/40 to-white border-[--teal-200]/60">
          <h2 className="text-[24px] font-[Outfit] font-800 text-[--ink-900] mb-4">🏠 What is GovPlot Tracker?</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-[14.5px] text-[--ink-700] leading-relaxed">
            <p>Whether you're tracking <strong>YEIDA near Jewar Airport</strong>, <strong>LDA in Lucknow</strong>, <strong>JDA in Jaipur</strong>, or <strong>BDA in Bengaluru</strong>, GovPlot Tracker brings official-source scheme updates into one cleaner view.</p>
            <p>The product now favours depth over sprawl: top-20 city coverage, lottery-only residential plot focus, official links, and alerts for buyers who need to move before short application windows close.</p>
          </div>
        </div>

        <div className="mb-12">
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

        <div className="mb-12">
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

        <div className="mb-14">
          <h2 className="text-[26px] font-[Outfit] font-800 text-[--ink-900] mt-1 mb-3">20-city authority watchlist</h2>
          <p className="text-[14px] text-[--ink-600] mb-6 max-w-2xl">The watchlist is intentionally smaller now: each city is ranked by demand, scheme relevance, and infrastructure tailwinds.</p>
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
          <p className="text-[12.5px] text-[--ink-500] mt-4">Scheme rows appear as sources publish usable residential plot lottery data. Some watched cities may temporarily have no active scheme rows.</p>
        </div>

        <div className="bg-gradient-to-r from-[--teal-700] to-[--teal-900] rounded-3xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-[28px] font-[Outfit] font-800 mb-3">Ready to never miss a scheme?</h2>
          <p className="text-[15px] text-[--teal-300] mb-7 max-w-lg mx-auto">
            Sign up free to see all scheme details. Upgrade to stay updated with active scheme opening alerts.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {!isLoggedIn ? (
              <button onClick={() => setAuthOpen(true)} className="btn-primary text-[15px] py-3.5 px-8 bg-white text-[--teal-700] hover:bg-[--teal-50]">
                🔓 Sign Up Free
              </button>
            ) : (
              <Link href="/dashboard" className="btn-primary text-[15px] py-3.5 px-8 bg-white text-[--teal-700] hover:bg-[--teal-50]">
                My Dashboard
              </Link>
            )}
            <Link href="/pricing" className="btn-ghost text-[15px] py-3.5 px-8 text-white border-white/30 hover:bg-white/10">
              View Plans →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
