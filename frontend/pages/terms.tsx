import Head from "next/head";
import { useState } from "react";
import AlertModal from "../components/AlertModal";
import Navbar from "../components/Navbar";

export default function TermsPage() {
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Terms of Use — GovPlot Tracker</title>
        <meta name="description" content="Terms of Use for GovPlot Tracker covering informational use, alerts, subscriptions, third-party portals, and service limitations." />
      </Head>
      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 rounded-[2rem] bg-gradient-to-br from-amber-300 via-orange-200 to-white p-8 text-slate-950 shadow-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">Legal</p>
          <h1 className="text-4xl font-black">Terms of Use</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700">
            GovPlot Tracker is an informational tracking platform. Official scheme terms, brochures, eligibility, and application decisions always come from the relevant government authority.
          </p>
        </div>

        <div className="space-y-6 text-sm leading-7 text-slate-700">
          <PolicyCard title="Informational Service" body="We aggregate public scheme data from official sources and present it in a more usable format. We do not guarantee that any authority will keep its public portal unchanged, available, or free of delays." />
          <PolicyCard title="No Government Affiliation" body="GovPlot Tracker is an independent product and is not affiliated with, endorsed by, or operated by any housing authority, state body, or government department." />
          <PolicyCard title="Subscriptions and Billing" body="Paid plans are billed through Razorpay. Pricing, benefits, and billing intervals may change over time. Premium access is tied to the account used during purchase." />
          <PolicyCard title="Alerts and Delivery" body="We aim to deliver alerts quickly, but message delivery depends on third-party providers such as Telegram, email providers, or WhatsApp services and may be delayed or unavailable." />
          <PolicyCard title="Use Restrictions" body="You may not misuse the service, automate abusive traffic, attempt unauthorized access, or interfere with the platform, scraper, or notification systems." />
        </div>
      </main>

      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}

function PolicyCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-xl font-bold text-slate-950">{title}</h2>
      <p>{body}</p>
    </section>
  );
}
