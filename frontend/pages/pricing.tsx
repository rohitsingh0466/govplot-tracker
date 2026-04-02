import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for casual plot hunters",
    color: "from-[--ink-100] to-[--ink-50]",
    border: "border-[--ink-200]",
    btn: "btn-secondary",
    btnLabel: "Get Started Free",
    btnHref: "/auth",
    tag: null,
    features: [
      { ok: true,  text: "2 cities tracked" },
      { ok: true,  text: "Email alerts" },
      { ok: true,  text: "Scheme list & details" },
      { ok: true,  text: "Basic filters" },
      { ok: false, text: "WhatsApp alerts" },
      { ok: false, text: "Telegram alerts" },
      { ok: false, text: "PDF download" },
      { ok: false, text: "Priority notifications" },
      { ok: false, text: "All 100+ cities" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹99",
    period: "/month",
    desc: "For serious plot buyers",
    color: "from-[--teal-700] to-[--teal-900]",
    border: "border-[--teal-500]",
    btn: "btn-primary",
    btnLabel: "Start Pro — ₹99/mo",
    btnHref: "/auth",
    tag: "Most Popular",
    features: [
      { ok: true, text: "All 100+ cities tracked" },
      { ok: true, text: "Email + Telegram alerts" },
      { ok: true, text: "WhatsApp alerts" },
      { ok: true, text: "Instant notifications" },
      { ok: true, text: "Scheme details & history" },
      { ok: true, text: "PDF download" },
      { ok: false, text: "B2B API access" },
      { ok: false, text: "Custom authority alerts" },
      { ok: false, text: "Dedicated support" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹299",
    period: "/month",
    desc: "For investors & real estate professionals",
    color: "from-[--saffron-500] to-[--saffron-600]",
    border: "border-[--saffron-400]",
    btn: "btn-saffron",
    btnLabel: "Start Premium — ₹299/mo",
    btnHref: "/auth",
    tag: "Best Value",
    features: [
      { ok: true, text: "Everything in Pro" },
      { ok: true, text: "B2B API access" },
      { ok: true, text: "Custom authority alerts" },
      { ok: true, text: "Dedicated support" },
      { ok: true, text: "Priority scraper refresh" },
      { ok: true, text: "Early scheme intel" },
      { ok: true, text: "Bulk PDF reports" },
      { ok: true, text: "Multi-user access (3 seats)" },
      { ok: true, text: "Affiliate commission tracking" },
    ],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <Head>
        <title>Pricing — GovPlot Tracker</title>
        <meta name="description" content="GovPlot Tracker plans: Free, Pro ₹99/mo, Premium ₹299/mo. Track government plot lottery schemes across 100+ Indian cities with real-time alerts." />
        <link rel="canonical" href="https://govplottracker.com/pricing" />
      </Head>
      <Navbar />

      <div className="page-container page-top-offset pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="section-label">Pricing</span>
          <h1 className="text-[38px] sm:text-[48px] font-[Outfit] font-900 text-[--ink-900] mt-2 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-[16px] text-[--ink-600] leading-relaxed">
            Start free. Upgrade when you need more cities, channels, or notifications. 100+ cities covered on Pro.
          </p>

          <div className="inline-flex items-center gap-3 mt-6 bg-[--ink-50] border border-[--ink-100] rounded-full px-2 py-1.5">
            <button onClick={() => setAnnual(false)} className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition ${!annual ? "bg-white text-[--ink-900] shadow-sm" : "text-[--ink-500]"}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition flex items-center gap-2 ${annual ? "bg-white text-[--ink-900] shadow-sm" : "text-[--ink-500]"}`}>
              Annual
              <span className="text-[10px] font-bold bg-[--teal-500] text-white px-2 py-0.5 rounded-full">−20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map(plan => {
            const price = annual && plan.id !== "free"
              ? `₹${Math.round(parseInt(plan.price.replace("₹","")) * 0.8)}`
              : plan.price;
            return (
              <div key={plan.id} className={`relative rounded-3xl border-2 ${plan.border} overflow-hidden ${plan.id === "pro" ? "md:-mt-4 md:mb-4 shadow-2xl" : "shadow-sm"}`}>
                {plan.tag && (
                  <div className={`absolute top-0 inset-x-0 text-center py-1.5 text-[11px] font-bold uppercase tracking-wider text-white bg-gradient-to-r ${plan.color}`}>
                    {plan.tag}
                  </div>
                )}
                <div className={`bg-gradient-to-br ${plan.color} ${plan.tag ? "pt-8" : "pt-6"} pb-6 px-6 ${plan.id !== "free" ? "text-white" : ""}`}>
                  <h2 className={`text-[20px] font-[Outfit] font-800 mb-1 ${plan.id === "free" ? "text-[--ink-900]" : "text-white"}`}>{plan.name}</h2>
                  <p className={`text-[13px] mb-4 ${plan.id === "free" ? "text-[--ink-500]" : "text-white/70"}`}>{plan.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-[42px] font-[Outfit] font-900 leading-none ${plan.id === "free" ? "text-[--ink-900]" : "text-white"}`}>{price}</span>
                    <span className={`text-[14px] mb-2 ${plan.id === "free" ? "text-[--ink-500]" : "text-white/70"}`}>{plan.period}</span>
                  </div>
                  {annual && plan.id !== "free" && (
                    <p className={`text-[11px] mt-1 ${plan.id === "free" ? "text-[--ink-400]" : "text-white/60"}`}>Billed annually · Save 20%</p>
                  )}
                </div>
                <div className="bg-white p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map(({ ok, text }) => (
                      <li key={text} className="flex items-center gap-2.5 text-[13px]">
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${ok ? "bg-[--teal-100] text-[--teal-700]" : "bg-[--ink-50] text-[--ink-300]"}`}>
                          {ok ? "✓" : "—"}
                        </span>
                        <span className={ok ? "text-[--ink-800]" : "text-[--ink-400]"}>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.btnHref} className={`${plan.btn} w-full justify-center text-[14px] py-3`}>{plan.btnLabel}</Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="max-w-2xl mx-auto mt-20">
          <h2 className="text-[24px] font-[Outfit] font-800 text-[--ink-900] mb-8 text-center">Frequently asked</h2>
          <div className="space-y-4">
            {[
              { q: "Can I cancel anytime?", a: "Yes. Cancel anytime from your dashboard. No lock-in, no questions asked." },
              { q: "Which payment methods are accepted?", a: "We use Razorpay — UPI, debit/credit cards, net banking, and EMI are all supported." },
              { q: "Is the free plan really free forever?", a: "Yes. The Free plan has no time limit. You can track 2 cities and receive email alerts indefinitely." },
              { q: "What is the difference between Pro and Premium?", a: "Pro covers all 100+ cities with all notification channels. Premium adds B2B API access, multi-user seats, custom authority alerts, and priority support." },
              { q: "How often is data updated?", a: "Full data pull every Sunday (all 58 scrapers, 100+ cities). Mon–Sat: only OPEN/ACTIVE schemes are refreshed. This ensures fresh data without unnecessary load." },
            ].map(({ q, a }) => (
              <div key={q} className="card p-5">
                <h3 className="text-[14px] font-[Outfit] font-700 text-[--ink-900] mb-2">{q}</h3>
                <p className="text-[13px] text-[--ink-600] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
