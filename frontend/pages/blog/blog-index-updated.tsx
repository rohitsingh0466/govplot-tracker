// frontend/pages/blog/index.tsx
// Replace the existing frontend/pages/blog/index.tsx with this file.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthModal from "../../components/AuthModal";

const POSTS = [
  {
    slug: "yeida-residential-plot-scheme-2026-launched",
    title: "YEIDA Residential Plot Scheme 2026 Is Live — Everything You Need to Know Before the 6 May Deadline",
    city: "Noida / Yamuna Expressway",
    date: "6 Apr 2026",
    readTime: "8 min",
    tag: "Breaking News",
    excerpt:
      "On 6 April 2026, YEIDA officially opened applications for its RPS10/2026 residential plot scheme — plots in Sectors 15C, 18 & 24A, sizes 162–290 sq. mtr., draw on 18 June 2026. Here's everything you need to know.",
  },
  {
    slug: "yeida-vs-lda-which-government-plot-scheme-is-better-2026",
    title: "YEIDA vs LDA — Which Government Plot Scheme Should You Apply to in 2026?",
    city: "UP — Noida vs Lucknow",
    date: "6 Apr 2026",
    readTime: "10 min",
    tag: "Comparison",
    excerpt:
      "YEIDA and LDA are both running residential plot schemes in 2026. If you can only apply to one, this detailed head-to-head on location, pricing, infrastructure, and appreciation potential will help you decide.",
  },
  {
    slug: "yeida-2025-vs-yeida-2026-scheme-comparison",
    title: "YEIDA 2025 vs YEIDA 2026 — What Has Changed and Is RPS10/2026 Worth Applying For?",
    city: "Yamuna Expressway",
    date: "6 Apr 2026",
    readTime: "9 min",
    tag: "Analysis",
    excerpt:
      "Many applicants who missed the 2025 Airport Zone draw are eyeing the new RPS10/2026. We compare both schemes on plot sizes, sectors, pricing, and oversubscription expectations — and tell you what lessons from 2025 to carry into 2026.",
  },
  {
    slug: "yeida-plot-scheme-2026-jewar-airport-roi-returns",
    title: "YEIDA Launches New Plot Scheme as Jewar Airport Nears Completion — What Does This Mean for Your Returns?",
    city: "Jewar / Yamuna Expressway",
    date: "6 Apr 2026",
    readTime: "11 min",
    tag: "Investment",
    excerpt:
      "The timing of YEIDA's RPS10/2026 launch is no coincidence. With Noida International Airport in advanced stages, we analyse airport-driven ROI scenarios, three case studies from Hyderabad and Bengaluru, and whether 2026 is the last affordable entry point.",
  },
  {
    slug: "yeida-rps10-2026-last-date-apply-guide",
    title: "Last Date to Apply for YEIDA RPS10/2026 Is 6 May — Your Complete Step-by-Step Application Guide",
    city: "Sectors 15C, 18 & 24A — Yamuna Expressway",
    date: "6 Apr 2026",
    readTime: "12 min",
    tag: "How-To Guide",
    excerpt:
      "The application window closes on 6 May 2026. Draw is 18 June 2026. This comprehensive guide walks you through eligibility, documents checklist, six banking partners, the online application steps, refund policy, and the most common mistakes to avoid.",
  },
];

const TAG_COLORS: Record<string, string> = {
  "Breaking News": "bg-[--teal-100] text-[--teal-700]",
  Comparison: "bg-[--sky-100] text-sky-700",
  Analysis: "bg-[--amber-100] text-amber-700",
  Investment: "bg-green-100 text-green-700",
  "How-To Guide": "bg-[--saffron-100] text-[--saffron-600]",
};

