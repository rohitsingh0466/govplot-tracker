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
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 18px;
          display:flex; flex-direction:column; gap:4px;
          transition: transform 0.18s;
        }
        .stat-card:hover { transform: translateY(-2px); }
        .sc-icon { font-size: 22px; margin-bottom:3px; }
        .sc-value {
          font-family:'Outfit',system-ui,sans-serif;
          font-size:30px; font-weight:900; color:#fff;
        }
        .sc-label {
          font-size:11px; font-weight:700;
          text-transform:uppercase; letter-spacing:1px;
          color:rgba(255,255,255,0.35); margin-top:2px;
        }
        .sc-sub { font-size:11px; color:rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]   = useState<Stats | null>(null);
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

        {/* Welcome */}
        <div className="welcome">
          <div>
            <h2 className="w-title">{greet} 👋</h2>
            <p className="w-sub">
              {time ? `Stats as of ${time}` : "Loading your platform overview…"}
            </p>
          </div>
          <button className="refresh-btn" onClick={load} disabled={loading}>
            <span className={loading ? "spin-ico" : ""}>↻</span> Refresh
          </button>
        </div>

        {err && <div style={{ color:"#f87171", padding:"16px", background:"rgba(239,68,68,0.08)", borderRadius:"10px", marginBottom:"20px" }}>⚠ {err}</div>}

        {loading && !stats && <div className="spin-row"><span className="spin-ico">⟳</span> Loading stats…</div>}

        {stats && (
          <>
            {/* Schemes */}
            <section className="section">
              <div className="sec-hd">
                <h3 className="sec-title">🏠 Schemes</h3>
                <Link href="/admin_backend/schemes" className="sec-link">Manage →</Link>
              </div>
              <div className="grid-7">
                <StatCard label="Total"     value={stats.schemes.total}    icon="📋" accent="#0f9e87" />
                <StatCard label="Open"      value={stats.schemes.open}     icon="✅" accent="#22c55e" />
                <StatCard label="Active"    value={stats.schemes.active}   icon="⚡" accent="#0ea5e9" />
                <StatCard label="Upcoming"  value={stats.schemes.upcoming} icon="🔜" accent="#f59e0b" />
                <StatCard label="Closed"    value={stats.schemes.closed}   icon="🔒" accent="#64748b" />
                <StatCard label="Enabled"   value={stats.schemes.enabled}  icon="👁" accent="#10b981"
                  sub={`${stats.schemes.disabled} hidden`} />
                <StatCard label="Cities"    value={stats.schemes.cities}   icon="🗺️" accent="#8b5cf6" />
              </div>
            </section>

            {/* Users */}
            <section className="section">
              <div className="sec-hd">
                <h3 className="sec-title">👥 Users</h3>
                <Link href="/admin_backend/users" className="sec-link">View all →</Link>
              </div>
              <div className="grid-5">
                <StatCard label="Total"    value={stats.users.total}   icon="👤" accent="#0f9e87" />
                <StatCard label="Free"     value={stats.users.free}    icon="🆓" accent="#64748b" />
                <StatCard label="Pro"      value={stats.users.pro}     icon="⭐" accent="#0ea5e9" />
                <StatCard label="Premium"  value={stats.users.premium} icon="💎" accent="#f59e0b" />
                <StatCard label="Alerts"   value={stats.alerts}        icon="🔔" accent="#10b981"
                  sub="active subscriptions" />
              </div>
            </section>

            {/* Blog */}
            <section className="section">
              <div className="sec-hd">
                <h3 className="sec-title">📝 Blog</h3>
                <Link href="/admin_backend/blogs" className="sec-link">Manage →</Link>
              </div>
              <div className="grid-3">
                <StatCard label="Total"     value={stats.blogs.total}     icon="📄" accent="#0f9e87" />
                <StatCard label="Published" value={stats.blogs.published} icon="🟢" accent="#22c55e" />
                <StatCard label="Drafts"    value={stats.blogs.drafts}    icon="✏️" accent="#f59e0b" />
              </div>
            </section>

            {/* Quick actions */}
            <section className="section">
              <h3 className="sec-title">⚡ Quick Actions</h3>
              <div className="qa-grid">
                {[
                  { href:"/admin_backend/schemes?action=new", icon:"➕", label:"Add New Scheme",      sub:"Publish immediately to frontend" },
                  { href:"/admin_backend/blogs?action=new",   icon:"✍️", label:"Write Blog Post",    sub:"Visual + HTML editor" },
                  { href:"/admin_backend/subscriptions",      icon:"🔔", label:"Toggle Notifications", sub:"Email · Telegram · WhatsApp · SMS" },
                  { href:"/admin_backend/users",              icon:"👥", label:"View Users",          sub:"Filter by plan tier" },
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
            display: flex; align-items: center; justify-content: space-between;
            background: linear-gradient(135deg, rgba(13,122,104,0.10), transparent);
            border: 1px solid rgba(13,122,104,0.18);
            border-radius: 14px; padding: 18px 22px;
            margin-bottom: 24px;
          }
          .w-title { font-family:'Outfit',system-ui,sans-serif; font-size:20px; font-weight:800; color:#fff; margin-bottom:3px; }
          .w-sub { font-size:13px; color:rgba(255,255,255,0.4); }
          .refresh-btn {
            display:flex; align-items:center; gap:6px;
            background: rgba(13,122,104,0.15);
            border: 1px solid rgba(13,122,104,0.28);
            color: #34d9bc; padding: 8px 16px;
            border-radius: 9px; font-size:13px; font-weight:600;
            transition: all 0.2s;
          }
          .refresh-btn:hover { background: rgba(13,122,104,0.25); }
          .refresh-btn:disabled { opacity:0.4; cursor:not-allowed; }

          .section { margin-bottom: 28px; }
          .sec-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
          .sec-title {
            font-family:'Outfit',system-ui,sans-serif;
            font-size:14px; font-weight:800;
            text-transform:uppercase; letter-spacing:1.5px;
            color:rgba(255,255,255,0.5);
          }
          .sec-link { font-size:12.5px; font-weight:600; color:#0f9e87; }
          .sec-link:hover { color:#34d9bc; }

          .grid-7 { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:12px; }
          .grid-5 { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; }
          .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }

          .qa-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:11px; }
          .qa-card {
            display:flex; align-items:center; gap:12px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius:12px; padding:15px 16px;
            transition: all 0.18s;
          }
          .qa-card:hover {
            background: rgba(13,122,104,0.08);
            border-color: rgba(13,122,104,0.22);
            transform: translateY(-2px);
          }
          .qa-icon { font-size:20px; }
          .qa-info { display:flex; flex-direction:column; flex:1; gap:2px; }
          .qa-label { font-size:13.5px; font-weight:600; color:rgba(255,255,255,0.78); }
          .qa-sub   { font-size:11.5px; color:rgba(255,255,255,0.3); }
          .qa-arr   { color:rgba(255,255,255,0.25); font-size:15px; }
        `}</style>
      </AdminLayout>
    </>
  );
}
