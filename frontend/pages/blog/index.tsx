import Head from "next/head";
import Link from "next/link";

// Static blog posts (replace with API/CMS data later)
const POSTS = [
  { slug: "how-to-apply-lda-scheme-2025",      title: "How to Apply for LDA Plot Scheme 2025 — Step by Step Guide",        city: "Lucknow",   date: "Mar 15, 2026", readTime: "6 min", tag: "Guide", excerpt: "A complete step-by-step walkthrough of the Lucknow Development Authority plot scheme application process — from registration to lottery draw." },
  { slug: "yeida-vs-gnida-which-is-better",    title: "YEIDA vs GNIDA — Which Government Plot Scheme is Better in 2026?",  city: "Noida",     date: "Mar 10, 2026", readTime: "8 min", tag: "Comparison", excerpt: "We compare Yamuna Expressway and Greater Noida authorities on price, connectivity, returns, and scheme reliability." },
  { slug: "best-government-plots-india-2026",  title: "Best Government Plot Schemes in India 2026 — Ranked",                city: "All",       date: "Mar 5, 2026",  readTime: "10 min", tag: "Rankings", excerpt: "Our ranking of the best active and upcoming government residential plot schemes across India based on price, location, and authority track record." },
  { slug: "bda-bangalore-plot-guide",          title: "BDA Bangalore Plot Scheme — Everything You Need to Know",            city: "Bangalore", date: "Feb 28, 2026", readTime: "7 min", tag: "Guide", excerpt: "The Bangalore Development Authority's residential site allotment process explained — eligibility, price, timeline, and application tips." },
  { slug: "mhada-lottery-mumbai-2026",         title: "MHADA Mumbai Lottery 2026 — How to Register and Increase Chances", city: "Mumbai",    date: "Feb 20, 2026", readTime: "5 min", tag: "Guide", excerpt: "Everything you need to know about the MHADA Mumbai lottery — from registration to draw results and documentation." },
  { slug: "hsvp-gurgaon-sectors-worth-buying", title: "HSVP Gurgaon Sectors Worth Buying in 2026",                         city: "Gurgaon",   date: "Feb 14, 2026", readTime: "6 min", tag: "Investment", excerpt: "Which HSVP sectors in Gurgaon offer the best appreciation potential? We analyse 10 sectors based on connectivity, infrastructure, and past allotment data." },
];

const TAG_COLORS: Record<string, string> = {
  Guide: "bg-[--teal-100] text-[--teal-700]",
  Comparison: "bg-[--sky-100] text-sky-700",
  Rankings: "bg-[--saffron-100] text-[--saffron-600]",
  Investment: "bg-green-100 text-green-700",
};

export default function BlogPage() {
  return (
    <>
      <Head>
        <title>Blog — GovPlot Tracker | Government Plot Scheme Guides</title>
        <meta name="description" content="Expert guides, comparisons, and rankings for government residential plot schemes in India. LDA, BDA, GNIDA, MHADA, HSVP and more." />
        <link rel="canonical" href="https://govplottracker.com/blog" />
      </Head>

      {/* No top nav per Pages Map spec — blog is SEO-focused standalone */}
      <div className="min-h-screen bg-[--bg-page]">
        {/* Header */}
        <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] text-white px-4 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-[--teal-400] text-[13px] font-semibold mb-6 hover:text-[--teal-300] transition">
              ← Back to home
            </Link>
            <span className="section-label text-[--teal-400]">Knowledge Base</span>
            <h1 className="text-[36px] sm:text-[48px] font-[Outfit] font-900 text-white mt-2 mb-4">
              Government Plot Scheme Guides
            </h1>
            <p className="text-[15px] text-[--teal-300]/90 leading-relaxed max-w-xl">
              In-depth guides, comparisons, and expert insights for plot buyers tracking India's top housing authorities.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Posts */}
          <div className="space-y-6">
            {POSTS.map((post, i) => (
              <article
                key={post.slug}
                className="card card-hover p-6 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TAG_COLORS[post.tag] || TAG_COLORS.Guide}`}>
                    {post.tag}
                  </span>
                  {post.city !== "All" && (
                    <span className="text-[11px] font-semibold text-[--ink-500] bg-[--ink-50] border border-[--ink-100] px-2.5 py-1 rounded-full">
                      📍 {post.city}
                    </span>
                  )}
                  <span className="text-[11px] text-[--ink-400]">{post.date}</span>
                  <span className="text-[11px] text-[--ink-400]">· {post.readTime} read</span>
                </div>
                <h2 className="text-[18px] font-[Outfit] font-700 text-[--ink-900] leading-snug mb-2 hover:text-[--teal-700]">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="text-[13.5px] text-[--ink-600] leading-relaxed mb-4">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`} className="text-[13px] font-semibold text-[--teal-600] hover:text-[--teal-800] transition">
                  Read more →
                </Link>
              </article>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-br from-[--teal-100] to-white border border-[--teal-200] rounded-3xl p-8 text-center">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="text-[20px] font-[Outfit] font-700 text-[--ink-900] mb-2">Don't miss a scheme opening</h3>
            <p className="text-[13.5px] text-[--ink-600] mb-5">Subscribe for free alerts when new schemes open in your city.</p>
            <Link href="/" className="btn-primary text-[14px] py-3 px-8">
              Get Free Alerts →
            </Link>
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
    </>
  );
}
