import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthModal from "../../components/AuthModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PAGE_SIZE = 5;

type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  city?: string | null;
  tag?: string | null;
  is_featured?: boolean;
  read_time_mins?: number | null;
  published_at?: string | null;
  cover_image_url?: string | null;
};

type BlogPageProps = {
  posts: BlogPost[];
  total: number;
  page: number;
  pages: number;
  fetchFailed: boolean;
};

const TAG_COLORS: Record<string, string> = {
  "Breaking News": "bg-[--teal-100] text-[--teal-700]",
  Comparison: "bg-[--sky-100] text-sky-700",
  Analysis: "bg-[--amber-100] text-amber-700",
  Investment: "bg-green-100 text-green-700",
  "How-To Guide": "bg-[--saffron-100] text-[--saffron-600]",
  Announcement: "bg-violet-100 text-violet-700",
  General: "bg-[--ink-100] text-[--ink-600]",
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

function pageHref(page: number) {
  return page <= 1 ? "/blog" : `/blog?page=${page}`;
}

function visiblePages(current: number, total: number) {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function PostMeta({ post, inverted = false }: { post: BlogPost; inverted?: boolean }) {
  const tag = post.tag || "General";
  const date = formatDate(post.published_at);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TAG_COLORS[tag] || TAG_COLORS.General}`}>
        {tag}
      </span>
      {post.city && (
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            inverted
              ? "text-[--teal-300] bg-[--teal-800]/50"
              : "text-[--ink-500] bg-[--ink-50] border border-[--ink-100]"
          }`}
        >
          {post.city}
        </span>
      )}
      {date && <span className={`text-[11px] ${inverted ? "text-[--teal-400]" : "text-[--ink-400]"}`}>{date}</span>}
      <span className={`text-[11px] ${inverted ? "text-[--teal-400]" : "text-[--ink-400]"}`}>
        {post.read_time_mins || 5} min read
      </span>
    </div>
  );
}

