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
      </Head>
      <Navbar onAlertClick={() => setAlertOpen(true)} />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">About GovPlot Tracker</h1>
        <p className="text-gray-600 mb-4 leading-relaxed">
          GovPlot Tracker is India&apos;s most comprehensive real-time monitor for Government
          Residential Plot Schemes. We track official housing authority portals across 9
          major cities — automatically, every 6 hours — so you never miss a scheme opening.
        </p>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Whether you&apos;re looking for an affordable plot from LDA in Lucknow, a BDA site in
          Bangalore, or a MHADA lottery in Mumbai, GovPlot Tracker shows you the current
          status and lets you subscribe for instant alerts the moment a scheme opens.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mb-3">How it works</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-8">
          <li>Our scrapers run automatically every 6 hours via GitHub Actions</li>
          <li>We parse official government portals and normalise the data</li>
          <li>Status changes trigger instant notifications to subscribers</li>
          <li>You see the latest data on this dashboard — always up to date</li>
        </ol>

        <h2 className="text-xl font-bold text-gray-900 mb-3">Data Sources</h2>
        <p className="text-gray-600 mb-8">
          All data is sourced directly from official government portals: LDA, BDA, GNIDA,
          HSVP, HMDA, MHADA, PMRDA, GMADA, and ADA. We do not alter or editorialize any
          scheme information.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-bold text-blue-800 mb-2">📬 Stay Updated</h3>
          <p className="text-blue-700 text-sm mb-3">Subscribe to get notified when new schemes open in your city — completely free.</p>
          <button
            onClick={() => setAlertOpen(true)}
            className="bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-blue-800 transition"
          >
            Get Free Alerts →
          </button>
        </div>
      </main>
      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}
