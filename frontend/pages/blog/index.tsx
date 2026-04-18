// frontend/pages/blog/index.tsx
// REPLACES the current index.tsx (which re-exports blog-index-updated.tsx)
// Now fetches ALL blogs from the API — admin-created blogs appear instantly.
// Pagination built in — 6 per page, works for any number of blogs.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthModal from "../../components/AuthModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PER_PAGE = 6;

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
  cover_image_url?: string;
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
  return {
    background: s.bg, color: s.color,
    fontSize: "11px", fontWeight: 700,
    padding: "3px 10px", borderRadius: "20px",
    textTransform: "uppercase", letterSpacing: "0.4px",
  };
};

const fmt = (d?: string) => d
  ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
  : "";

export default function BlogPage() {
  const [blogs,      setBlogs]      = useState<Blog[]>([]);
  const [featured,   setFeatured]   = useState<Blog | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [authOpen,   setAuthOpen]   = useState(false);
  const [loggedIn,   setLoggedIn]   = useState(false);

  useEffect(() => {
    const check = () => setLoggedIn(!!localStorage.getItem("govplot_auth_user"));
    check();
    window.addEventListener("govplot-auth-changed", check);
    return () => window.removeEventListener("govplot-auth-changed", check);
  }, []);

  useEffect(() => { load(page); }, [page]);

  async function load(p: number) {
    setLoading(true); setError("");
    try {
      const offset = (p - 1) * PER_PAGE;
      const res = await fetch(
        `${API}/api/v1/admin/data/blogs?limit=100&offset=0`,
        { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const all: Blog[] = (data.items || []).filter((b: Blog) => b.is_published);

      setTotalCount(all.length);
      setTotalPages(Math.max(1, Math.ceil(all.length / PER_PAGE)));

      const start = (p - 1) * PER_PAGE;
      const pageItems = all.slice(start, start + PER_PAGE);

      if (p === 1) {
        const feat = all.find((b) => b.is_featured) || all[0] || null;
        setFeatured(feat);
        setBlogs(feat ? pageItems.filter((b) => b.id !== feat.id) : pageItems);
      } else {
        setFeatured(null);
        setBlogs(pageItems);
      }
    } catch (e: any) {
      setError("Could not load articles. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <>
      <Head>
        <title>Blog — GovPlot Tracker | Government Plot Scheme Guides</title>
        <meta name="description" content="In-depth guides, comparisons, and investment analysis for government residential plot lottery schemes across India." />
        <link rel="canonical" href="https://govplottracker.com/blog" />
      </Head>

      <div className="min-h-screen bg-[--bg-page]">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] text-white px-4 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-[--teal-400] text-[13px] font-semibold mb-6 hover:text-[--teal-300] transition">
              ← Back to home
            </Link>
            {totalCount > 0 && !loading && (
              <div className="inline-flex items-center gap-2 bg-[--teal-800]/50 border border-[--teal-600]/30 px-3 py-1.5 rounded-full mb-4">
                <span className="w-2 h-2 rounded-full bg-[--teal-400] animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[--teal-300]">
                  {totalCount} Article{totalCount !== 1 ? "s" : ""} Published
                </span>
              </div>
            )}
            <h1 className="text-[36px] sm:text-[48px] font-[Outfit] font-900 text-white mt-2 mb-4">
              Government Plot Scheme Guides &amp; Analysis
            </h1>
            <p className="text-[15px] text-[--teal-300]/90 leading-relaxed max-w-xl">
              Expert guides, head-to-head comparisons, and investment deep-dives for India's top government housing authorities.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">

          {/* Error */}
          {error && (
            <div style={{ background:"rgba(220,38,38,.08)", border:"1px solid rgba(220,38,38,.2)", borderRadius:"10px", padding:"14px 18px", color:"#dc2626", fontSize:"14px", marginBottom:"24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>⚠️ {error}</span>
              <button onClick={() => load(page)} style={{ background:"#dc2626", color:"#fff", border:"none", padding:"6px 14px", borderRadius:"6px", cursor:"pointer", fontSize:"13px" }}>Retry</button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign:"center", padding:"80px 0", color:"var(--ink-400)" }}>
              <div style={{ fontSize:"36px", display:"inline-block", animation:"spin 0.9s linear infinite" }}>⟳</div>
              <p style={{ marginTop:"12px", fontSize:"14px" }}>Loading articles…</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && blogs.length === 0 && !featured && (
            <div style={{ textAlign:"center", padding:"80px 0", color:"var(--ink-400)", fontSize:"15px" }}>
              No published articles yet. Check back soon!
            </div>
          )}

          {/* Featured (page 1 only) */}
          {!loading && featured && page === 1 && (
            <div className="mb-6">
              <p style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--ink-400)", marginBottom:"12px" }}>Featured</p>
              <article className="card card-hover overflow-hidden animate-fade-in-up">
                <div className="bg-gradient-to-br from-[--teal-700] to-[--teal-900] p-6 sm:p-8">
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"12px", alignItems:"center" }}>
                    {featured.tag && <span style={tagStyle(featured.tag)}>{featured.tag}</span>}
                    {featured.city && <span style={{ fontSize:"11px", fontWeight:600, color:"var(--teal-300)", background:"rgba(13,122,104,.3)", padding:"3px 10px", borderRadius:"20px" }}>📍 {featured.city}</span>}
                    <span style={{ fontSize:"11px", color:"var(--teal-400)" }}>{fmt(featured.published_at || featured.created_at)}</span>
                    {featured.read_time_mins && <span style={{ fontSize:"11px", color:"var(--teal-400)" }}>· {featured.read_time_mins} min read</span>}
                  </div>
                  <h2 className="text-[20px] sm:text-[24px] font-[Outfit] font-800 text-white leading-snug mb-3 hover:text-[--teal-200]">
                    <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                  </h2>
                  {featured.excerpt && (
                    <p style={{ fontSize:"13.5px", color:"rgba(153,246,228,.8)", lineHeight:1.7, marginBottom:"16px" }}>{featured.excerpt}</p>
                  )}
                  <Link href={`/blog/${featured.slug}`} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-white/15 hover:bg-white/25 transition px-4 py-2 rounded-full">
                    Read article{featured.read_time_mins ? ` · ${featured.read_time_mins} min` : ""} →
                  </Link>
                </div>
              </article>
            </div>
          )}

          {/* Blog list */}
          {!loading && blogs.length > 0 && (
            <div className="space-y-5">
              {blogs.map((post, i) => (
                <article key={post.id} className="card card-hover p-6 animate-fade-in-up" style={{ animationDelay:`${i * 60}ms` }}>
                  {post.cover_image_url && (
                    <img src={post.cover_image_url} alt={post.title} style={{ width:"100%", height:"180px", objectFit:"cover", borderRadius:"8px", marginBottom:"14px" }} />
                  )}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"12px", alignItems:"center" }}>
                    {post.tag && <span style={tagStyle(post.tag)}>{post.tag}</span>}
                    {post.city && <span style={{ fontSize:"11px", fontWeight:600, color:"var(--ink-500)", background:"var(--ink-50)", border:"1px solid var(--ink-100)", padding:"3px 10px", borderRadius:"20px" }}>📍 {post.city}</span>}
                    <span style={{ fontSize:"11px", color:"var(--ink-400)" }}>{fmt(post.published_at || post.created_at)}</span>
                    {post.read_time_mins && <span style={{ fontSize:"11px", color:"var(--ink-400)" }}>· {post.read_time_mins} min read</span>}
                  </div>
                  <h2 className="text-[17px] sm:text-[19px] font-[Outfit] font-700 text-[--ink-900] leading-snug mb-2 hover:text-[--teal-700]">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  {post.excerpt && <p style={{ fontSize:"13.5px", color:"var(--ink-600)", lineHeight:1.75, marginBottom:"14px" }}>{post.excerpt}</p>}
                  {post.author && <p style={{ fontSize:"12px", color:"var(--ink-400)", marginBottom:"10px" }}>✍️ {post.author}</p>}
                  <Link href={`/blog/${post.slug}`} className="text-[13px] font-semibold text-[--teal-600] hover:text-[--teal-800] transition">
                    Read more →
                  </Link>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ marginTop:"40px" }}>
              <nav style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                <button onClick={() => setPage(Math.max(1, page-1))} disabled={page===1}
                  style={{ padding:"9px 16px", borderRadius:"8px", border:"1px solid var(--ink-200)", background:"var(--bg-card)", color:"var(--ink-700)", fontSize:"13px", fontWeight:600, cursor:page===1?"not-allowed":"pointer", opacity:page===1?0.4:1 }}>
                  ← Prev
                </button>
                {pageNums.map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ width:"38px", height:"38px", borderRadius:"8px", border:`1px solid ${page===n?"var(--teal-600)":"var(--ink-200)"}`, background:page===n?"var(--teal-600)":"var(--bg-card)", color:page===n?"#fff":"var(--ink-700)", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page===totalPages}
                  style={{ padding:"9px 16px", borderRadius:"8px", border:"1px solid var(--ink-200)", background:"var(--bg-card)", color:"var(--ink-700)", fontSize:"13px", fontWeight:600, cursor:page===totalPages?"not-allowed":"pointer", opacity:page===totalPages?0.4:1 }}>
                  Next →
                </button>
              </nav>
              <p style={{ textAlign:"center", fontSize:"12px", color:"var(--ink-400)", marginTop:"10px" }}>
                Page {page} of {totalPages} · {totalCount} article{totalCount!==1?"s":""} total
              </p>
            </div>
          )}

          {/* CTA */}
          {!loading && (
            <div className="mt-12 bg-gradient-to-br from-[--teal-100] to-white border border-[--teal-200] rounded-3xl p-8 text-center">
              <div className="text-3xl mb-3">🏠</div>
              <h3 className="text-[20px] font-[Outfit] font-700 text-[--ink-900] mb-2">
                {loggedIn ? "Track Live Schemes Across the Top-20 Watchlist" : "Never Miss a Government Plot Lottery Again"}
              </h3>
              <p className="text-[13.5px] text-[--ink-600] mb-5">
                {loggedIn ? "Your free account gives you full access to all OPEN, ACTIVE, UPCOMING, and CLOSED scheme details." : "Sign up free to view scheme details across the 20-city watchlist — YEIDA, DDA, LDA, JDA, BDA, HMDA and more."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {!loggedIn ? (
                  <button onClick={() => setAuthOpen(true)} className="btn-primary text-[14px] py-3 px-8">Sign Up Free →</button>
                ) : (
                  <Link href="/schemes" className="btn-primary text-[14px] py-3 px-8">Browse All Schemes →</Link>
                )}
                <Link href="/pricing" className="btn-secondary text-[14px] py-3 px-8">View Alert Plans</Link>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[--ink-100] py-6 text-center">
          <p className="text-[12px] text-[--ink-400]">
            © 2026 GovPlot Tracker ·{" "}
            <Link href="/privacy" className="hover:text-[--teal-600]">Privacy</Link> ·{" "}
            <Link href="/terms" className="hover:text-[--teal-600]">Terms</Link> ·{" "}
            <Link href="/contact" className="hover:text-[--teal-600]">Contact</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
