import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const NAV_ITEMS = [
  { href: "/admin_backend/dashboard",    icon: "⬛", label: "Dashboard"     },
  { href: "/admin_backend/schemes",      icon: "🏠", label: "Schemes"       },
  { href: "/admin_backend/blogs",        icon: "📝", label: "Blogs"         },
  { href: "/admin_backend/subscriptions",icon: "🔔", label: "Subscriptions" },
  { href: "/admin_backend/users",        icon: "👥", label: "Users"         },
];

interface Props { children: ReactNode; title?: string; }

export default function AdminLayout({ children, title = "Admin" }: Props) {
  const router = useRouter();
  const [email, setEmail]         = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("govplot_admin_token") : null;
    const em    = typeof window !== "undefined" ? localStorage.getItem("govplot_admin_email") || "" : "";
    if (!token) { router.replace("/admin_backend/login"); return; }
    setEmail(em);
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      const t = localStorage.getItem("govplot_admin_token");
      await fetch(`${API}/api/v1/admin/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
      });
    } catch {}
    localStorage.removeItem("govplot_admin_token");
    localStorage.removeItem("govplot_admin_email");
    router.push("/admin_backend/login");
  }

  const cur = router.pathname;
  const initials = email ? email[0].toUpperCase() : "A";
  const displayEmail = email.length > 24 ? email.slice(0, 22) + "…" : email;

  return (
    <div className={`root ${collapsed ? "collapsed" : ""}`}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">🏠</div>
          {!collapsed && (
            <div className="logo-text">
              <span className="logo-name">GovPlot</span>
              <span className="logo-tag">Admin</span>
            </div>
          )}
          <button className="collapse-btn" onClick={() => setCollapsed(v => !v)}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Nav */}
        <nav className="nav">
          {NAV_ITEMS.map(n => (
            <Link key={n.href} href={n.href}
              className={`nav-item ${cur === n.href ? "active" : ""}`}
              title={collapsed ? n.label : undefined}>
              <span className="nav-ico">{n.icon}</span>
              {!collapsed && <span className="nav-label">{n.label}</span>}
              {cur === n.href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-foot">
          {!collapsed && (
            <div className="user-pill">
              <div className="avatar">{initials}</div>
              <div className="user-info">
                <span className="user-em">{displayEmail}</span>
                <span className="user-role">Administrator</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="avatar-solo" title={email}>{initials}</div>
          )}
          <button
            className={`logout-btn ${collapsed ? "logout-sm" : ""}`}
            onClick={logout} disabled={loggingOut}
            title="Logout">
            <span>🚪</span>
            {!collapsed && <span>{loggingOut ? "Logging out…" : "Logout"}</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main">
        <header className="topbar">
          <h1 className="page-title">{title}</h1>
          <div className="topbar-right">
            <span className="env-badge">LIVE DB</span>
            <a href="https://govplottracker.com" target="_blank" rel="noopener noreferrer"
              className="site-link">
              View Site ↗
            </a>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>

      {/* ── Global styles ── */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: #060f1a;
          color: #e0e8f0;
          -webkit-font-smoothing: antialiased;
        }
        a { text-decoration: none; color: inherit; }
        button { font-family: inherit; cursor: pointer; }

        /* ── Layout ── */
        .root { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .sidebar {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 228px;
          background: #040c15;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          transition: width 0.22s ease;
          z-index: 200;
        }
        .root.collapsed .sidebar { width: 64px; }

        .sidebar-logo {
          display: flex; align-items: center; gap: 10px;
          padding: 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          min-height: 62px;
          overflow: hidden;
        }
        .logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #0d7a68, #12c2a4);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(13,122,104,0.35);
        }
        .logo-text { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        .logo-name {
          font-family: 'Outfit', system-ui, sans-serif;
          font-weight: 800; font-size: 15px; color: #fff;
          white-space: nowrap; letter-spacing: -0.2px;
        }
        .logo-tag {
          font-size: 9px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 2.5px; color: #12c2a4;
        }
        .collapse-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.35);
          width: 22px; height: 22px;
          border-radius: 6px; font-size: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-left: auto;
          transition: all 0.2s;
        }
        .collapse-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }

        /* Nav */
        .nav {
          flex: 1; padding: 10px 8px;
          display: flex; flex-direction: column; gap: 2px;
          overflow-y: auto;
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 11px; border-radius: 10px;
          font-size: 13.5px; font-weight: 500;
          color: rgba(255,255,255,0.42);
          transition: all 0.15s;
          white-space: nowrap; overflow: hidden;
          position: relative;
        }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
        .nav-item.active {
          background: rgba(13,122,104,0.16);
          color: #34d9bc;
          border: 1px solid rgba(13,122,104,0.22);
          font-weight: 600;
        }
        .nav-ico { font-size: 16px; flex-shrink: 0; }
        .nav-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
        .nav-dot {
          width: 5px; height: 5px;
          background: #12c2a4; border-radius: 50%;
          flex-shrink: 0;
        }

        /* Sidebar footer */
        .sidebar-foot {
          padding: 10px 8px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column; gap: 8px;
        }
        .user-pill {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 10px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          overflow: hidden;
        }
        .avatar {
          width: 30px; height: 30px;
          background: linear-gradient(135deg, #0d7a68, #12c2a4);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 12px; color: #fff;
          flex-shrink: 0;
        }
        .avatar-solo {
          width: 36px; height: 36px; margin: 0 auto;
          background: linear-gradient(135deg, #0d7a68, #12c2a4);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 13px; color: #fff;
          cursor: default;
        }
        .user-info { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .user-em {
          font-size: 11.5px; font-weight: 600;
          color: rgba(255,255,255,0.65);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .user-role {
          font-size: 9.5px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1.5px; color: #0f9e87;
        }
        .logout-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 11px; border-radius: 10px;
          border: 1px solid rgba(239,68,68,0.18);
          background: none;
          color: rgba(252,165,165,0.6);
          font-size: 13px; font-weight: 600;
          transition: all 0.2s;
          width: 100%; justify-content: flex-start;
        }
        .logout-btn.logout-sm { justify-content: center; padding: 8px; }
        .logout-btn:hover:not(:disabled) { background: rgba(239,68,68,0.09); color: #fca5a5; }
        .logout-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Main area ── */
        .main {
          margin-left: 228px;
          flex: 1;
          min-height: 100vh;
          display: flex; flex-direction: column;
          transition: margin-left 0.22s ease;
        }
        .root.collapsed .main { margin-left: 64px; }

        .topbar {
          position: sticky; top: 0; z-index: 100;
          background: rgba(6,15,26,0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 0 28px;
          height: 62px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .page-title {
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 19px; font-weight: 800; color: #fff;
          letter-spacing: -0.3px;
        }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .env-badge {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1.5px;
          padding: 4px 9px; border-radius: 6px;
          background: rgba(13,122,104,0.15);
          color: #12c2a4;
          border: 1px solid rgba(13,122,104,0.25);
        }
        .site-link {
          font-size: 12.5px; font-weight: 600;
          color: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 6px 13px; border-radius: 8px;
          transition: all 0.2s;
        }
        .site-link:hover { color: #12c2a4; border-color: rgba(13,122,104,0.35); }

        .content { padding: 26px 28px; flex: 1; }

        /* ── Shared components ── */
        .a-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 22px;
        }

        .a-table {
          width: 100%; border-collapse: collapse;
          font-size: 13.5px;
        }
        .a-table th {
          text-align: left; padding: 9px 14px;
          font-size: 10.5px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px;
          color: rgba(255,255,255,0.32);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          white-space: nowrap;
        }
        .a-table td {
          padding: 11px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.75);
          vertical-align: middle;
        }
        .a-table tr:last-child td { border-bottom: none; }
        .a-table tbody tr:hover td { background: rgba(255,255,255,0.025); }

        .a-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 9px;
          padding: 10px 13px;
          font-size: 13.5px; font-family: inherit;
          color: #fff; outline: none;
          transition: border-color 0.2s;
        }
        .a-input::placeholder { color: rgba(255,255,255,0.22); }
        .a-input:focus { border-color: rgba(13,122,104,0.55); }

        .a-select {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 9px;
          padding: 10px 13px;
          font-size: 13.5px; font-family: inherit;
          color: #fff; outline: none;
          width: 100%; cursor: pointer;
        }
        .a-select option { background: #0a111a; }

        .a-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 9px;
          padding: 10px 13px;
          font-size: 13.5px; font-family: inherit;
          color: #fff; outline: none;
          resize: vertical; min-height: 80px;
        }
        .a-textarea:focus { border-color: rgba(13,122,104,0.55); }

        .f-label {
          display: block;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px;
          color: rgba(255,255,255,0.38);
          margin-bottom: 5px;
        }
        .f-group { display: flex; flex-direction: column; gap: 5px; }

        .btn-p {
          background: linear-gradient(135deg, #0d7a68, #0f9e87);
          border: none; border-radius: 9px;
          padding: 9px 18px;
          font-size: 13px; font-weight: 700;
          font-family: 'Outfit', system-ui, sans-serif;
          color: #fff;
          transition: all 0.2s;
          box-shadow: 0 3px 14px rgba(13,122,104,0.3);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-p:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-p:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .btn-s {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 9px;
          padding: 9px 18px;
          font-size: 13px; font-weight: 600;
          font-family: inherit;
          color: rgba(255,255,255,0.65);
          transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-s:hover { background: rgba(255,255,255,0.1); color: #fff; }

        .btn-d {
          background: rgba(220,38,38,0.12);
          border: 1px solid rgba(220,38,38,0.25);
          border-radius: 9px;
          padding: 9px 18px;
          font-size: 13px; font-weight: 600;
          font-family: inherit;
          color: #fca5a5;
          transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-d:hover { background: rgba(220,38,38,0.22); }

        .sm { padding: 5px 11px !important; font-size: 11.5px !important; }

        .badge {
          display: inline-flex; align-items: center;
          padding: 3px 9px; border-radius: 20px;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .bg-green  { background: rgba(34,197,94,0.14);  color: #4ade80; }
        .bg-red    { background: rgba(239,68,68,0.14);  color: #f87171; }
        .bg-yellow { background: rgba(234,179,8,0.14);  color: #facc15; }
        .bg-blue   { background: rgba(59,130,246,0.14); color: #60a5fa; }
        .bg-teal   { background: rgba(13,122,104,0.16); color: #34d9bc; }
        .bg-gray   { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.45); }

        .toggle {
          position: relative; display: inline-block;
          width: 42px; height: 23px; flex-shrink: 0;
        }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute; cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(255,255,255,0.13);
          border-radius: 23px; transition: 0.28s;
        }
        .slider:before {
          position: absolute; content: "";
          height: 17px; width: 17px;
          left: 3px; bottom: 3px;
          background: white; border-radius: 50%; transition: 0.28s;
        }
        input:checked + .slider { background: #0d7a68; }
        input:checked + .slider:before { transform: translateX(19px); }

        .modal-bg {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(10px);
          z-index: 500;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .modal {
          background: #0c1822;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px;
          padding: 26px;
          width: 100%; max-width: 640px;
          max-height: 92vh; overflow-y: auto;
        }
        .modal-h {
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 18px; font-weight: 800; color: #fff;
          margin-bottom: 18px;
        }
        .modal-actions {
          display: flex; gap: 10px;
          justify-content: flex-end; margin-top: 18px;
        }

        .page-btns {
          display: flex; align-items: center; gap: 5px;
          margin-top: 18px; justify-content: center;
        }
        .pg-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.09);
          background: none;
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .pg-btn:hover:not(:disabled) { background: rgba(255,255,255,0.07); color: #fff; }
        .pg-btn.on { background: rgba(13,122,104,0.25); color: #34d9bc; border-color: rgba(13,122,104,0.35); }
        .pg-btn:disabled { opacity: 0.28; cursor: default; }

        .spin-row {
          display: flex; align-items: center; justify-content: center;
          height: 180px; gap: 10px;
          color: rgba(255,255,255,0.28); font-size: 14px;
        }
        .spin-ico { animation: spin 0.8s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .err-msg { color: #f87171; font-size: 13px; margin-top: 10px; }
        .ok-msg  { color: #4ade80; font-size: 13px; margin-top: 10px; }
      `}</style>
    </div>
  );
}
