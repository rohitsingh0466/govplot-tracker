import Head from "next/head";
import { useState } from "react";
import AlertModal from "../components/AlertModal";
import Navbar from "../components/Navbar";

export default function ContactPage() {
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Contact — GovPlot Tracker</title>
        <meta name="description" content="Contact GovPlot Tracker for support, partnerships, subscription help, and data feedback." />
      </Head>
      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 rounded-[2rem] bg-gradient-to-br from-sky-200 via-cyan-100 to-white p-8 shadow-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">Support</p>
          <h1 className="text-4xl font-black text-slate-950">Contact GovPlot Tracker</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700">
            Reach out for subscription help, Telegram linking issues, partnership discussions, or corrections to scheme information.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-bold text-slate-950">General Support</h2>
            <p className="text-sm leading-7 text-slate-700">
              Email:
              {" "}
              <a className="font-semibold text-blue-700" href="mailto:support@govplottracker.com">
                support@govplottracker.com
              </a>
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Use this for account access, alerts, billing help, or reporting incorrect scheme data.
            </p>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-bold text-slate-950">Partnerships</h2>
            <p className="text-sm leading-7 text-slate-700">
              Email:
              {" "}
              <a className="font-semibold text-blue-700" href="mailto:partners@govplottracker.com">
                partners@govplottracker.com
              </a>
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Use this for affiliates, B2B data access, advertising, and strategic partnerships.
            </p>
          </section>
        </div>
      </main>

      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
