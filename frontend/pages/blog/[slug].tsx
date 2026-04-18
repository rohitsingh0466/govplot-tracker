import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthModal from "../../components/AuthModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  content_html: string;
  city?: string | null;
  tag?: string | null;
  read_time_mins?: number | null;
  published_at?: string | null;
  updated_at?: string | null;
  meta_title?: string | null;
  meta_desc?: string | null;
  cover_image_url?: string | null;
};

type BlogDetailProps = {
  post: BlogPost;
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BlogDetailPage({ post }: BlogDetailProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://govplottracker.com";
  const publishedDate = formatDate(post.published_at);

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
        <title>{post.meta_title || `${post.title} — GovPlot Tracker`}</title>
        <meta name="description" content={post.meta_desc || post.excerpt || post.title} />
        <link rel="canonical" href={`${siteUrl}/blog/${post.slug}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.title,
              description: post.meta_desc || post.excerpt || post.title,
              datePublished: post.published_at,
              dateModified: post.updated_at || post.published_at,
              image: post.cover_image_url ? [post.cover_image_url] : undefined,
              mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
              author: {
                "@type": "Organization",
                name: "GovPlot Tracker",
              },
              publisher: {
                "@type": "Organization",
                name: "GovPlot Tracker",
              },
            }),
          }}
        />
      </Head>

      <div className="min-h-screen bg-[--bg-page]">
        <article>
          <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] text-white px-4 py-10 sm:py-14">
            <div className="max-w-3xl mx-auto">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-[--teal-400] text-[13px] font-semibold mb-6 hover:text-[--teal-300] transition"
              >
                Back to blog
              </Link>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[--teal-100] text-[--teal-700]">
                  {post.tag || "General"}
                </span>
                {post.city && (
                  <span className="text-[11px] font-semibold text-[--teal-300] bg-[--teal-800]/50 px-2.5 py-1 rounded-full">
                    {post.city}
                  </span>
                )}
                {publishedDate && <span className="text-[11px] text-[--teal-400]">{publishedDate}</span>}
                <span className="text-[11px] text-[--teal-400]">{post.read_time_mins || 5} min read</span>
              </div>
              <h1 className="text-[34px] sm:text-[48px] font-[Outfit] font-900 text-white leading-tight mb-4">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-[15px] sm:text-[17px] text-[--teal-300]/90 leading-relaxed max-w-2xl">
                  {post.excerpt}
                </p>
              )}
            </div>
          </div>

          {post.cover_image_url && (
            <div className="max-w-3xl mx-auto px-4 -mt-8">
              <img
                src={post.cover_image_url}
                alt=""
                className="w-full max-h-[420px] object-cover rounded-lg border border-[--ink-100] shadow-lg"
              />
            </div>
          )}

          <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="card p-6 sm:p-9">
              <div className="blog-prose" dangerouslySetInnerHTML={{ __html: post.content_html }} />
            </div>

            <div className="mt-10 bg-gradient-to-br from-[--teal-100] to-white border border-[--teal-200] rounded-lg p-8 text-center">
              <h2 className="text-[20px] font-[Outfit] font-700 text-[--ink-900] mb-2">
                {isLoggedIn ? "Track Live Government Plot Schemes" : "Never Miss a Government Plot Lottery Again"}
              </h2>
              <p className="text-[13.5px] text-[--ink-600] mb-5">
                {isLoggedIn
                  ? "Browse active, upcoming, and closed scheme details from your GovPlot account."
                  : "Create a free account to view scheme details across the 20-city watchlist."}
              </p>
              {!isLoggedIn ? (
                <button onClick={() => setAuthOpen(true)} className="btn-primary text-[14px] py-3 px-8">
                  Sign Up Free
                </button>
              ) : (
                <Link href="/schemes" className="btn-primary text-[14px] py-3 px-8">
                  Browse All Schemes
                </Link>
              )}
            </div>
          </div>
        </article>
      </div>

      <style jsx>{`
        .blog-prose {
          color: var(--ink-700);
          font-size: 15px;
          line-height: 1.8;
        }
        .blog-prose :global(h2) {
          color: var(--ink-900);
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 800;
          margin: 30px 0 12px;
        }
        .blog-prose :global(h3) {
          color: var(--ink-900);
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 800;
          margin: 24px 0 10px;
        }
        .blog-prose :global(p) {
          margin: 0 0 16px;
        }
        .blog-prose :global(ul),
        .blog-prose :global(ol) {
          margin: 12px 0 18px 22px;
        }
        .blog-prose :global(li) {
          margin-bottom: 8px;
        }
        .blog-prose :global(a) {
          color: var(--teal-700);
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .blog-prose :global(strong) {
          color: var(--ink-900);
          font-weight: 800;
        }
        .blog-prose :global(img) {
          border-radius: 8px;
          margin: 22px 0;
          max-width: 100%;
        }
        .blog-prose :global(table) {
          width: 100%;
          border-collapse: collapse;
          margin: 22px 0;
          font-size: 14px;
        }
        .blog-prose :global(th),
        .blog-prose :global(td) {
          border: 1px solid var(--ink-100);
          padding: 10px 12px;
          text-align: left;
          vertical-align: top;
        }
        .blog-prose :global(th) {
          background: var(--ink-50);
          color: var(--ink-900);
        }
      `}</style>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<BlogDetailProps> = async ({ params }) => {
  const slug = typeof params?.slug === "string" ? params.slug : "";

  try {
    const res = await fetch(`${API}/api/v1/admin/data/public/blogs/${encodeURIComponent(slug)}`);
    if (res.status === 404) return { notFound: true };
    if (!res.ok) throw new Error(`Blog API returned ${res.status}`);
    const post = await res.json();

    return { props: { post } };
  } catch {
    return { notFound: true };
  }
};
