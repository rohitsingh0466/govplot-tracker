import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AlertModal from "../components/AlertModal";

const DATA_SOURCES = [
  { city: "Delhi",             authority: "DDA",        url: "dda.gov.in",                   emoji: "🏛️" },
  { city: "Mumbai",            authority: "MHADA",      url: "mhada.gov.in",                 emoji: "🌊" },
  { city: "Navi Mumbai",       authority: "CIDCO",      url: "cidcohomes.com",               emoji: "🏙️" },
  { city: "Lucknow",           authority: "LDA",        url: "lda.up.nic.in",                emoji: "🕌" },
  { city: "Bangalore",         authority: "BDA",        url: "bdabangalore.org",             emoji: "💻" },
  { city: "Noida",             authority: "GNIDA/YEIDA",url: "noidaauthorityonline.in",      emoji: "🏙️" },
  { city: "Gurgaon",           authority: "HSVP",       url: "hsvphry.gov.in",               emoji: "🏢" },
  { city: "Hyderabad",         authority: "HMDA",       url: "hmda.gov.in",                  emoji: "🔬" },
  { city: "Pune",              authority: "PMRDA",      url: "pmrda.gov.in",                 emoji: "🎓" },
  { city: "Jaipur",            authority: "JDA/RHB",    url: "jda.gov.in",                   emoji: "🏰" },
  { city: "Ahmedabad",         authority: "AUDA",       url: "auda.org.in",                  emoji: "🏭" },
  { city: "Chandigarh",        authority: "GMADA",      url: "gmada.gov.in",                 emoji: "🌿" },
  { city: "Chennai",           authority: "CMDA/TNHB",  url: "cmdachennai.gov.in",           emoji: "🎭" },
  { city: "Indore",            authority: "IDA",        url: "ida.mp.gov.in",                emoji: "🌟" },
  { city: "Kolkata",           authority: "KMDA/WBHB",  url: "kmda.gov.in",                  emoji: "🌉" },
  { city: "Bhubaneswar",       authority: "BDA-OD",     url: "bda.odisha.gov.in",            emoji: "⛩️" },
  { city: "Visakhapatnam",     authority: "VMRDA",      url: "vmrda.gov.in",                 emoji: "⛵" },
  { city: "Kochi",             authority: "GCDA",       url: "gcda.kerala.gov.in",           emoji: "🚢" },
];

const HOW_IT_WORKS = [
  { step: "01", icon: "🤖", title: "Automated Weekly Scraping",   desc: "GovPlot Tracker continuously monitors official housing authority portals and refreshes scheme availability on a scheduled basis, so newly announced opportunities surface quickly." },
  { step: "02", icon: "✅", title: "Cross-Verification",          desc: "Each listing goes through an additional confidence check using trusted public signals, helping highlight schemes that appear timely, credible, and relevant before you act." },
  { step: "03", icon: "📊", title: "Data Normalisation",          desc: "Information from different authorities is cleaned into one consistent format, making scheme names, status, pricing, dates, and plot details easy to compare at a glance." },
  { step: "04", icon: "🔔", title: "Instant Notifications",       desc: "When a scheme opens, changes status, or moves closer to application deadlines, you can be notified promptly through the channels that work best for you." },
];

const WHY_USE = [
  { icon: "🚀", title: "Weekly full pull + daily refresh", desc: "Complete data refresh every Sunday. Daily mode updates only active scheme statuses — 85% less scraping load." },
  { icon: "🔔", title: "Multi-channel alerts",             desc: "Email, Telegram, and WhatsApp — choose what works for you." },
  { icon: "🏙️", title: "100+ cities, 50+ authorities",    desc: "Every major housing authority in India, all in one dashboard." },
  { icon: "🆓", title: "Free tier forever",                desc: "Track 2 cities and receive email alerts at no cost, ever." },
  { icon: "🔒", title: "Official sources only",            desc: "We link directly to government portals. 5-year data filter — no stale schemes." },
  { icon: "✅", title: "Verified schemes",                 desc: "Each scheme gets a 0–5 verification score based on news and property portals." },
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
        <meta name="description" content="GovPlot Tracker monitors government residential plot lottery schemes across 100+ major Indian cities with 58 scrapers. Learn how our automated system works." />
        <link rel="canonical" href="https://govplottracker.com/about" />
      </Head>
      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <div className="page-container page-top-offset pb-20">
        <div className="max-w-3xl mb-16 animate-fade-in-up">
          <span className="section-label">About Us</span>
          <h1 className="text-[40px] sm:text-[52px] font-[Outfit] font-900 text-[--ink-900] mt-2 mb-5" style={{ lineHeight: 1.1 }}>
            India's most complete{" "}
            <span className="bg-gradient-to-r from-[--teal-600] to-[--teal-400] bg-clip-text text-transparent">
              plot scheme tracker
            </span>
          </h1>
          <p className="text-[17px] text-[--ink-600] leading-relaxed">
            GovPlot Tracker is a free tool that automatically monitors official housing authority portals across 100+ major Indian cities — so you never miss an application window for a government residential plot lottery scheme.
          </p>
        </div>

        <div className="card p-8 sm:p-10 mb-8 bg-gradient-to-br from-[--teal-100]/40 to-white border-[--teal-200]/60">
          <h2 className="text-[24px] font-[Outfit] font-800 text-[--ink-900] mb-4">🏠 What is GovPlot Tracker?</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-[14.5px] text-[--ink-700] leading-relaxed">
            <p>
              Whether you're looking for a plot from <strong>LDA in Lucknow</strong>, a lottery site from <strong>BDA in Bangalore</strong>, or a mass housing unit from <strong>CIDCO in Navi Mumbai</strong> — GovPlot Tracker gives you instant visibility without checking 50+ different government websites.
            </p>
            <p>
              We bring scattered government scheme information into one reliable view, keep the data fresh with scheduled updates, and focus on recent lottery-based residential opportunities that people can still act on.
            </p>
          </div>
        </div>

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

        <div className="mb-14">
          <span className="section-label">Data Sources</span>
          <h2 className="text-[26px] font-[Outfit] font-800 text-[--ink-900] mt-1 mb-3">50+ official government portals</h2>
          <p className="text-[14px] text-[--ink-600] mb-6 max-w-2xl">
            All data is sourced directly from official authority websites across 23 Indian states and UTs. We don't alter, editorialize, or filter any information.
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
          <p className="text-[12.5px] text-[--ink-500] mt-4">+ 30 more authorities across Rajasthan, Gujarat, Bihar, Jharkhand, Chhattisgarh, Uttarakhand, J&K, Goa, Assam, HP, and Northeast India.</p>
        </div>

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
