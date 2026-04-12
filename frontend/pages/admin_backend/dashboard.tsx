import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import AdminLayout from "../../components/AdminLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Stats = {
  schemes: { total:number; open:number; active:number; upcoming:number; closed:number; enabled:number; disabled:number; cities:number };
  users:   { total:number; free:number; pro:number; premium:number };
  blogs:   { total:number; published:number; drafts:number };
  alerts:  number;
};

interface CardProps { label:string; value:number|string; icon:string; accent:string; sub?:string; }
function StatCard({ label, value, icon, accent, sub }: CardProps) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${accent}` }}>
      <span className="sc-icon">{icon}</span>
      <div className="sc-value">{value}</div>
      <div className="sc-label">{label}</div>
      {sub && <div className="sc-sub">{sub}</div>}
      <style jsx>{`
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px; padding: 18px;
          display:flex; flex-direction:column; gap:4px;
          transition: transform 0.18s, background 0.25s, border-color 0.25s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .stat-card:hover { transform: translateY(-2px); }
        .sc-icon { font-size: 22px; margin-bottom:3px; }
        .sc-value {
          font-family:'Outfit',system-ui,sans-serif;
          font-size:30px; font-weight:900; color:var(--tile-val-color);
        }
        .sc-label {
          font-size:11px; font-weight:700;
          text-transform:uppercase; letter-spacing:1px;
          color:var(--tile-lbl-color); margin-top:2px;
        }
        .sc-sub { font-size:11px; color:var(--text-dim); }
      `}</style>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [time, setTime]       = useState("");

  async function load() {
    setLoading(true); setErr("");
    const t = localStorage.getItem("govplot_admin_token");
    try {
      const res = await fetch(`${API}/api/v1/admin/data/dashboard/stats`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) { window.location.href = "/admin_backend/login"; return; }
      setStats(await res.json());
      setTime(new Date().toLocaleTimeString("en-IN"));
    } catch { setErr("Failed to load dashboard stats. Check Railway is running."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <Head><title>Dashboard — GovPlot Admin</title></Head>
      <AdminLayout title="Dashboard">

        <div className="welcome">
          <div>
            <h2 className="w-title">{greet} 👋</h2>
            <p className="w-sub">{time ? `Stats as of ${time}` : "Loading your platform overview..."}</p>
          </div>
          <button className="refresh-btn" onClick={load} disabled={loading}>
            <span className={loading ? "spin-ico" : ""}>↻</span> Refresh
          </button>
        </div>

        {err && <div className="err-banner">⚠ {err}</div>}
        {loading && !stats && <div className="spin-row"><span className="spin-ico">⟳</span> Loading stats...</div>}

        {stats && (
          <>
            <section className="section">
              <div className="sec-hd">
                <h3 className="sec-title">🏠 Schemes</h3>
                <Link href="/admin_backend/schemes" className="sec-link">Manage →</Link>
              </div>
              <div className="grid-7">
                <StatCard label="Total"    value={stats.schemes.total}    icon="📋" accent="#0f9e87" />
                <StatCard label="Open"     value={stats.schemes.open}     icon="✅" accent="#16a34a" />
                <StatCard label="Active"   value={stats.schemes.active}   icon="⚡" accent="#2563eb" />
                <StatCard label="Upcoming" value={stats.schemes.upcoming} icon="🔜" accent="#d97706" />
                <StatCard label="Closed"   value={stats.schemes.closed}   icon="🔒" accent="#64748b" />
                <StatCard label="Enabled"  value={stats.schemes.enabled}  icon="👁" accent="#0d7a68"
                  sub={`${stats.schemes.disabled} hidden`} />
                <StatCard label="Cities"   value={stats.schemes.cities}   icon="🗺️" accent="#7c3aed" />
              </div>
            </section>

            <section className="section">
              <div className="sec-hd">
                <h3 className="sec-title">👥 Users</h3>
                <Link href="/admin_backend/users" className="sec-link">View all →</Link>
              </div>
              <div className="grid-5">
                <StatCard label="Total"   value={stats.users.total}   icon="👤" accent="#0f9e87" />
                <StatCard label="Free"    value={stats.users.free}    icon="🆓" accent="#64748b" />
                <StatCard label="Pro"     value={stats.users.pro}     icon="⭐" accent="#2563eb" />
                <StatCard label="Premium" value={stats.users.premium} icon="💎" accent="#d97706" />
                <StatCard label="Alerts"  value={stats.alerts}        icon="🔔" accent="#16a34a"
                  sub="active subscriptions" />
              </div>
            </section>

            <section className="section">
              <div className="sec-hd">
                <h3 className="sec-title">📝 Blog</h3>
                <Link href="/admin_backend/blogs" className="sec-link">Manage →</Link>
              </div>
              <div className="grid-3">
                <StatCard label="Total"     value={stats.blogs.total}     icon="📄" accent="#0f9e87" />
                <StatCard label="Published" value={stats.blogs.published} icon="🟢" accent="#16a34a" />
                <StatCard label="Drafts"    value={stats.blogs.drafts}    icon="✏️" accent="#d97706" />
              </div>
            </section>

            <section className="section">
              <h3 className="sec-title" style={{marginBottom:12}}>⚡ Quick Actions</h3>
              <div className="qa-grid">
                {[
                  { href:"/admin_backend/schemes?action=new", icon:"➕", label:"Add New Scheme",       sub:"Publish immediately" },
                  { href:"/admin_backend/blogs?action=new",   icon:"✍️", label:"Write Blog Post",     sub:"Visual + HTML editor" },
                  { href:"/admin_backend/subscriptions",       icon:"🔔", label:"Toggle Notifications", sub:"Email · Telegram · WhatsApp" },
                  { href:"/admin_backend/users",               icon:"👥", label:"View Users",           sub:"Filter by plan tier" },
                ].map(q => (
                  <Link key={q.href} href={q.href} className="qa-card">
                    <span className="qa-icon">{q.icon}</span>
                    <div className="qa-info">
                      <span className="qa-label">{q.label}</span>
                      <span className="qa-sub">{q.sub}</span>
                    </div>
                    <span className="qa-arr">→</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        <style jsx>{`
          .welcome {
            display:flex; align-items:center; justify-content:space-between;
            background:var(--welcome-bg);
            border:1px solid var(--welcome-border);
            border-radius:14px; padding:18px 22px; margin-bottom:24px;
          }
          .w-title { font-family:'Outfit',system-ui,sans-serif; font-size:20px; font-weight:800; color:var(--w-title-color); margin-bottom:3px; }
          .w-sub { font-size:13px; color:var(--w-sub-color); }
          .refresh-btn {
            display:flex; align-items:center; gap:6px;
            background:var(--refresh-bg); border:1px solid var(--refresh-border);
            color:var(--refresh-color); padding:8px 16px; border-radius:9px;
            font-size:13px; font-weight:600; transition:all 0.2s;
          }
          .refresh-btn:hover { background:var(--refresh-hover); }
          .refresh-btn:disabled { opacity:0.4; cursor:not-allowed; }

          .err-banner {
            color:#dc2626; padding:14px 18px;
            background:rgba(220,38,38,0.08);
            border:1px solid rgba(220,38,38,0.18);
            border-radius:10px; margin-bottom:20px; font-size:13.5px;
          }

          .section { margin-bottom:28px; }
          .sec-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
          .sec-title {
            font-family:'Outfit',system-ui,sans-serif;
            font-size:14px; font-weight:800;
            text-transform:uppercase; letter-spacing:1.5px;
            color:var(--sec-title-color);
          }
          .sec-link { font-size:12.5px; font-weight:600; color:var(--sec-link-color); transition:color 0.2s; }
          .sec-link:hover { color:var(--sec-link-hover); }

          .grid-7 { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:12px; }
          .grid-5 { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; }
          .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }

          .qa-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:11px; }
          .qa-card {
            display:flex; align-items:center; gap:12px;
            background:var(--bg-card); border:1px solid var(--border);
            border-radius:12px; padding:15px 16px; transition:all 0.18s;
            box-shadow:0 1px 3px rgba(0,0,0,0.04);
          }
          .qa-card:hover { background:var(--qa-hover-bg); border-color:var(--qa-hover-border); transform:translateY(-2px); }
          .qa-icon { font-size:20px; }
          .qa-info { display:flex; flex-direction:column; flex:1; gap:2px; }
          .qa-label { font-size:13.5px; font-weight:600; color:var(--text-qa-label); }
          .qa-sub   { font-size:11.5px; color:var(--text-qa-sub); }
          .qa-arr   { color:var(--text-qa-arr); font-size:15px; }
        `}</style>
      </AdminLayout>
    </>
  );
}
