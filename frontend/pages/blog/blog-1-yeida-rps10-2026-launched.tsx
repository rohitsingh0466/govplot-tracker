// frontend/pages/blog/yeida-residential-plot-scheme-2026-launched.tsx
// Place this file at: frontend/pages/blog/yeida-residential-plot-scheme-2026-launched.tsx

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthModal from "../../components/AuthModal";

export default function YeidaLaunchedBlog() {
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const slug = "yeida-residential-plot-scheme-2026-launched";
  const siteUrl = "https://govplottracker.com";

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
        <title>YEIDA Residential Plot Scheme 2026 Launched — Apply Before 6 May | GovPlot Tracker</title>
        <meta
          name="description"
          content="YEIDA has officially launched its RPS10/2026 residential plot scheme on 6 April 2026. Plots in Sector 15C, 18 & 24A ranging from 162–290 sq. mtr. Draw date: 18 June 2026. Here's everything you need to know."
        />
        <link rel="canonical" href={`${siteUrl}/blog/${slug}`} />
        <meta property="og:title" content="YEIDA Residential Plot Scheme 2026 Launched" />
        <meta property="og:description" content="YEIDA RPS10/2026 scheme is now open. Apply before 6 May 2026. Plots from 162–290 sq. mtr in sectors 15C, 18 & 24A near Jewar Airport." />
        <meta property="og:type" content="article" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: "YEIDA Residential Plot Scheme 2026 Launched — Apply Before 6 May",
              description: "YEIDA has officially launched its RPS10/2026 residential plot scheme on 6 April 2026.",
              datePublished: "2026-04-06",
              author: { "@type": "Organization", name: "GovPlot Tracker" },
            }),
          }}
        />
      </Head>

      <div className="min-h-screen bg-[--bg-page]">
        {/* Top bar */}
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
          {/* Article header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[11px] font-bold bg-[--teal-100] text-[--teal-700] px-2.5 py-1 rounded-full">Breaking News</span>
              <span className="text-[11px] font-semibold text-[--ink-500] bg-[--ink-50] border border-[--ink-100] px-2.5 py-1 rounded-full">📍 Noida / Yamuna Expressway</span>
              <span className="text-[11px] text-[--ink-400]">6 April 2026 · 8 min read</span>
            </div>
            <h1 className="text-[30px] sm:text-[38px] font-[Outfit] font-900 text-[--ink-900] leading-tight mb-4">
              YEIDA Residential Plot Scheme 2026 Is Live — Everything You Need to Know Before the 6 May Deadline
            </h1>
            <p className="text-[15px] text-[--ink-600] leading-relaxed border-l-4 border-[--teal-400] pl-4">
              On 6 April 2026, the Yamuna Expressway Industrial Development Authority (YEIDA) officially opened applications for its much-awaited RPS10/2026 residential plot scheme. With plots available in three prime sectors close to the upcoming Noida International Airport at Jewar, this is one of the most significant government land offerings in recent years. Here's a complete breakdown.
            </p>
          </div>

          {/* Quick facts card */}
          <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] rounded-3xl p-6 sm:p-8 mb-8 text-white">
            <h2 className="text-[18px] font-[Outfit] font-800 mb-4 text-[--teal-300]">⚡ Quick Facts — YEIDA RPS10/2026</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Scheme Code", value: "RPS10/2026" },
                { label: "RERA No.", value: "RPS10/2025-UPRERAPRJ307764/03/2026" },
                { label: "Scheme Open", value: "6 April 2026" },
                { label: "Last Date to Apply", value: "6 May 2026" },
                { label: "Draw Date", value: "18 June 2026" },
                { label: "Sectors", value: "15C, 18 & 24A (Yamuna Expressway)" },
                { label: "Plot Sizes", value: "162, 183, 184, 200, 223 & 290 Sq. Mtr." },
                { label: "Allotment Mode", value: "Draw (Lottery)" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/10 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[--teal-400] mb-0.5">{label}</p>
                  <p className="text-[14px] font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="prose-custom">

            <h2>What Is the YEIDA RPS10/2026 Scheme?</h2>
            <p>
              The Yamuna Expressway Industrial Development Authority is a state government body under the Government of Uttar Pradesh, responsible for planned development along the 165-km Yamuna Expressway connecting Greater Noida to Agra. YEIDA periodically launches residential plot schemes — and its 2026 edition is particularly noteworthy because of its proximity to the under-construction Noida International Airport (NIA) at Jewar, which is expected to become one of Asia's largest airports.
            </p>
            <p>
              The scheme, officially designated <strong>RPS10/2026</strong>, carries a RERA registration number of <strong>RPS10/2025-UPRERAPRJ307764/03/2026</strong>, which means it is a legally registered real estate project under UP-RERA — giving buyers an added layer of consumer protection.
            </p>

            <h2>Which Sectors Are Covered?</h2>
            <p>
              Plots are available in three sectors along the Yamuna Expressway — <strong>Sector 15C, Sector 18, and Sector 24A</strong>. These are established YEIDA sectors with existing infrastructure including wide internal roads, drainage, electricity lines, and green belts. Sector 18 in particular has seen rapid appreciation over the past three years due to its location midway between Greater Noida and the Jewar Airport site.
            </p>

            <h2>Plot Sizes and Categories</h2>
            <p>
              YEIDA is offering six plot sizes under this scheme: <strong>162, 183, 184, 200, 223, and 290 square metres</strong>. This range caters to a wide spectrum of buyers — from mid-budget families seeking a compact plot around 1,700 sq. ft., to investors wanting a larger 290 sq. mtr. (approximately 3,120 sq. ft.) plot for future construction or appreciation.
            </p>
            <p>
              The allotment happens through a computerised draw, which means every registered applicant gets a fair, transparent shot at a plot — the number of plots is finite, and if applications exceed supply (which is almost certain given demand), a lottery is conducted on the draw date of <strong>18 June 2026</strong>.
            </p>

            <h2>Why Is This Scheme Significant in 2026?</h2>
            <p>
              Three macro factors make the YEIDA RPS10/2026 scheme more compelling than previous editions:
            </p>
            <ul>
              <li><strong>Noida International Airport (Jewar):</strong> Construction is in advanced stages and the airport is expected to become operational in 2026–27. Historical data from cities like Hyderabad (RGIA) and Bengaluru (KIAL) shows property values in surrounding planned sectors appreciate by 40–80% in the five years surrounding an airport's opening.</li>
              <li><strong>Yamuna Expressway Connectivity:</strong> The expressway now connects seamlessly to the Delhi-Mumbai Expressway and the Delhi-Meerut corridor. Commute times from sectors 15C and 18 to Central Delhi have dropped significantly.</li>
              <li><strong>Film City and Industrial Nodes:</strong> YEIDA has allocated land for the much-publicised Jewar Film City, multiple MSME parks, and a data centre hub — all within 15 km of these plot sectors. This drives genuine employment and residential demand, not just speculative interest.</li>
            </ul>

            <h2>Who Can Apply?</h2>
            <p>
              Any Indian citizen above 18 years of age is eligible to apply. YEIDA schemes are generally open to all income groups for general category plots — there is no income ceiling for the plot sizes listed in this scheme. Applicants must not have been allotted a plot in certain prior YEIDA schemes (check the official brochure for exact disqualification criteria).
            </p>

            <h2>How to Apply</h2>
            <p>
              Applications are accepted online through the official YEIDA portal (<strong>yamunaexpresswayauthority.com</strong>) as well as through the exclusive banking partners — Axis Bank, Bank of Baroda, Kotak Mahindra Bank, HDFC Bank, ICICI Bank, and Canara Bank. The registration fee is paid online or at bank branches, and the application form is filled digitally.
            </p>
            <p>
              Key dates to mark in your calendar:
            </p>
            <ul>
              <li><strong>6 April 2026</strong> — Scheme open, applications begin</li>
              <li><strong>6 May 2026</strong> — Last date to submit application and registration fee</li>
              <li><strong>18 June 2026</strong> — Draw (lottery) date</li>
            </ul>

            <h2>What Happens After the Draw?</h2>
            <p>
              Successful applicants are intimated via SMS and email. They receive an allotment letter specifying the plot number, sector, and payment schedule. YEIDA typically requires a down payment within 30 days of allotment, followed by instalments spread over 3–5 years. Non-allotted applicants receive a full refund of the registration amount — usually within 60–90 days.
            </p>

            <h2>Documents You Will Need</h2>
            <p>
              Keep these ready before you start your application: Aadhaar card, PAN card, a recent passport-size photograph, your bank account details for refund purposes, and a valid mobile number linked to Aadhaar for OTP verification. If applying jointly, spouse's documents are also needed.
            </p>

          </div>

          {/* GovPlot Tracker CTA */}
          <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] rounded-3xl p-8 text-center mt-10 mb-8">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="text-[20px] font-[Outfit] font-700 text-white mb-2">
              Don't Miss the Next YEIDA Scheme — or Any Government Plot Lottery
            </h3>
            <p className="text-[13.5px] text-[--teal-300]/90 mb-2 max-w-lg mx-auto">
              GovPlot Tracker monitors a focused 20-city watchlist including YEIDA, LDA, JDA, DDA, BDA, HMDA and CIDCO. The moment a watched scheme opens, you can get an alert by Email, Telegram, or WhatsApp.
            </p>
            <p className="text-[12px] text-[--teal-400]/80 mb-5">
              Free account · No credit card · Set up in 30 seconds
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {!isLoggedIn ? (
                <button onClick={() => setAuthOpen(true)} className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[14px] py-3 px-6">
                  Sign Up Free & Get Alerts →
                </button>
              ) : (
                <Link href="/dashboard" className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[14px] py-3 px-6">
                  Go to My Dashboard →
                </Link>
              )}
              <Link href="/schemes?city=Greater%20Noida" className="btn-ghost text-white border-white/30 hover:bg-white/10 text-[14px] py-3 px-6">
                View Greater Noida Schemes
              </Link>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="mt-8 text-center">
            <Link href="/blog" className="text-[13px] text-[--teal-600] font-semibold hover:text-[--teal-800]">
              ← More articles
            </Link>
          </div>
        </div>

        {/* Footer */}
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
        .prose-custom strong {
          color: var(--ink-900);
          font-weight: 700;
        }
      `}</style>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