export default function BlogPage({ posts, total, page, pages, fetchFailed }: BlogPageProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const featured = useMemo(() => posts.find((post) => post.is_featured) || posts[0], [posts]);
  const remaining = useMemo(
    () => posts.filter((post) => !featured || post.id !== featured.id),
    [featured, posts]
  );

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
        <title>Blog — GovPlot Tracker | Government Plot Scheme Guides</title>
        <meta
          name="description"
          content="In-depth guides, comparisons, and investment analysis for government residential plot lottery schemes across India."
        />
        <link rel="canonical" href={pageHref(page).startsWith("/") ? `https://govplottracker.com${pageHref(page)}` : "https://govplottracker.com/blog"} />
      </Head>

      <div className="min-h-screen bg-[--bg-page]">
        <div className="bg-gradient-to-br from-[--teal-900] to-[--ink-900] text-white px-4 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[--teal-400] text-[13px] font-semibold mb-6 hover:text-[--teal-300] transition"
            >
              Back to home
            </Link>
            <div className="inline-flex items-center gap-2 bg-[--teal-800]/50 border border-[--teal-600]/30 px-3 py-1.5 rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-[--teal-400] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[--teal-300]">
                {total ? `${total} Published Article${total === 1 ? "" : "s"}` : "GovPlot Guides"}
              </span>
            </div>
            <h1 className="text-[36px] sm:text-[48px] font-[Outfit] font-900 text-white mt-2 mb-4">
              Government Plot Scheme Guides &amp; Analysis
            </h1>
            <p className="text-[15px] text-[--teal-300]/90 leading-relaxed max-w-xl">
              Expert guides, head-to-head comparisons, and investment deep-dives for India's government housing authorities.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">
          {fetchFailed && (
            <div className="card border border-red-200 bg-red-50 p-5 mb-6 text-[13px] text-red-700">
              Blog posts could not be loaded right now. Please try again in a moment.
            </div>
          )}

          {!posts.length && !fetchFailed && (
            <div className="card p-8 text-center">
              <h2 className="text-[22px] font-[Outfit] font-800 text-[--ink-900] mb-2">No published blogs yet</h2>
              <p className="text-[13.5px] text-[--ink-600]">
                New guides will appear here as soon as they are published from the admin panel.
              </p>
            </div>
          )}

          {featured && (
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[--ink-400] mb-3">Featured</p>
              <article className="card card-hover overflow-hidden animate-fade-in-up">
                {featured.cover_image_url && (
                  <img src={featured.cover_image_url} alt="" className="h-56 w-full object-cover" />
                )}
                <div className="bg-gradient-to-br from-[--teal-700] to-[--teal-900] p-6 sm:p-8">
                  <PostMeta post={featured} inverted />
                  <h2 className="text-[20px] sm:text-[24px] font-[Outfit] font-800 text-white leading-snug mb-3 hover:text-[--teal-200]">
                    <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                  </h2>
                  {featured.excerpt && (
                    <p className="text-[13.5px] text-[--teal-300]/80 leading-relaxed mb-4">{featured.excerpt}</p>
                  )}
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-white/15 hover:bg-white/25 transition px-4 py-2 rounded-lg"
                  >
                    Read article
                  </Link>
                </div>
              </article>
            </div>
          )}

          {!!remaining.length && (
            <div className="space-y-5">
              {remaining.map((post, i) => (
                <article
                  key={post.id}
                  className="card card-hover p-6 animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <PostMeta post={post} />
                  <h2 className="text-[17px] sm:text-[19px] font-[Outfit] font-700 text-[--ink-900] leading-snug mb-2 hover:text-[--teal-700]">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  {post.excerpt && <p className="text-[13.5px] text-[--ink-600] leading-relaxed mb-4">{post.excerpt}</p>}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-[13px] font-semibold text-[--teal-600] hover:text-[--teal-800] transition"
                  >
                    Read more
                  </Link>
                </article>
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Blog pagination">
              <Link className={`blog-pg ${page === 1 ? "disabled" : ""}`} href={pageHref(1)} aria-disabled={page === 1}>
                First
              </Link>
              <Link className={`blog-pg ${page === 1 ? "disabled" : ""}`} href={pageHref(Math.max(1, page - 1))} aria-disabled={page === 1}>
                Previous
              </Link>
              {visiblePages(page, pages).map((p) => (
                <Link key={p} className={`blog-pg ${p === page ? "on" : ""}`} href={pageHref(p)} aria-current={p === page ? "page" : undefined}>
                  {p}
                </Link>
              ))}
              <Link className={`blog-pg ${page === pages ? "disabled" : ""}`} href={pageHref(Math.min(pages, page + 1))} aria-disabled={page === pages}>
                Next
              </Link>
              <Link className={`blog-pg ${page === pages ? "disabled" : ""}`} href={pageHref(pages)} aria-disabled={page === pages}>
                Last
              </Link>
            </nav>
          )}

          <div className="mt-12 bg-gradient-to-br from-[--teal-100] to-white border border-[--teal-200] rounded-lg p-8 text-center">
            <h3 className="text-[20px] font-[Outfit] font-700 text-[--ink-900] mb-2">
              {isLoggedIn ? "Track Live Schemes Across the Top-20 Watchlist" : "Never Miss a Government Plot Lottery Again"}
            </h3>
            <p className="text-[13.5px] text-[--ink-600] mb-2">
              {isLoggedIn
                ? "Your free account gives you full access to all OPEN, ACTIVE, UPCOMING, and CLOSED scheme details."
                : "Sign up free to view Open & Active scheme details across the 20-city watchlist."}
            </p>
            <p className="text-[12.5px] text-[--ink-500] mb-5">
              Upgrade to Pro for instant Email + Telegram alerts the moment a new scheme opens in your city.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {!isLoggedIn ? (
                <button onClick={() => setAuthOpen(true)} className="btn-primary text-[14px] py-3 px-8">
                  Sign Up Free
                </button>
              ) : (
                <Link href="/schemes" className="btn-primary text-[14px] py-3 px-8">
                  Browse All Schemes
                </Link>
              )}
              <Link href="/pricing" className="btn-secondary text-[14px] py-3 px-8">
                View Alert Plans
              </Link>
            </div>
          </div>
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

      <style jsx>{`
        .blog-pg {
          min-width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--ink-200);
          background: white;
          color: var(--ink-600);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.15s ease;
        }
        .blog-pg:hover {
          border-color: var(--teal-500);
          color: var(--teal-700);
        }
        .blog-pg.on {
          background: var(--teal-600);
          border-color: var(--teal-600);
          color: white;
        }
        .blog-pg.disabled {
          opacity: 0.45;
          pointer-events: none;
        }
      `}</style>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<BlogPageProps> = async ({ query }) => {
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = Math.max(1, Number.parseInt(rawPage || "1", 10) || 1);

  try {
    const res = await fetch(`${API}/api/v1/admin/data/public/blogs?page=${page}&limit=${PAGE_SIZE}`);
    if (!res.ok) throw new Error(`Blog API returned ${res.status}`);
    const data = await res.json();
    const total = Number(data.total || 0);
    const pages = Number(data.pages || Math.max(1, Math.ceil(total / PAGE_SIZE)));

    return {
      props: {
        posts: data.items || [],
        total,
        page,
        pages,
        fetchFailed: false,
      },
    };
  } catch {
    return {
      props: {
        posts: [],
        total: 0,
        page,
        pages: 1,
        fetchFailed: true,
      },
    };
  }
};
