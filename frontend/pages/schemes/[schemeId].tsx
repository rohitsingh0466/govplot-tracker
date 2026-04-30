import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import AdSenseSlot from "../../components/AdSenseSlot";
import { useEffect, useState } from "react";

type Scheme = {
  scheme_id: string; name: string; city: string; authority: string; status: string;
  open_date?: string | null; close_date?: string | null; total_plots?: number | null;
  price_min?: number | null; price_max?: number | null;
  area_sqft_min?: number | null; area_sqft_max?: number | null;
  location_details?: string | null; apply_url?: string | null; source_url?: string | null;
  blurred?: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800 border-green-200",
  ACTIVE: "bg-sky-100 text-sky-800 border-sky-200",
  UPCOMING: "bg-amber-100 text-amber-800 border-amber-200",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function SchemeDetailPage({ scheme }: { scheme: Scheme }) {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://govplottracker.com";
  const canonicalUrl = `${siteUrl}/schemes/${scheme.scheme_id}`;
  const title = `${scheme.name} | ${scheme.city} Plot Scheme`;
  const description = `${scheme.name} by ${scheme.authority} in ${scheme.city}. Status: ${scheme.status}. Track dates, plots, pricing on GovPlot Tracker.`;

  // Recheck login state client-side (server renders blurred; client may have token)
  const [clientScheme, setClientScheme] = useState(scheme);

  useEffect(() => {
    const raw = localStorage.getItem("govplot_auth_user");
    setIsLoggedIn(!!raw);
    // If user is now logged in but scheme was blurred (SSR), refetch with auth
    if (raw && scheme.blurred) {
      const token = localStorage.getItem("govplot_auth_token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${apiBase}/api/v1/schemes/${scheme.scheme_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(data => setClientScheme(data)).catch(() => {});
    }
  }, [scheme.scheme_id, scheme.blurred]);

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

      <Navbar />

      <div className="page-container pt-4">
        <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEME_TOP} format="horizontal" label="Scheme Detail — Top Ad" />
      </div>

      <div className="page-container page-top-offset pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12.5px] text-[--ink-500] mb-6">
          <Link href="/" className="hover:text-[--teal-600]">Home</Link>
          <span>/</span>
          <Link href="/schemes" className="hover:text-[--teal-600]">Schemes</Link>
          <span>/</span>
          <span className="text-[--ink-700] font-medium line-clamp-1">{clientScheme.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div>
            {/* Hero card */}
            <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] rounded-3xl p-8 mb-6 text-white">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[clientScheme.status] || STATUS_COLORS.ACTIVE}`}>{clientScheme.status}</span>
                <span className="text-[12px] text-[--teal-300] bg-[--teal-800]/40 border border-[--teal-700]/30 px-3 py-1 rounded-full">{clientScheme.city}</span>
                <span className="text-[12px] text-[--teal-300] bg-[--teal-800]/40 border border-[--teal-700]/30 px-3 py-1 rounded-full">{clientScheme.authority}</span>
              </div>
              <h1 className="text-[24px] sm:text-[30px] font-[Outfit] font-800 leading-tight mb-3">{clientScheme.name}</h1>
              <p className="text-[14px] text-[--teal-300]/80 leading-relaxed">
                Track this government residential plot scheme — dates, availability, pricing and official application links.
              </p>
            </div>

              <div className="card p-6 mb-6">
                <h2 className="text-[18px] font-[Outfit] font-700 text-[--ink-900] mb-5">Scheme Snapshot</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "City", value: clientScheme.city },
                    { label: "Authority", value: clientScheme.authority },
                    { label: "Status", value: clientScheme.status },
                    { label: "Total Plots", value: clientScheme.total_plots ? clientScheme.total_plots.toLocaleString() : "—" },
                    { label: "Open Date", value: clientScheme.open_date || "—" },
                    { label: "Close Date", value: clientScheme.close_date || "—" },
                    { label: "Price Range", value: clientScheme.price_min ? `₹${clientScheme.price_min}L${clientScheme.price_max ? `–₹${clientScheme.price_max}L` : "+"}` : "—" },
                    { label: "Plot Size", value: clientScheme.area_sqft_min ? `${clientScheme.area_sqft_min}–${clientScheme.area_sqft_max} sq.ft` : "—" },
                    { label: "Location", value: clientScheme.location_details || `${clientScheme.city}, India` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[--ink-50] border border-[--ink-100] rounded-2xl p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[--ink-400] mb-1">{label}</p>
                      <p className="text-[14px] font-semibold text-[--ink-900]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

            <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEME_MID} format="horizontal" label="Scheme Detail — Mid Ad" className="mb-6" />

            <div className="card p-6 bg-[--teal-100]/30 border-[--teal-200]/50">
              <h3 className="text-[15px] font-[Outfit] font-700 text-[--ink-900] mb-2">About this scheme</h3>
              <p className="text-[13.5px] text-[--ink-600] leading-relaxed">
                The <strong>{clientScheme.name}</strong> is a government residential plot scheme by <strong>{clientScheme.authority}</strong> in <strong>{clientScheme.city}</strong>.
            {clientScheme.total_plots && ` It offers ${clientScheme.total_plots.toLocaleString()} plots`}
            {clientScheme.price_min && ` priced between ₹${clientScheme.price_min}L and ₹${clientScheme.price_max}L`}.
                {" "}Check the official website for the latest brochure, eligibility criteria, and application status.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
              <div className="card p-6">
                <h2 className="text-[16px] font-[Outfit] font-700 text-[--ink-900] mb-3">Apply / Check Status</h2>
                <p className="text-[13px] text-[--ink-600] leading-relaxed mb-4">For the official brochure, eligibility criteria, and latest updates, visit the authority portal directly.</p>
                <a href={clientScheme.apply_url || clientScheme.source_url || "#"} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center text-[14px] py-3">
                  Visit Official Page ↗
                </a>
              </div>

            {/* Upgrade to get alerts CTA */}
              <div className="card p-6 bg-[--saffron-100]/50 border-[--saffron-200]/60">
                <div className="text-2xl mb-2">🔔</div>
                <h2 className="text-[16px] font-[Outfit] font-700 text-[--ink-900] mb-2">Upgrade to stay updated</h2>
                <p className="text-[13px] text-[--ink-700] leading-relaxed mb-4">
                  Get instant alerts when this scheme opens or changes status. Pro plan from ₹99/mo.
                </p>
                <Link href="/pricing" className="btn-saffron w-full justify-center text-[13px] py-2.5">See Plans →</Link>
              </div>

            <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEME_SIDE} format="rectangle" label="Scheme Detail — Sidebar Ad (300×250)" />
          </aside>
        </div>
      </div>

      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const schemeId = context.params?.schemeId;
  if (!schemeId || typeof schemeId !== "string") return { notFound: true };
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  // Server-side: no auth token — anonymous view (may return blurred)
  try {
    const res = await fetch(`${apiBase}/api/v1/schemes/${schemeId}`);
    if (!res.ok) return { notFound: true };
    return { props: { scheme: await res.json() } };
  } catch {
    return { notFound: true };
  }
};
