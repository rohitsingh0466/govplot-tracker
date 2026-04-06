// frontend/pages/blog/yeida-rps10-2026-last-date-apply-guide.tsx

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthModal from "../../components/AuthModal";

export default function YeidaLastDateGuideBlog() {
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const slug = "yeida-rps10-2026-last-date-apply-guide";
  const siteUrl = "https://govplottracker.com";

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("govplot_auth_user") : null;
    setIsLoggedIn(!!raw);
    const handler = () => setIsLoggedIn(!!localStorage.getItem("govplot_auth_user"));
    window.addEventListener("govplot-auth-changed", handler);
    return () => window.removeEventListener("govplot-auth-changed", handler);
  }, []);

  const steps = [
    {
      no: "01",
      title: "Download the Official Brochure",
      desc: "Visit yamunaexpresswayauthority.com and download the RPS10/2026 brochure. Read the eligibility clauses, plot category list, and rate schedule carefully before you start. This takes 20–30 minutes and prevents costly form errors.",
    },
    {
      no: "02",
      title: "Verify Your Aadhaar-Linked Mobile Number",
      desc: "The YEIDA portal sends OTPs to your Aadhaar-registered mobile number during form submission. If your number has changed, update it at your nearest Aadhaar centre at least 7–10 days before you plan to apply — Aadhaar updates take 3–7 working days to reflect.",
    },
    {
      no: "03",
      title: "Choose Your Plot Size Category",
      desc: "Six sizes are available in RPS10/2026: 162, 183, 184, 200, 223, and 290 sq. mtr. Your choice is final on submission. Larger plots carry higher registration fees and cost more, but offer greater construction flexibility and generally higher resale values. Match your choice to your budget and purpose.",
    },
    {
      no: "04",
      title: "Arrange the Registration / Application Fee",
      desc: "Payment can be made online (net banking, UPI, debit card) or at any of the six empanelled banking partners: Axis Bank, Bank of Baroda, Kotak Mahindra Bank, HDFC Bank, ICICI Bank, and Canara Bank. Non-allotted applicants receive a full refund — so the fee is essentially a risk-free deposit.",
    },
    {
      no: "05",
      title: "Fill and Submit the Online Application",
      desc: "Log in at yamunaexpresswayauthority.com, fill in personal details, plot preference, and upload required documents (Aadhaar, PAN, photograph). Review carefully before final submission. Print or save your application acknowledgement number — you will need this for the draw result.",
    },
    {
      no: "06",
      title: "Wait for the Draw — 18 June 2026",
      desc: "The computerised draw is conducted on 18 June 2026. Results are published on the YEIDA website and communicated via SMS/email. Allotted applicants receive a detailed letter with their plot number, sector, and initial payment schedule.",
    },
  ];

  const bankingPartners = [
    "Axis Bank",
    "Bank of Baroda",
    "Kotak Mahindra Bank",
    "HDFC Bank",
    "ICICI Bank",
    "Canara Bank",
  ];

  const docsList = [
    "Aadhaar Card (original + self-attested copy)",
    "PAN Card (original + self-attested copy)",
    "Recent passport-size photograph (digital, JPG format)",
    "Bank account details (for refund, if not allotted)",
    "Active mobile number linked to Aadhaar",
    "Email address for communication",
    "Joint applicant documents if applying with spouse",
  ];

  return (
    <>
      <Head>
        <title>YEIDA RPS10/2026 Last Date to Apply Is 6 May — Complete Step-by-Step Guide | GovPlot Tracker</title>
        <meta
          name="description"
          content="The last date to apply for YEIDA's RPS10/2026 residential plot scheme is 6 May 2026 and the draw is 18 June 2026. This step-by-step guide walks you through the full application process — documents, payment, and what to expect after the draw."
        />
        <link rel="canonical" href={`${siteUrl}/blog/${slug}`} />
        <meta property="og:title" content="YEIDA RPS10/2026 — Last Date 6 May, Draw 18 June: Complete Application Guide" />
        <meta property="og:type" content="article" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: "YEIDA RPS10/2026 Last Date to Apply Is 6 May — Complete Step-by-Step Guide",
              datePublished: "2026-04-06",
              author: { "@type": "Organization", name: "GovPlot Tracker" },
            }),
          }}
        />
      </Head>

      <div className="min-h-screen bg-[--bg-page]">
        <div className="bg-white border-b border-[--ink-100] py-3 px-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href="/blog" className="text-[13px] font-semibold text-[--teal-600] hover:text-[--teal-800] transition">
              ← All articles
            </Link>
            <Link href="/" className="text-[13px] font-semibold text-[--ink-500] hover:text-[--ink-900]">
              govplottracker.com
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[11px] font-bold bg-[--saffron-100] text-[--saffron-600] px-2.5 py-1 rounded-full">How-To Guide</span>
              <span className="text-[11px] font-semibold text-[--ink-500] bg-[--ink-50] border border-[--ink-100] px-2.5 py-1 rounded-full">📍 Yamuna Expressway — Sectors 15C, 18 & 24A</span>
              <span className="text-[11px] text-[--ink-400]">6 April 2026 · 12 min read</span>
            </div>
            <h1 className="text-[30px] sm:text-[38px] font-[Outfit] font-900 text-[--ink-900] leading-tight mb-4">
              Last Date to Apply for YEIDA RPS10/2026 Is 6 May — Here Is Your Complete Application Guide
            </h1>
            <p className="text-[15px] text-[--ink-600] leading-relaxed border-l-4 border-[--saffron-400] pl-4">
              The application window for YEIDA's new residential plot scheme (Scheme Code: RPS10/2026) is open from 6 April 2026 and closes on <strong>6 May 2026</strong>. The draw date is <strong>18 June 2026</strong>. You have exactly one month to get your application in — here's a complete, step-by-step guide to doing it right.
            </p>
          </div>

          {/* Countdown / key dates banner */}
          <div className="bg-gradient-to-r from-[--saffron-500] to-[--saffron-600] rounded-3xl p-6 mb-8 text-white">
            <h2 className="text-[16px] font-[Outfit] font-800 mb-4">📅 Key Dates — Mark Your Calendar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { date: "6 April 2026", event: "Scheme Opens", icon: "🟢", note: "Applications accepted from today" },
                { date: "6 May 2026", event: "LAST DATE", icon: "🔴", note: "No extensions expected" },
                { date: "18 June 2026", event: "Draw / Lottery", icon: "🎰", note: "Computerised, transparent draw" },
              ].map(({ date, event, icon, note }) => (
                <div key={event} className="bg-white/15 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-[18px] font-[Outfit] font-900">{date}</p>
                  <p className="text-[12px] font-bold uppercase tracking-wider text-white/80 mb-1">{event}</p>
                  <p className="text-[11px] text-white/70">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="prose-custom">
            <h2>Who Is Eligible to Apply?</h2>
            <p>
              Any Indian citizen who is 18 years of age or above is eligible to apply for YEIDA's RPS10/2026 scheme. There is no income ceiling for the general category plots listed in this scheme. However, the following disqualification conditions typically apply in YEIDA residential plot schemes (verify against the official brochure):
            </p>
            <ul>
              <li>Applicant or spouse must not have been allotted a plot under the <em>same</em> YEIDA residential plot scheme in a previous round.</li>
              <li>Applicant must be an Indian citizen — NRIs may have specific conditions; check the brochure for NRI category applicability.</li>
              <li>One application per household is the general norm, though joint applications (with spouse) may be permissible — confirm in the official form instructions.</li>
            </ul>
          </div>

          {/* Documents checklist */}
          <div className="card p-6 mb-8">
            <h3 className="text-[16px] font-[Outfit] font-800 text-[--ink-900] mb-4">📋 Documents Required</h3>
            <div className="space-y-2">
              {docsList.map((doc, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[--teal-100] text-[--teal-700] flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <p className="text-[13.5px] text-[--ink-700]">{doc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step by step */}
          <div className="mb-8">
            <h2 className="text-[20px] font-[Outfit] font-800 text-[--ink-900] mb-5">Step-by-Step Application Process</h2>
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.no} className="card p-5 flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[--teal-600] to-[--teal-700] flex items-center justify-center text-white font-[Outfit] font-800 text-[13px] shadow-[--shadow-teal]">
                    {step.no}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-[Outfit] font-700 text-[--ink-900] mb-1">{step.title}</h3>
                    <p className="text-[13.5px] text-[--ink-600] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banking partners */}
          <div className="card p-6 mb-8">
            <h3 className="text-[16px] font-[Outfit] font-800 text-[--ink-900] mb-3">🏦 Exclusive Banking Partners for RPS10/2026</h3>
            <p className="text-[13px] text-[--ink-600] mb-4">Payment of the application/registration fee can be made through these six banks — online or at their branches:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {bankingPartners.map((bank) => (
                <div key={bank} className="bg-[--teal-100]/50 border border-[--teal-200]/50 rounded-xl px-3 py-2 text-center">
                  <p className="text-[13px] font-semibold text-[--teal-800]">{bank}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="prose-custom">
            <h2>What Happens After You Submit</h2>
            <p>
              Once your application is submitted and payment confirmed, you will receive an acknowledgement number. Save this — it is your reference for tracking the draw result on 18 June 2026. You may also receive an SMS confirmation on your registered mobile number.
            </p>
            <p>
              On 18 June 2026, YEIDA will conduct a computerised draw. Results are typically published on the official website and emailed/SMSed to applicants within 24–48 hours. If your application number is drawn, you receive a formal allotment letter with:
            </p>
            <ul>
              <li>Your specific plot number and sector</li>
              <li>The exact total cost based on the allotted plot size</li>
              <li>Payment schedule — typically a down payment within 30 days, remainder in instalments</li>
              <li>Dispute/appeal procedures if applicable</li>
            </ul>

            <h2>Refund Policy for Non-Allotted Applicants</h2>
            <p>
              If your application number is not drawn, YEIDA will refund the full registration fee. Historically, refunds for YEIDA schemes take 60–90 days to process back to the source bank account. Ensure the bank account details submitted in the application are active and correct — refunds to incorrect accounts create significant hassle to resolve.
            </p>

            <h2>Common Mistakes That Lead to Rejection or Complications</h2>
            <ul>
              <li>Submitting with a mobile number not linked to Aadhaar — OTP fails, application incomplete.</li>
              <li>Paying the registration fee to a non-empanelled bank — payment may not reconcile with YEIDA's system.</li>
              <li>Mismatch between PAN name and Aadhaar name — YEIDA verification flags these and can lead to disqualification post-draw.</li>
              <li>Applying after the server congestion spike in the last 3–4 days of the window — risk of timeout and lost data. Apply in the first two weeks.</li>
              <li>Not printing or saving the acknowledgement slip — if the website is down later, you lose your reference number.</li>
            </ul>

            <h2>Can I Apply Offline?</h2>
            <p>
              In past YEIDA schemes, a limited offline application process was available at empanelled bank branches. However, YEIDA has been progressively shifting to a fully online process. Check the official brochure at the time of application to confirm whether offline submission is available for RPS10/2026.
            </p>

            <h2>Final Word: Apply Early, Apply Right</h2>
            <p>
              The YEIDA application process is relatively straightforward once you have your documents in order. The biggest risk is not complexity — it is procrastination. The 6 May 2026 deadline is firm, and in previous schemes, YEIDA has not extended timelines even when server issues caused inconvenience in the final days.
            </p>
            <p>
              Apply in the first two weeks of April. Keep your documents digital and accessible. And once submitted, mark 18 June 2026 in your calendar.
            </p>
          </div>

          {/* GovPlot CTA */}
          <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] rounded-3xl p-8 text-center mt-10 mb-8">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="text-[20px] font-[Outfit] font-700 text-white mb-2">
              Get Notified About Every Scheme Opening Across India
            </h3>
            <p className="text-[13.5px] text-[--teal-300]/90 mb-2 max-w-lg mx-auto">
              You found this scheme — but how many have you missed? GovPlot Tracker monitors YEIDA, DDA, LDA, MHADA, GNIDA and 45+ housing authorities weekly. Sign up free and get instant alerts when a new scheme opens in your city.
            </p>
            <p className="text-[12px] text-[--teal-400]/80 mb-5">
              Pro plan (₹99/mo) — Email + Telegram alerts for up to 2 cities. Never miss a window again.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {!isLoggedIn ? (
                <button onClick={() => setAuthOpen(true)} className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[14px] py-3 px-6">
                  Sign Up Free — Get Alerts →
                </button>
              ) : (
                <Link href="/dashboard" className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[14px] py-3 px-6">
                  Set Up City Alerts →
                </Link>
              )}
              <Link href="/pricing" className="btn-ghost text-white border-white/30 hover:bg-white/10 text-[14px] py-3 px-6">
                View Pro Plans
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/blog" className="text-[13px] text-[--teal-600] font-semibold hover:text-[--teal-800]">
              ← More articles
            </Link>
          </div>
        </div>

        <div className="border-t border-[--ink-100] py-6 text-center mt-12">
          <p className="text-[12px] text-[--ink-400]">
            © 2026 GovPlot Tracker ·{" "}
            <Link href="/privacy" className="hover:text-[--teal-600]">Privacy</Link> ·{" "}
            <Link href="/terms" className="hover:text-[--teal-600]">Terms</Link>
          </p>
        </div>
      </div>

      <style jsx global>{`
        .prose-custom h2 {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          color: var(--ink-900);
          margin: 2rem 0 0.75rem;
          line-height: 1.3;
        }
        .prose-custom p {
          font-size: 15px;
          color: var(--ink-700);
          line-height: 1.85;
          margin-bottom: 1.1rem;
        }
        .prose-custom ul {
          margin: 0.5rem 0 1.25rem 1.25rem;
          list-style: disc;
        }
        .prose-custom ul li {
          font-size: 15px;
          color: var(--ink-700);
          line-height: 1.85;
          margin-bottom: 0.4rem;
        }
        .prose-custom strong { color: var(--ink-900); font-weight: 700; }
        .prose-custom em { color: var(--ink-600); font-style: italic; }
      `}</style>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