export default function BlogPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
        <title>Blog — GovPlot Tracker | YEIDA, DDA, LDA & Government Plot Scheme Guides</title>
        <meta
          name="description"
          content="In-depth guides, comparisons, and investment analysis for government residential plot lottery schemes across India. YEIDA 2026, DDA, LDA, BDA, MHADA and more."
        />
        <link rel="canonical" href="https://govplottracker.com/blog" />
      </Head>

      <div className="min-h-screen bg-[--bg-page]">
        {/* Header */}
        <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] text-white px-4 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[--teal-400] text-[13px] font-semibold mb-6 hover:text-[--teal-300] transition"
            >
              ← Back to home
            </Link>
            <div className="inline-flex items-center gap-2 bg-[--teal-800]/50 border border-[--teal-600]/30 px-3 py-1.5 rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-[--teal-400] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[--teal-300]">5 New Articles — YEIDA RPS10/2026</span>
            </div>
            <h1 className="text-[36px] sm:text-[48px] font-[Outfit] font-900 text-white mt-2 mb-4">
              Government Plot Scheme Guides &amp; Analysis
            </h1>
            <p className="text-[15px] text-[--teal-300]/90 leading-relaxed max-w-xl">
              Expert guides, head-to-head comparisons, and investment deep-dives for India's top government housing authorities — so you can apply with confidence and never miss a window.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Featured post — first post gets bigger treatment */}
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[--ink-400] mb-3">Featured</p>
            <article className="card card-hover overflow-hidden animate-fade-in-up">
              <div className="bg-gradient-to-br from-[--teal-700] to-[--teal-900] p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TAG_COLORS[POSTS[0].tag]}`}>
                    {POSTS[0].tag}
                  </span>
                  <span className="text-[11px] font-semibold text-[--teal-300] bg-[--teal-800]/50 px-2.5 py-1 rounded-full">
                    📍 {POSTS[0].city}
                  </span>
                  <span className="text-[11px] text-[--teal-400]">{POSTS[0].date}</span>
                </div>
                <h2 className="text-[20px] sm:text-[24px] font-[Outfit] font-800 text-white leading-snug mb-3 hover:text-[--teal-200]">
                  <Link href={`/blog/${POSTS[0].slug}`}>{POSTS[0].title}</Link>
                </h2>
                <p className="text-[13.5px] text-[--teal-300]/80 leading-relaxed mb-4">{POSTS[0].excerpt}</p>
                <Link
                  href={`/blog/${POSTS[0].slug}`}
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-white/15 hover:bg-white/25 transition px-4 py-2 rounded-full"
                >
                  Read article · {POSTS[0].readTime} read →
                </Link>
              </div>
            </article>
          </div>

          {/* Remaining 4 posts */}
          <div className="space-y-5">
            {POSTS.slice(1).map((post, i) => (
              <article
                key={post.slug}
                className="card card-hover p-6 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TAG_COLORS[post.tag] || "bg-[--ink-100] text-[--ink-600]"}`}>
                    {post.tag}
                  </span>
                  <span className="text-[11px] font-semibold text-[--ink-500] bg-[--ink-50] border border-[--ink-100] px-2.5 py-1 rounded-full">
                    📍 {post.city}
                  </span>
                  <span className="text-[11px] text-[--ink-400]">{post.date}</span>
                  <span className="text-[11px] text-[--ink-400]">· {post.readTime} read</span>
                </div>
                <h2 className="text-[17px] sm:text-[19px] font-[Outfit] font-700 text-[--ink-900] leading-snug mb-2 hover:text-[--teal-700]">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="text-[13.5px] text-[--ink-600] leading-relaxed mb-4">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-[13px] font-semibold text-[--teal-600] hover:text-[--teal-800] transition"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>

          {/* GovPlot Tracker CTA */}
          <div className="mt-12 bg-gradient-to-br from-[--teal-100] to-white border border-[--teal-200] rounded-3xl p-8 text-center">
            <div className="text-3xl mb-3">🏠</div>
            <h3 className="text-[20px] font-[Outfit] font-700 text-[--ink-900] mb-2">
              {isLoggedIn ? "Track Live Schemes Across 100+ Cities" : "Never Miss a Government Plot Lottery Again"}
            </h3>
            <p className="text-[13.5px] text-[--ink-600] mb-2">
              {isLoggedIn
                ? "Your free account gives you full access to all OPEN, ACTIVE, UPCOMING, and CLOSED scheme details."
                : "Sign up free to view all Open & Active scheme details across 100+ cities — YEIDA, DDA, LDA, BDA, MHADA and 45+ more authorities."}
            </p>
            <p className="text-[12.5px] text-[--ink-500] mb-5">
              Upgrade to Pro (₹99/mo) for instant Email + Telegram alerts the moment a new scheme opens in your city.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {!isLoggedIn ? (
                <button onClick={() => setAuthOpen(true)} className="btn-primary text-[14px] py-3 px-8">
                  Sign Up Free →
                </button>
              ) : (
                <Link href="/schemes" className="btn-primary text-[14px] py-3 px-8">
                  Browse All Schemes →
                </Link>
              )}
              <Link href="/pricing" className="btn-secondary text-[14px] py-3 px-8">
                View Alert Plans
              </Link>
            </div>
          </div>
        </div>

        {/* Mini footer */}
        <div className="border-t border-[--ink-100] py-6 text-center">
          <p className="text-[12px] text-[--ink-400]">
            © 2026 GovPlot Tracker ·{" "}
            <Link href="/privacy" className="hover:text-[--teal-600]">Privacy</Link> ·{" "}
            <Link href="/terms" className="hover:text-[--teal-600]">Terms</Link> ·{" "}
            <Link href="/contact" className="hover:text-[--teal-600]">Contact</Link>
          </p>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
