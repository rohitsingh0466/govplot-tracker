import Head from "next/head";
import type { GetServerSideProps } from "next";
import Navbar from "../../components/Navbar";
import AlertModal from "../../components/AlertModal";
import { useState } from "react";
import AdSenseSlot from "../../components/AdSenseSlot";

type Scheme = {
  scheme_id: string;
  name: string;
  city: string;
  authority: string;
  status: string;
  open_date?: string | null;
  close_date?: string | null;
  total_plots?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  area_sqft_min?: number | null;
  area_sqft_max?: number | null;
  location_details?: string | null;
  apply_url?: string | null;
  source_url?: string | null;
};

export default function SchemeDetailPage({ scheme }: { scheme: Scheme }) {
  const [alertOpen, setAlertOpen] = useState(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://govplot-tracker.vercel.app";
  const canonicalUrl = `${siteUrl}/schemes/${scheme.scheme_id}`;
  const title = `${scheme.name} | ${scheme.city} Government Plot Scheme`;
  const description = `${scheme.name} by ${scheme.authority} in ${scheme.city}. Track status, dates, plots, pricing, and official application links on GovPlot Tracker.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={`${scheme.authority} plot scheme, ${scheme.city} government plot scheme, ${scheme.name}`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: title,
              description,
              about: [scheme.city, scheme.authority, scheme.status],
              mainEntityOfPage: canonicalUrl,
            }),
          }}
        />
      </Head>

      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 rounded-[2rem] border border-blue-100 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-8 text-white shadow-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
            Scheme Detail
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
              {scheme.status}
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
              {scheme.city}
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
              {scheme.authority}
            </span>
          </div>
          <h1 className="max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
            {scheme.name}
          </h1>
          <p className="mt-4 max-w-3xl text-base text-blue-100 sm:text-lg">
            Track dates, availability, and official links for this government residential plot scheme.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Scheme Snapshot</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard label="City" value={scheme.city} />
              <InfoCard label="Authority" value={scheme.authority} />
              <InfoCard label="Status" value={scheme.status} />
              <InfoCard label="Total Plots" value={scheme.total_plots ? scheme.total_plots.toLocaleString() : "Not published"} />
              <InfoCard label="Open Date" value={scheme.open_date || "Not published"} />
              <InfoCard label="Close Date" value={scheme.close_date || "Not published"} />
              <InfoCard
                label="Price Range"
                value={
                  scheme.price_min
                    ? `₹${scheme.price_min}L${scheme.price_max ? ` - ₹${scheme.price_max}L` : ""}`
                    : "Not published"
                }
              />
              <InfoCard
                label="Plot Size"
                value={
                  scheme.area_sqft_min
                    ? `${scheme.area_sqft_min} sq.ft${scheme.area_sqft_max ? ` - ${scheme.area_sqft_max} sq.ft` : ""}`
                    : "Not published"
                }
              />
            </div>

            <div className="mt-8 rounded-3xl bg-slate-50 p-6">
              <h3 className="mb-3 text-lg font-bold text-slate-900">Why this page matters</h3>
              <p className="text-sm leading-7 text-slate-600">
                This scheme page is built as an SEO landing page for high-intent searches like
                {" "}
                <strong>{scheme.authority} plot scheme</strong>
                {" "}
                and
                {" "}
                <strong>{scheme.city} government plot scheme</strong>.
                {" "}
                It is the v1.1 foundation for per-scheme indexing from the product roadmap.
              </p>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Next Action</h2>
              <p className="mb-5 text-sm leading-7 text-slate-600">
                Use the official authority link for the latest brochure, eligibility, and application status.
              </p>
              <a
                href={scheme.apply_url || scheme.source_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 px-5 py-3 text-center text-sm font-bold text-white transition hover:from-blue-700 hover:to-blue-900"
              >
                Visit Official Page
              </a>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-sm">
              <h2 className="mb-3 text-xl font-bold text-slate-900">Free Alert</h2>
              <p className="mb-5 text-sm leading-7 text-slate-700">
                Subscribe for email or Telegram alerts when this scheme changes status. Pro billing and premium channels are being added in v1.1.
              </p>
              <button
                onClick={() => setAlertOpen(true)}
                className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Get Scheme Alerts
              </button>
            </div>

            <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SCHEME_SLOT} format="rectangle" />
          </aside>
        </div>
      </main>

      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const schemeId = context.params?.schemeId;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  if (!schemeId || typeof schemeId !== "string") {
    return { notFound: true };
  }

  try {
    const response = await fetch(`${apiBase}/api/v1/schemes/${schemeId}`);
    if (!response.ok) {
      return { notFound: true };
    }

    const scheme = await response.json();
    return { props: { scheme } };
  } catch {
    return { notFound: true };
  }
};
