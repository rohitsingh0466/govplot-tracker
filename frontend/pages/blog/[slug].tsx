import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import AdSenseSlot from "../../components/AdSenseSlot";
import AuthModal from "../../components/AuthModal";

const POSTS: Record<string, any> = {
  "how-to-apply-lda-scheme-2025": {
    title: "How to Apply for LDA Plot Scheme 2025 — Step by Step Guide",
    city: "Lucknow", authority: "LDA", date: "March 15, 2026", readTime: "6 min",
    tag: "Guide", excerpt: "A complete walkthrough of the LDA plot scheme application process.",
    content: `
## What is the LDA Plot Scheme?

The Lucknow Development Authority (LDA) periodically releases residential plot schemes across different sectors of Lucknow. These schemes are open to Indian citizens meeting basic eligibility criteria and offer plots at government-regulated prices — typically 20-40% below market rates.

## Eligibility Criteria

- Indian citizen, 18 years or older
- Applicant (or spouse) must not own a plot/house in any LDA scheme
- Annual household income within the specified slab for the category applied
- Valid Aadhaar and PAN card

## Step-by-Step Application Process

**Step 1 — Check the official notification**
Visit [lda.up.nic.in](https://lda.up.nic.in) for the latest scheme brochure. GovPlot Tracker alerts you automatically when a new scheme is announced.

**Step 2 — Register on the LDA portal**
Create an account on the LDA online portal. You'll need your Aadhaar number, PAN, and mobile number linked to Aadhaar.

**Step 3 — Fill the online application form**
Select the scheme, plot size category, preferred sector, and payment method. Double-check all details before submission.

**Step 4 — Pay the application/registration fee**
Pay online via UPI, net banking, or debit card. Keep the payment receipt safely.

**Step 5 — Wait for the draw**
If applications exceed supply, LDA conducts a computerised draw (lottery). Results are published on the portal and announced via SMS.

**Step 6 — Allotment and payment**
Allotted applicants receive a letter with payment timeline. Typically, 10-25% is paid within 30 days, rest in instalments.

## Tips to Increase Your Chances

- Apply under the correct category — income slab mismatches lead to disqualification
- Apply as a family unit if both you and spouse are eligible — some schemes allow separate applications
- Keep all documents digitised and handy
- Sign up for GovPlot Tracker alerts so you never miss the application window

## Timeline (Typical)

| Stage | Duration |
|-------|----------|
| Application window | 15-45 days |
| Draw date | 30-60 days after close |
| Allotment letter | 15 days after draw |
| First payment due | 30 days after allotment |

## Common Mistakes to Avoid

- Submitting incorrect income proof
- Not checking the specific scheme brochure for that year's terms
- Missing the application deadline
- Not updating mobile number on Aadhaar before applying
    `,
  },
};

export default function BlogPostPage({ post, slug }: { post: any; slug: string }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("govplot_auth_user") : null;
    setIsLoggedIn(!!raw);
    const handler = () => setIsLoggedIn(!!localStorage.getItem("govplot_auth_user"));
    window.addEventListener("govplot-auth-changed", handler);
    return () => window.removeEventListener("govplot-auth-changed", handler);
  }, []);

  if (!post) return <div className="p-20 text-center">Post not found</div>;

  const siteUrl = "https://govplottracker.com";
  const title = `${post.title} | GovPlot Tracker Blog`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`${siteUrl}/blog/${slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "BlogPosting",
          headline: post.title, description: post.excerpt,
          datePublished: post.date, author: { "@type": "Organization", name: "GovPlot Tracker" },
        })}} />
      </Head>

      <div className="min-h-screen bg-[--bg-page]">
        {/* Top bar */}
        <div className="bg-white border-b border-[--ink-100] py-3 px-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href="/blog" className="text-[13px] font-semibold text-[--teal-600] hover:text-[--teal-800] transition">← All articles</Link>
            <Link href="/" className="text-[13px] font-semibold text-[--ink-500] hover:text-[--ink-900]">govplottracker.com</Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-10">
          {/* Top ad */}
          <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_BLOG_TOP} format="horizontal" className="mb-8" label="Blog Post — Top Ad" />

          {/* Article header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[11px] font-bold bg-[--teal-100] text-[--teal-700] px-2.5 py-1 rounded-full">{post.tag}</span>
              <span className="text-[11px] text-[--ink-500]">📍 {post.city}</span>
              <span className="text-[11px] text-[--ink-400]">{post.date} · {post.readTime} read</span>
            </div>
            <h1 className="text-[28px] sm:text-[36px] font-[Outfit] font-900 text-[--ink-900] leading-tight mb-4">{post.title}</h1>
            <p className="text-[15px] text-[--ink-600] leading-relaxed border-l-4 border-[--teal-400] pl-4">{post.excerpt}</p>
          </div>

          {/* Content */}
          <div
            className="prose prose-sm sm:prose max-w-none
              prose-headings:font-[Outfit] prose-headings:font-700 prose-headings:text-[--ink-900]
              prose-p:text-[--ink-700] prose-p:leading-relaxed
              prose-a:text-[--teal-600] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[--ink-900] prose-strong:font-700
              prose-li:text-[--ink-700]
              prose-table:text-[13px]
              prose-th:bg-[--ink-50] prose-th:font-[Outfit] prose-th:font-700"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
          />

          {/* Mid ad */}
          <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_BLOG_MID} format="rectangle" className="my-10" label="Blog Post — Mid Ad" />

          {/* CTA — updated: no AlertModal, sign up + upgrade messaging */}
          <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] rounded-3xl p-8 text-center mt-10">
            <div className="text-3xl mb-3">{isLoggedIn ? "📈" : "🔔"}</div>
            <h3 className="text-[20px] font-[Outfit] font-700 text-white mb-2">
              {isLoggedIn ? "Track more live schemes" : "Never miss a scheme opening"}
            </h3>
            <p className="text-[--teal-300]/90 text-[13.5px] mb-2">
              {isLoggedIn
                ? "You already have access to full Open and Active scheme details."
                : "Sign up free to view all Open & Active scheme details."}
            </p>
            <p className="text-[--teal-400]/80 text-[12.5px] mb-5">
              Upgrade to Pro (₹99/mo) to get instant Email + Telegram alerts for {post.authority || "any authority"}.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {!isLoggedIn ? (
                <button onClick={() => setAuthOpen(true)} className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[14px] py-3 px-6">
                  Sign Up Free →
                </button>
              ) : (
                <Link href="/schemes" className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[14px] py-3 px-6">
                  Browse Schemes →
                </Link>
              )}
              <Link href="/pricing" className="btn-ghost text-white border-white/30 hover:bg-white/10 text-[14px] py-3 px-6">
                View Plans
              </Link>
            </div>
          </div>

          {/* Related link */}
          <div className="mt-8 text-center">
            <Link href="/blog" className="text-[13px] text-[--teal-600] font-semibold hover:text-[--teal-800]">← More articles</Link>
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

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^\| (.+) \|$/gm, (_, row) => `<tr>${row.split('|').map((c: string) => `<td>${c.trim()}</td>`).join('')}</tr>`)
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table><tbody>$&</tbody></table>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hultap])/gm, '<p>')
    .replace(/(?<!\>)$/gm, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[hul])/g, '$1')
    .replace(/(<\/[hul][^>]*>)<\/p>/g, '$1');
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  const post = POSTS[slug] || null;
  return { props: { post, slug } };
};
