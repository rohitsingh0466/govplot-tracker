import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AlertModal from "../../components/AlertModal";
import AdSenseSlot from "../../components/AdSenseSlot";
import { useState } from "react";

type Scheme = {
  scheme_id: string; name: string; city: string; authority: string; status: string;
  open_date?: string | null; close_date?: string | null; total_plots?: number | null;
  price_min?: number | null; price_max?: number | null;
  area_sqft_min?: number | null; area_sqft_max?: number | null;
  location_details?: string | null; apply_url?: string | null; source_url?: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800 border-green-200",
  ACTIVE: "bg-sky-100 text-sky-800 border-sky-200",
  UPCOMING: "bg-amber-100 text-amber-800 border-amber-200",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function SchemeDetailPage({ scheme }: { scheme: Scheme }) {
  const [alertOpen, setAlertOpen] = useState(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://govplottracker.com";
  const canonicalUrl = `${siteUrl}/schemes/${scheme.scheme_id}`;
  const title = `${scheme.name} | ${scheme.city} Plot Scheme`;
  const description = `${scheme.name} by ${scheme.authority} in ${scheme.city}. Status: ${scheme.status}. Track dates, plots, pricing on GovPlot Tracker.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "Article",
          headline: title, description, mainEntityOfPage: canonicalUrl,
        })}} />
      </Head>

      <Navbar onAlertClick={() => setAlertOpen(true)} />

      {/* Top ad */}
      <div className="page-container pt-4">
        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEME_TOP} format="horizontal" label="Scheme Detail — Top Ad" />
      </div>

      <div className="page-container pt-8 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12.5px] text-[--ink-500] mb-6">
          <Link href="/" className="hover:text-[--teal-600]">Home</Link>
          <span>/</span>
          <Link href="/schemes" className="hover:text-[--teal-600]">Schemes</Link>
          <span>/</span>
          <span className="text-[--ink-700] font-medium line-clamp-1">{scheme.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div>
            {/* Hero card */}
            <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] rounded-3xl p-8 mb-6 text-white">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[scheme.status] || STATUS_COLORS.ACTIVE}`}>
                  {scheme.status}
                </span>
                <span className="text-[12px] text-[--teal-300] bg-[--teal-800]/40 border border-[--teal-700]/30 px-3 py-1 rounded-full">
                  {scheme.city}
                </span>
                <span className="text-[12px] text-[--teal-300] bg-[--teal-800]/40 border border-[--teal-700]/30 px-3 py-1 rounded-full">
                  {scheme.authority}
                </span>
              </div>
              <h1 className="text-[24px] sm:text-[30px] font-[Outfit] font-800 leading-tight mb-3">{scheme.name}</h1>
              <p className="text-[14px] text-[--teal-300]/80 leading-relaxed">
                Track this government residential plot scheme — dates, availability, pricing and official application links.
              </p>
            </div>

            {/* Info grid */}
            <div className="card p-6 mb-6">
              <h2 className="text-[18px] font-[Outfit] font-700 text-[--ink-900] mb-5">Scheme Snapshot</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "City", value: scheme.city },
                  { label: "Authority", value: scheme.authority },
                  { label: "Status", value: scheme.status },
                  { label: "Total Plots", value: scheme.total_plots ? scheme.total_plots.toLocaleString() : "—" },
                  { label: "Open Date", value: scheme.open_date || "—" },
                  { label: "Close Date", value: scheme.close_date || "—" },
                  { label: "Price Range", value: scheme.price_min ? `₹${scheme.price_min}L${scheme.price_max ? `–₹${scheme.price_max}L` : "+"}` : "—" },
                  { label: "Plot Size", value: scheme.area_sqft_min ? `${scheme.area_sqft_min}–${scheme.area_sqft_max} sq.ft` : "—" },
                  { label: "Location", value: scheme.location_details || `${scheme.city}, India` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[--ink-50] border border-[--ink-100] rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[--ink-400] mb-1">{label}</p>
                    <p className="text-[14px] font-semibold text-[--ink-900]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mid ad */}
            <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEME_MID} format="horizontal" label="Scheme Detail — Mid Ad" className="mb-6" />

            {/* SEO block */}
            <div className="card p-6 bg-[--teal-100]/30 border-[--teal-200]/50">
              <h3 className="text-[15px] font-[Outfit] font-700 text-[--ink-900] mb-2">About this scheme</h3>
              <p className="text-[13.5px] text-[--ink-600] leading-relaxed">
                The <strong>{scheme.name}</strong> is a government residential plot scheme by <strong>{scheme.authority}</strong> in <strong>{scheme.city}</strong>.
                {scheme.total_plots && ` It offers ${scheme.total_plots.toLocaleString()} plots`}
                {scheme.price_min && ` priced between ₹${scheme.price_min}L and ₹${scheme.price_max}L`}.
                {" "}Check the official website for the latest brochure, eligibility criteria, and application status.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
            {/* CTA card */}
            <div className="card p-6">
              <h2 className="text-[16px] font-[Outfit] font-700 text-[--ink-900] mb-3">Apply / Check Status</h2>
              <p className="text-[13px] text-[--ink-600] leading-relaxed mb-4">
                For the official brochure, eligibility criteria, and latest updates, visit the authority portal directly.
              </p>
              <a
                href={scheme.apply_url || scheme.source_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full justify-center text-[14px] py-3"
              >
                Visit Official Page ↗
              </a>
            </div>

            {/* Alert card */}
            <div className="card p-6 bg-[--saffron-100]/50 border-[--saffron-200]/60">
              <div className="text-2xl mb-2">🔔</div>
              <h2 className="text-[16px] font-[Outfit] font-700 text-[--ink-900] mb-2">Free Alert</h2>
              <p className="text-[13px] text-[--ink-700] leading-relaxed mb-4">
                Get notified instantly when this scheme status changes — via Email or Telegram.
              </p>
              <button onClick={() => setAlertOpen(true)} className="btn-saffron w-full justify-center text-[13px] py-2.5">
                Subscribe Free →
              </button>
            </div>

            {/* Sidebar ad */}
            <AdSenseSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEME_SIDE}
              format="rectangle"
              label="Scheme Detail — Sidebar Ad (300×250)"
            />
          </aside>
        </div>
      </div>

      <Footer />
      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const schemeId = context.params?.schemeId;
  if (!schemeId || typeof schemeId !== "string") return { notFound: true };
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiBase}/api/v1/schemes/${schemeId}`);
    if (!res.ok) return { notFound: true };
    return { props: { scheme: await res.json() } };
  } catch {
    return { notFound: true };
  }
};
