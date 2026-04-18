// frontend/pages/blog/[slug].tsx
// NEW FILE — dynamic route that reads ANY blog from the DB by slug.
// This replaces the individual hardcoded blog files (yeida-*.tsx etc.)
// The existing 5 YEIDA blog files can stay — this file handles ALL new blogs
// created from the admin panel automatically.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthModal from "../../components/AuthModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Blog {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content_html: string;
  city?: string;
  tag?: string;
  author?: string;
  read_time_mins?: number;
  is_published: boolean;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  cover_image_url?: string;
  meta_title?: string;
  meta_desc?: string;
}

const TAG_MAP: Record<string, { bg: string; color: string }> = {
  "Breaking News": { bg: "rgba(13,122,104,.15)",  color: "#0d7a68" },
  Comparison:      { bg: "rgba(14,165,233,.12)",   color: "#0284c7" },
  Analysis:        { bg: "rgba(245,158,11,.12)",   color: "#b45309" },
  Investment:      { bg: "rgba(34,197,94,.12)",    color: "#15803d" },
  "How-To Guide":  { bg: "rgba(139,92,246,.12)",   color: "#7c3aed" },
  General:         { bg: "rgba(107,114,128,.12)",  color: "#4b5563" },
};

const tagStyle = (tag?: string): React.CSSProperties => {
  const s = TAG_MAP[tag || "General"] || TAG_MAP["General"];
  return { background:s.bg, color:s.color, fontSize:"11px", fontWeight:700, padding:"3px 10px", borderRadius:"20px", textTransform:"uppercase", letterSpacing:"0.4px" };
};

const fmt = (d?: string) => d
  ? new Date(d).toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" })
  : "";

