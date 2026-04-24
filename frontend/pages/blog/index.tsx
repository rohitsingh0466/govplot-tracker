import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Head from "next/head";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PER_PAGE = 9;

interface Blog {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  tag?: string;
  city?: string;
  author?: string;
  published_at?: string;
  created_at: string;
  cover_image_url?: string;
  read_time_mins?: number;
  is_featured?: boolean;
}

export default function BlogIndexPage() {
  const [blogs, setBlogs]     = useState<Blog[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page,  setPage]      = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const offset = (p - 1) * PER_PAGE;
      // ✅ FIXED: calls /api/v1/blogs/ (public, no auth needed)
      const res = await fetch(
        `${API}/api/v1/blogs/?limit=${PER_PAGE}&offset=${offset}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const d = await res.json();
      setBlogs(d.items || []);
      setTotal(d.total  || 0);
      setPages(d.pages  || 1);
    } catch (e: any) {
      setError(e.message || "Could not load articles. Please try again.");
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  function fmt(dt?: string) {
    if (!dt) return "";
    return new Date(dt).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  return (
    <>
      <Head>
        <title>Government Plot Scheme Guides & Analysis — GovPlot Tracker</title>
        <meta name="description" content="Expert guides and latest news on government residential plot lottery schemes across India." />
        <meta property="og:title" content="GovPlot Blog — Government Plot Scheme Guides" />
      </Head>

      <div style={s.page}>
        {/* ── Header ── */}
        <div style={s.headerWrap}>
          <Link href="/" style={s.backLink}>← Back to home</Link>
          <h1 style={s.h1}>Government Plot Scheme Guides &amp; Analysis</h1>
          <p style={s.subtitle}>
            Expert guides, head-to-head comparisons, and investment deep-dives for India's
            top government housing authorities.
          </p>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div style={s.errorBanner}>
            <span>⚠️ {error}</span>
            <button onClick={() => load(page)} style={s.retryBtn}>Retry</button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={s.centerBox}>
            <div style={s.spinner}>⟳</div>
            <p style={s.loadingText}>Loading articles…</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && blogs.length === 0 && (
          <div style={s.centerBox}>
            <p style={s.emptyText}>No published articles yet. Check back soon!</p>
          </div>
        )}

        {/* ── Grid ── */}
        {!loading && blogs.length > 0 && (
          <>
            <div style={s.grid}>
              {blogs.map((b) => (
                <article key={b.id} style={s.card}>
                  {b.cover_image_url && (
                    <div style={s.imgWrap}>
                      <img src={b.cover_image_url} alt={b.title} style={s.img} />
                    </div>
                  )}
                  <div style={s.cardBody}>
                    <div style={s.metaRow}>
                      {b.tag  && <span style={s.tagBadge}>{b.tag}</span>}
                      {b.city && <span style={s.cityBadge}>{b.city}</span>}
                      <span style={s.dateText}>{fmt(b.published_at || b.created_at)}</span>
                      {b.read_time_mins && (
                        <span style={s.readTime}>{b.read_time_mins} min read</span>
                      )}
                    </div>
                    <h2 style={s.cardTitle}>{b.title}</h2>
                    {b.excerpt && <p style={s.cardExcerpt}>{b.excerpt}</p>}
                    {b.author  && <p style={s.authorText}>✍️ {b.author}</p>}
                    <Link href={`/blog/${b.slug}`} style={s.readMore}>
                      Read full article →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* ── Pagination ── */}
            {pages > 1 && (
              <nav style={s.paginationWrap}>
                <button
                  style={{ ...s.pgBtn, ...(page <= 1 ? s.pgBtnOff : {}) }}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ← Prev
                </button>

                <div style={s.pageNums}>
                  {(() => {
                    // Show at most 7 page numbers with ellipsis logic
                    const nums: (number | "...")[] = [];
                    if (pages <= 7) {
                      for (let i = 1; i <= pages; i++) nums.push(i);
                    } else {
                      nums.push(1);
                      if (page > 3)   nums.push("...");
                      for (let i = Math.max(2, page-1); i <= Math.min(pages-1, page+1); i++) nums.push(i);
                      if (page < pages - 2) nums.push("...");
                      nums.push(pages);
                    }
                    return nums.map((n, i) =>
                      n === "..." ? (
                        <span key={`e${i}`} style={s.ellipsis}>…</span>
                      ) : (
                        <button
                          key={n}
                          style={{ ...s.pgNum, ...(page === n ? s.pgNumActive : {}) }}
                          onClick={() => setPage(n as number)}
                        >
                          {n}
                        </button>
                      )
                    );
                  })()}
                </div>

                <button
                  style={{ ...s.pgBtn, ...(page >= pages ? s.pgBtnOff : {}) }}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                >
                  Next →
                </button>
              </nav>
            )}

            {/* Pagination info */}
            <p style={s.paginationInfo}>
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} articles
            </p>
          </>
        )}

        {/* ── CTA Banner ── */}
        <div style={s.ctaBanner}>
          <div style={s.ctaIcon}>🏠</div>
          <p style={s.ctaTitle}>Track Live Schemes Across the Top-20 Watchlist</p>
          <p style={s.ctaSub}>
            Your free account gives you full access to all OPEN, ACTIVE, UPCOMING, and CLOSED scheme details.
          </p>
          <div style={s.ctaBtns}>
            <Link href="/schemes" style={s.ctaBtnPrimary}>Browse All Schemes →</Link>
            <Link href="/pricing" style={s.ctaBtnSecondary}>View Alert Plans</Link>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .blog-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.10) !important;
          border-color: #0d7a68 !important;
        }
        .read-more-hover:hover { color: #0a5f53 !important; }
      `}</style>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f7f4ef",
    fontFamily: "'Source Serif 4', Georgia, serif",
  },
  headerWrap: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "48px 24px 40px",
  },
  backLink: {
    display: "inline-block",
    fontSize: 14,
    color: "#0d7a68",
    textDecoration: "none",
    fontFamily: "'Source Serif 4', serif",
    marginBottom: 20,
    fontWeight: 400,
  },
  h1: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(28px, 5vw, 48px)",
    fontWeight: 800,
    color: "#1a1208",
    lineHeight: 1.15,
    margin: "0 0 16px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 17,
    color: "#5c5244",
    lineHeight: 1.7,
    margin: 0,
    maxWidth: 560,
  },
  errorBanner: {
    maxWidth: 960,
    margin: "0 auto 24px",
    padding: "14px 20px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#dc2626",
    fontSize: 14,
    fontFamily: "'Source Serif 4', serif",
  },
  retryBtn: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Source Serif 4', serif",
  },
  centerBox: {
    textAlign: "center",
    padding: "80px 24px",
  },
  spinner: {
    fontSize: 48,
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
    marginBottom: 12,
    color: "#0d7a68",
  },
  loadingText: {
    color: "#7a6e62",
    fontSize: 16,
  },
  emptyText: {
    color: "#7a6e62",
    fontSize: 16,
  },
  grid: {
    maxWidth: 960,
    margin: "0 auto 48px",
    padding: "0 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    border: "1px solid #e8e0d4",
    overflow: "hidden",
    transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
    display: "flex",
    flexDirection: "column",
    animation: "fadeUp 0.4s ease both",
  },
  imgWrap: {
    width: "100%",
    height: 180,
    overflow: "hidden",
    backgroundColor: "#f0ebe3",
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease",
  },
  cardBody: {
    padding: "20px 20px 22px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  metaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 10,
  },
  tagBadge: {
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: "#e0f2ef",
    color: "#0d7a68",
    padding: "3px 8px",
    borderRadius: 20,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontFamily: "'Source Serif 4', serif",
  },
  cityBadge: {
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "3px 8px",
    borderRadius: 20,
    fontFamily: "'Source Serif 4', serif",
  },
  dateText: {
    fontSize: 12,
    color: "#9d8e7f",
  },
  readTime: {
    fontSize: 11,
    color: "#9d8e7f",
    fontStyle: "italic",
  },
  cardTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 17,
    fontWeight: 700,
    color: "#1a1208",
    marginBottom: 10,
    lineHeight: 1.4,
    flex: 1,
  },
  cardExcerpt: {
    fontSize: 13.5,
    color: "#5c5244",
    lineHeight: 1.65,
    marginBottom: 12,
  },
  authorText: {
    fontSize: 12,
    color: "#8a7d6e",
    marginBottom: 12,
  },
  readMore: {
    color: "#0d7a68",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    transition: "color 0.2s",
    marginTop: "auto",
  },
  paginationWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: "0 24px 16px",
    flexWrap: "wrap",
  },
  pgBtn: {
    padding: "9px 16px",
    border: "1px solid #d4c9bb",
    backgroundColor: "white",
    color: "#3d342a",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Source Serif 4', serif",
    transition: "all 0.2s",
  },
  pgBtnOff: {
    opacity: 0.35,
    cursor: "not-allowed",
  },
  pageNums: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  pgNum: {
    width: 36,
    height: 36,
    border: "1px solid #d4c9bb",
    backgroundColor: "white",
    color: "#3d342a",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Source Serif 4', serif",
    transition: "all 0.2s",
  },
  pgNumActive: {
    backgroundColor: "#0d7a68",
    color: "white",
    borderColor: "#0d7a68",
  },
  ellipsis: {
    fontSize: 14,
    color: "#9d8e7f",
    padding: "0 4px",
  },
  paginationInfo: {
    textAlign: "center",
    fontSize: 13,
    color: "#9d8e7f",
    padding: "0 24px 40px",
    fontFamily: "'Source Serif 4', serif",
  },
  ctaBanner: {
    maxWidth: 960,
    margin: "0 auto 60px",
    padding: "40px 32px",
    backgroundColor: "#e8f5f2",
    border: "1px solid #b2ddd5",
    borderRadius: 16,
    textAlign: "center",
  },
  ctaIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  ctaTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#1a1208",
    marginBottom: 8,
  },
  ctaSub: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 22,
    lineHeight: 1.6,
  },
  ctaBtns: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  ctaBtnPrimary: {
    backgroundColor: "#0d7a68",
    color: "white",
    padding: "12px 24px",
    borderRadius: 30,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Source Serif 4', serif",
  },
  ctaBtnSecondary: {
    backgroundColor: "white",
    color: "#0d7a68",
    padding: "12px 24px",
    borderRadius: 30,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 700,
    border: "1px solid #0d7a68",
    fontFamily: "'Source Serif 4', serif",
  },
};