export default function BlogPost() {
  const router = useRouter();
  const { slug } = router.query;

  const [blog,     setBlog]     = useState<Blog | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const check = () => setLoggedIn(!!localStorage.getItem("govplot_auth_user"));
    check();
    window.addEventListener("govplot-auth-changed", check);
    return () => window.removeEventListener("govplot-auth-changed", check);
  }, []);

  useEffect(() => {
    if (!slug || typeof slug !== "string") return;
    loadBlog(slug);
  }, [slug]);

  async function loadBlog(s: string) {
    setLoading(true); setNotFound(false);
    try {
      // Try fetching by slug from the blogs list
      const res = await fetch(
        `${API}/api/v1/admin/data/blogs?limit=100&offset=0`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.items || []).find(
        (b: Blog) => b.slug === s && b.is_published
      );
      if (!found) { setNotFound(true); return; }
      setBlog(found);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const siteUrl = "https://govplottracker.com";

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-page)", color:"var(--ink-400)" }}>
        <div>
          <div style={{ fontSize:"36px", textAlign:"center", animation:"spin 0.9s linear infinite" }}>⟳</div>
          <p style={{ marginTop:"12px", fontSize:"14px", textAlign:"center" }}>Loading article…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"16px", background:"var(--bg-page)" }}>
        <div style={{ fontSize:"48px" }}>😕</div>
        <h1 style={{ fontSize:"22px", fontWeight:700, color:"var(--ink-900)" }}>Article Not Found</h1>
        <p style={{ fontSize:"14px", color:"var(--ink-500)" }}>This article may have been unpublished or the URL is incorrect.</p>
        <Link href="/blog" style={{ color:"var(--teal-600)", fontWeight:600, fontSize:"14px" }}>← Back to all articles</Link>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <>
      <Head>
        <title>{blog.meta_title || `${blog.title} | GovPlot Tracker`}</title>
        <meta name="description" content={blog.meta_desc || blog.excerpt || ""} />
        <link rel="canonical" href={`${siteUrl}/blog/${blog.slug}`} />
        <meta property="og:title"       content={blog.meta_title || blog.title} />
        <meta property="og:description" content={blog.meta_desc  || blog.excerpt || ""} />
        <meta property="og:type"        content="article" />
        <meta property="og:url"         content={`${siteUrl}/blog/${blog.slug}`} />
        {blog.cover_image_url && <meta property="og:image" content={blog.cover_image_url} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: blog.title,
            description: blog.excerpt || "",
            datePublished: blog.published_at || blog.created_at,
            dateModified: blog.updated_at,
            author: { "@type": "Organization", name: blog.author || "GovPlot Tracker" },
            publisher: { "@type": "Organization", name: "GovPlot Tracker", url: siteUrl },
          })}}
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

          {/* Cover image */}
          {blog.cover_image_url && (
            <div style={{ marginBottom:"28px", borderRadius:"14px", overflow:"hidden" }}>
              <img src={blog.cover_image_url} alt={blog.title} style={{ width:"100%", maxHeight:"400px", objectFit:"cover" }} />
            </div>
          )}

          {/* Article header */}
          <div className="mb-8">
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"16px", alignItems:"center" }}>
              {blog.tag && <span style={tagStyle(blog.tag)}>{blog.tag}</span>}
              {blog.city && (
                <span style={{ fontSize:"11px", fontWeight:600, color:"var(--ink-500)", background:"var(--ink-50)", border:"1px solid var(--ink-100)", padding:"3px 10px", borderRadius:"20px" }}>
                  📍 {blog.city}
                </span>
              )}
              <span style={{ fontSize:"11px", color:"var(--ink-400)" }}>
                {fmt(blog.published_at || blog.created_at)}
              </span>
              {blog.read_time_mins && (
                <span style={{ fontSize:"11px", color:"var(--ink-400)" }}>· {blog.read_time_mins} min read</span>
              )}
              {blog.author && (
                <span style={{ fontSize:"11px", color:"var(--ink-400)" }}>· ✍️ {blog.author}</span>
              )}
            </div>

            <h1 className="text-[30px] sm:text-[38px] font-[Outfit] font-900 text-[--ink-900] leading-tight mb-4">
              {blog.title}
            </h1>

            {blog.excerpt && (
              <p style={{ fontSize:"15px", color:"var(--ink-600)", lineHeight:1.8, borderLeft:"4px solid var(--teal-400)", paddingLeft:"16px" }}>
                {blog.excerpt}
              </p>
            )}
          </div>

          {/* Article body — rendered from HTML stored in DB */}
          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: blog.content_html }}
          />

          {/* CTA */}
          <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] rounded-3xl p-8 text-center mt-10 mb-8">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="text-[20px] font-[Outfit] font-700 text-white mb-2">
              Never Miss a Government Plot Lottery Again
            </h3>
            <p className="text-[13.5px] text-[--teal-300]/90 mb-5 max-w-lg mx-auto">
              GovPlot Tracker monitors a focused 20-city watchlist including YEIDA, LDA, JDA, DDA, BDA, HMDA and CIDCO. Get an alert by Email or Telegram the moment a scheme opens.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {!loggedIn ? (
                <button onClick={() => setAuthOpen(true)} className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[14px] py-3 px-6">
                  Sign Up Free & Get Alerts →
                </button>
              ) : (
                <Link href="/dashboard" className="btn-primary bg-white text-[--teal-700] hover:bg-[--teal-50] text-[14px] py-3 px-6">
                  Go to My Dashboard →
                </Link>
              )}
              <Link href="/schemes" className="btn-ghost text-white border-white/30 hover:bg-white/10 text-[14px] py-3 px-6">
                View All Open Schemes
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
        @keyframes spin { to { transform: rotate(360deg); } }
        .prose-custom h2 {
          font-family: var(--font-display);
          font-size: 20px; font-weight: 800;
          color: var(--ink-900);
          margin: 2rem 0 0.75rem; line-height: 1.3;
        }
        .prose-custom h3 {
          font-family: var(--font-display);
          font-size: 17px; font-weight: 700;
          color: var(--ink-800);
          margin: 1.5rem 0 0.5rem;
        }
        .prose-custom p {
          font-size: 15px; color: var(--ink-700);
          line-height: 1.85; margin-bottom: 1.1rem;
        }
        .prose-custom ul {
          margin: 0.5rem 0 1.25rem 1.25rem; list-style: disc;
        }
        .prose-custom ul li {
          font-size: 15px; color: var(--ink-700);
          line-height: 1.85; margin-bottom: 0.4rem;
        }
        .prose-custom ol {
          margin: 0.5rem 0 1.25rem 1.25rem; list-style: decimal;
        }
        .prose-custom ol li {
          font-size: 15px; color: var(--ink-700);
          line-height: 1.85; margin-bottom: 0.4rem;
        }
        .prose-custom strong { color: var(--ink-900); font-weight: 700; }
        .prose-custom em    { color: var(--ink-600); font-style: italic; }
        .prose-custom a     { color: var(--teal-600); text-decoration: underline; }
        .prose-custom a:hover { color: var(--teal-800); }
        .prose-custom table {
          width: 100%; border-collapse: collapse;
          font-size: 13.5px; margin: 1rem 0 1.5rem;
        }
        .prose-custom th {
          background: var(--ink-900); color: #fff;
          padding: 10px 12px; text-align: left;
          font-weight: 700; font-size: 12px;
        }
        .prose-custom td {
          padding: 9px 12px;
          border-bottom: 1px solid var(--ink-100);
          color: var(--ink-700);
        }
        .prose-custom tr:nth-child(even) td { background: var(--ink-50); }
        .prose-custom blockquote {
          border-left: 4px solid var(--teal-400);
          padding-left: 16px; color: var(--ink-600);
          font-style: italic; margin: 1rem 0;
        }
      `}</style>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
