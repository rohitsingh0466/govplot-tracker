import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const NAV_ITEMS = [
  { href: "/admin_backend/dashboard",     icon: "⬛", label: "Dashboard"      },
  { href: "/admin_backend/schemes",       icon: "🏠", label: "Schemes"        },
  { href: "/admin_backend/blogs",         icon: "📝", label: "Blogs"          },
  { href: "/admin_backend/subscriptions", icon: "🔔", label: "Subscriptions"  },
  { href: "/admin_backend/users",         icon: "👥", label: "Users"          },
];

interface Props { children: ReactNode; title?: string; }

export default function AdminLayout({ children, title = "Admin" }: Props) {
  const router    = useRouter();
  const { theme, toggle } = useTheme();
  const [email, setEmail]           = useState("");
  const [collapsed, setCollapsed]   = useState(false);
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

  const cur      = router.pathname;
  const initials = email ? email[0].toUpperCase() : "A";
  const dispEm   = email.length > 24 ? email.slice(0, 22) + "..." : email;
  const isDark   = theme === "dark";

  return (
    <div className={`root ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar">
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
        <div className="sidebar-foot">
          {!collapsed && (
            <div className="user-pill">
              <div className="avatar">{initials}</div>
              <div className="user-info">
                <span className="user-em">{dispEm}</span>
                <span className="user-role">Administrator</span>
              </div>
            </div>
          )}
          {collapsed && <div className="avatar-solo" title={email}>{initials}</div>}
          <button className={`logout-btn ${collapsed ? "logout-sm" : ""}`}
            onClick={logout} disabled={loggingOut} title="Logout">
            <span>🚪</span>
            {!collapsed && <span>{loggingOut ? "Logging out..." : "Logout"}</span>}
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1 className="page-title">{title}</h1>
          <div className="topbar-right">
            <span className="env-badge">LIVE DB</span>
            <button className="theme-toggle" onClick={toggle}
              title={isDark ? "Switch to Light theme" : "Switch to Dark theme"}>
              <span className="theme-track">
                <span className="theme-thumb">{isDark ? "🌙" : "☀️"}</span>
              </span>
              <span className="theme-label">{isDark ? "Dark" : "Light"}</span>
            </button>
            <a href="https://govplottracker.com" target="_blank" rel="noopener noreferrer" className="site-link">
              View Site ↗
            </a>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

        :root, [data-theme="dark"] {
          --bg-page:#060f1a; --bg-sidebar:#040c15; --bg-topbar:rgba(6,15,26,0.96);
          --bg-card:rgba(255,255,255,0.035); --bg-card-hover:rgba(255,255,255,0.055);
          --bg-input:rgba(255,255,255,0.05); --bg-modal:#0c1822;
          --bg-user-pill:rgba(255,255,255,0.03); --bg-badge-gray:rgba(255,255,255,0.07);
          --border:rgba(255,255,255,0.07); --border-input:rgba(255,255,255,0.09);
          --border-sidebar:rgba(255,255,255,0.06); --border-foot:rgba(255,255,255,0.05);
          --text-primary:#e0e8f0; --text-heading:#ffffff; --text-muted:rgba(255,255,255,0.42);
          --text-dim:rgba(255,255,255,0.28); --text-label:rgba(255,255,255,0.38);
          --text-nav:rgba(255,255,255,0.42); --text-nav-hover:rgba(255,255,255,0.82);
          --text-td:rgba(255,255,255,0.75); --text-th:rgba(255,255,255,0.32);
          --text-user-em:rgba(255,255,255,0.65); --text-site-lnk:rgba(255,255,255,0.4);
          --text-qa-label:rgba(255,255,255,0.78); --text-qa-sub:rgba(255,255,255,0.3);
          --text-qa-arr:rgba(255,255,255,0.25); --text-spin:rgba(255,255,255,0.28);
          --text-pg-btn:rgba(255,255,255,0.5); --text-btn-s:rgba(255,255,255,0.65);
          --placeholder:rgba(255,255,255,0.22); --select-bg:#0a111a;
          --nav-active-bg:rgba(13,122,104,0.16); --nav-active-border:rgba(13,122,104,0.22);
          --nav-hover-bg:rgba(255,255,255,0.05);
          --btn-s-bg:rgba(255,255,255,0.06); --btn-s-border:rgba(255,255,255,0.11);
          --btn-s-hover:rgba(255,255,255,0.1); --btn-d-bg:rgba(220,38,38,0.12);
          --btn-d-border:rgba(220,38,38,0.25); --btn-d-color:#fca5a5; --btn-d-hover:rgba(220,38,38,0.22);
          --slider-bg:rgba(255,255,255,0.13); --pg-on-bg:rgba(13,122,104,0.25);
          --pg-hover-bg:rgba(255,255,255,0.07); --modal-overlay:rgba(0,0,0,0.72);
          --collapse-border:rgba(255,255,255,0.09); --collapse-color:rgba(255,255,255,0.35);
          --collapse-hover:rgba(255,255,255,0.07);
          --tr-hover:rgba(255,255,255,0.025); --td-border:rgba(255,255,255,0.04);
          --th-border:rgba(255,255,255,0.07);
          --logout-border:rgba(239,68,68,0.18); --logout-color:rgba(252,165,165,0.6);
          --logout-hover-bg:rgba(239,68,68,0.09); --logout-hover-color:#fca5a5;
          --theme-track-bg:rgba(255,255,255,0.1); --theme-thumb-bg:rgba(255,255,255,0.2);
          --theme-label-color:rgba(255,255,255,0.55); --theme-border:rgba(255,255,255,0.12);
          --stat-card-border-top:3px solid; --sec-title-color:rgba(255,255,255,0.5);
          --sec-link-color:#0f9e87; --sec-link-hover:#34d9bc;
          --w-title-color:#fff; --w-sub-color:rgba(255,255,255,0.4);
          --refresh-bg:rgba(13,122,104,0.15); --refresh-border:rgba(13,122,104,0.28);
          --refresh-color:#34d9bc; --refresh-hover:rgba(13,122,104,0.25);
          --qa-hover-bg:rgba(13,122,104,0.08); --qa-hover-border:rgba(13,122,104,0.22);
          --welcome-bg:linear-gradient(135deg,rgba(13,122,104,0.1),transparent);
          --welcome-border:rgba(13,122,104,0.18);
          --s-name-color:rgba(255,255,255,0.82); --s-id-color:rgba(255,255,255,0.28);
          --tile-val-color:#fff; --tile-lbl-color:rgba(255,255,255,0.3);
          --fc-name-color:#fff; --fc-desc-color:rgba(255,255,255,0.42);
          --fc-cs-bg:rgba(255,255,255,0.03); --fc-cs-border:rgba(255,255,255,0.06);
          --fc-cs-label:rgba(255,255,255,0.3); --cs-text-color:rgba(255,255,255,0.55);
          --ib-title-color:rgba(255,255,255,0.6); --ib-text-color:rgba(255,255,255,0.38);
          --code-color:rgba(255,255,255,0.6); --code-bg:rgba(255,255,255,0.07);
          --b-title-color:rgba(255,255,255,0.82); --b-slug-color:rgba(255,255,255,0.28);
          --editor-tab-bg:rgba(255,255,255,0.05); --editor-tab-border:rgba(255,255,255,0.09);
          --editor-tab-color:rgba(255,255,255,0.45); --tb-btn-bg:rgba(255,255,255,0.06);
          --tb-btn-border:rgba(255,255,255,0.1); --tb-btn-color:rgba(255,255,255,0.6);
          --preview-bg:rgba(255,255,255,0.03); --preview-border:rgba(255,255,255,0.07);
          --preview-color:rgba(255,255,255,0.75); --preview-h-color:#fff;
          --preview-tbl-border:rgba(255,255,255,0.1); --preview-th-bg:rgba(255,255,255,0.06);
        }

        [data-theme="light"] {
          --bg-page:#f0f4f8; --bg-sidebar:#ffffff; --bg-topbar:rgba(255,255,255,0.96);
          --bg-card:#ffffff; --bg-card-hover:#f7fafa;
          --bg-input:#ffffff; --bg-modal:#ffffff;
          --bg-user-pill:#f0f9f7; --bg-badge-gray:rgba(0,0,0,0.06);
          --border:#e2e8ed; --border-input:#d0dbe4;
          --border-sidebar:#e8edf2; --border-foot:#e8edf2;
          --text-primary:#1a2635; --text-heading:#0d1f2d; --text-muted:#5a7089;
          --text-dim:#8fa5b8; --text-label:#5a7089;
          --text-nav:#6b87a0; --text-nav-hover:#0d1f2d;
          --text-td:#2d4256; --text-th:#7a9ab0;
          --text-user-em:#2d4256; --text-site-lnk:#5a7089;
          --text-qa-label:#1a2635; --text-qa-sub:#7a9ab0;
          --text-qa-arr:#b0c4d4; --text-spin:#8fa5b8;
          --text-pg-btn:#5a7089; --text-btn-s:#2d4256;
          --placeholder:#a8bfcf; --select-bg:#ffffff;
          --nav-active-bg:rgba(13,122,104,0.08); --nav-active-border:rgba(13,122,104,0.3);
          --nav-hover-bg:rgba(13,122,104,0.04);
          --btn-s-bg:#f0f4f8; --btn-s-border:#d0dbe4; --btn-s-hover:#e2e8ed;
          --btn-d-bg:rgba(220,38,38,0.06); --btn-d-border:rgba(220,38,38,0.2);
          --btn-d-color:#c0392b; --btn-d-hover:rgba(220,38,38,0.12);
          --slider-bg:#d0dbe4; --pg-on-bg:rgba(13,122,104,0.12);
          --pg-hover-bg:#e2e8ed; --modal-overlay:rgba(15,30,50,0.5);
          --collapse-border:#d0dbe4; --collapse-color:#7a9ab0; --collapse-hover:#e8edf2;
          --tr-hover:#f7fafa; --td-border:#edf2f6; --th-border:#e2e8ed;
          --logout-border:rgba(220,38,38,0.2); --logout-color:#b85050;
          --logout-hover-bg:rgba(220,38,38,0.06); --logout-hover-color:#c0392b;
          --theme-track-bg:#e2e8ed; --theme-thumb-bg:#ffffff;
          --theme-label-color:#5a7089; --theme-border:#d0dbe4;
          --sec-title-color:#7a9ab0; --sec-link-color:#0d7a68; --sec-link-hover:#0a5f53;
          --w-title-color:#0d1f2d; --w-sub-color:#5a7089;
          --refresh-bg:rgba(13,122,104,0.08); --refresh-border:rgba(13,122,104,0.25);
          --refresh-color:#0d7a68; --refresh-hover:rgba(13,122,104,0.14);
          --qa-hover-bg:rgba(13,122,104,0.05); --qa-hover-border:rgba(13,122,104,0.2);
          --welcome-bg:linear-gradient(135deg,rgba(13,122,104,0.06),rgba(240,244,248,0));
          --welcome-border:rgba(13,122,104,0.2);
          --s-name-color:#1a2635; --s-id-color:#8fa5b8;
          --tile-val-color:#0d1f2d; --tile-lbl-color:#7a9ab0;
          --fc-name-color:#0d1f2d; --fc-desc-color:#5a7089;
          --fc-cs-bg:#f7fafa; --fc-cs-border:#e2e8ed;
          --fc-cs-label:#7a9ab0; --cs-text-color:#2d4256;
          --ib-title-color:#5a7089; --ib-text-color:#7a9ab0;
          --code-color:#2d4256; --code-bg:rgba(13,122,104,0.08);
          --b-title-color:#1a2635; --b-slug-color:#8fa5b8;
          --editor-tab-bg:#f0f4f8; --editor-tab-border:#d0dbe4;
          --editor-tab-color:#5a7089; --tb-btn-bg:#f0f4f8;
          --tb-btn-border:#d0dbe4; --tb-btn-color:#2d4256;
          --preview-bg:#f7fafa; --preview-border:#e2e8ed;
          --preview-color:#2d4256; --preview-h-color:#0d1f2d;
          --preview-tbl-border:#e2e8ed; --preview-th-bg:#f0f4f8;
        }

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg-page);color:var(--text-primary);-webkit-font-smoothing:antialiased;transition:background 0.25s ease,color 0.25s ease;}
        a{text-decoration:none;color:inherit}
        button{font-family:inherit;cursor:pointer}

        .root{display:flex;min-height:100vh}

        .sidebar{position:fixed;top:0;left:0;bottom:0;width:228px;background:var(--bg-sidebar);border-right:1px solid var(--border-sidebar);display:flex;flex-direction:column;transition:width 0.22s ease,background 0.25s ease;z-index:200;box-shadow:2px 0 12px rgba(0,0,0,0.04)}
        .root.collapsed .sidebar{width:64px}
        .sidebar-logo{display:flex;align-items:center;gap:10px;padding:16px 14px;border-bottom:1px solid var(--border-foot);min-height:62px;overflow:hidden}
        .logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#0d7a68,#12c2a4);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;box-shadow:0 4px 16px rgba(13,122,104,0.35)}
        .logo-text{flex:1;overflow:hidden;display:flex;flex-direction:column}
        .logo-name{font-family:'Outfit',system-ui,sans-serif;font-weight:800;font-size:15px;color:var(--text-heading);white-space:nowrap;letter-spacing:-0.2px}
        .logo-tag{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:#12c2a4}
        .collapse-btn{background:none;border:1px solid var(--collapse-border);color:var(--collapse-color);width:22px;height:22px;border-radius:6px;font-size:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:auto;transition:all 0.2s}
        .collapse-btn:hover{background:var(--collapse-hover);color:var(--text-heading)}

        .nav{flex:1;padding:10px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
        .nav-item{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:10px;font-size:13.5px;font-weight:500;color:var(--text-nav);transition:all 0.15s;white-space:nowrap;overflow:hidden;position:relative;border:1px solid transparent}
        .nav-item:hover{background:var(--nav-hover-bg);color:var(--text-nav-hover)}
        .nav-item.active{background:var(--nav-active-bg);color:#0d7a68;border-color:var(--nav-active-border);font-weight:600}
        .nav-ico{font-size:16px;flex-shrink:0}
        .nav-label{flex:1;overflow:hidden;text-overflow:ellipsis}
        .nav-dot{width:5px;height:5px;background:#12c2a4;border-radius:50%;flex-shrink:0}

        .sidebar-foot{padding:10px 8px;border-top:1px solid var(--border-foot);display:flex;flex-direction:column;gap:8px}
        .user-pill{display:flex;align-items:center;gap:9px;padding:9px 10px;background:var(--bg-user-pill);border-radius:10px;overflow:hidden;border:1px solid var(--border)}
        .avatar{width:30px;height:30px;background:linear-gradient(135deg,#0d7a68,#12c2a4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;flex-shrink:0}
        .avatar-solo{width:36px;height:36px;margin:0 auto;background:linear-gradient(135deg,#0d7a68,#12c2a4);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;cursor:default}
        .user-info{display:flex;flex-direction:column;flex:1;overflow:hidden}
        .user-em{font-size:11.5px;font-weight:600;color:var(--text-user-em);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .user-role{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0f9e87}
        .logout-btn{display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:10px;border:1px solid var(--logout-border);background:none;color:var(--logout-color);font-size:13px;font-weight:600;transition:all 0.2s;width:100%;justify-content:flex-start}
        .logout-btn.logout-sm{justify-content:center;padding:8px}
        .logout-btn:hover:not(:disabled){background:var(--logout-hover-bg);color:var(--logout-hover-color)}
        .logout-btn:disabled{opacity:0.4;cursor:not-allowed}

        .main{margin-left:228px;flex:1;min-height:100vh;display:flex;flex-direction:column;transition:margin-left 0.22s ease}
        .root.collapsed .main{margin-left:64px}

        .topbar{position:sticky;top:0;z-index:100;background:var(--bg-topbar);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 28px;height:62px;display:flex;align-items:center;justify-content:space-between;transition:background 0.25s ease}
        .page-title{font-family:'Outfit',system-ui,sans-serif;font-size:19px;font-weight:800;color:var(--text-heading);letter-spacing:-0.3px}
        .topbar-right{display:flex;align-items:center;gap:10px}

        .env-badge{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding:4px 9px;border-radius:6px;background:rgba(13,122,104,0.12);color:#0d7a68;border:1px solid rgba(13,122,104,0.25)}

        .theme-toggle{display:flex;align-items:center;gap:7px;padding:5px 10px 5px 6px;border-radius:20px;border:1px solid var(--theme-border);background:var(--theme-track-bg);transition:all 0.2s;cursor:pointer}
        .theme-toggle:hover{border-color:rgba(13,122,104,0.4);background:rgba(13,122,104,0.08)}
        .theme-track{width:36px;height:20px;background:rgba(0,0,0,0.1);border-radius:10px;position:relative;border:1px solid var(--theme-border);transition:background 0.25s;flex-shrink:0}
        [data-theme="light"] .theme-track{background:rgba(13,122,104,0.2)}
        .theme-thumb{position:absolute;top:1px;left:1px;width:16px;height:16px;border-radius:50%;background:var(--theme-thumb-bg);display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 1px 4px rgba(0,0,0,0.25);transition:transform 0.25s cubic-bezier(.4,0,.2,1)}
        [data-theme="light"] .theme-thumb{transform:translateX(16px)}
        .theme-label{font-size:11.5px;font-weight:700;color:var(--theme-label-color);letter-spacing:0.3px;user-select:none}

        .site-link{font-size:12.5px;font-weight:600;color:var(--text-site-lnk);border:1px solid var(--border);padding:6px 13px;border-radius:8px;transition:all 0.2s}
        .site-link:hover{color:#0d7a68;border-color:rgba(13,122,104,0.35)}

        .content{padding:26px 28px;flex:1}

        .a-card{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:22px;transition:background 0.25s}
        .a-table{width:100%;border-collapse:collapse;font-size:13.5px}
        .a-table th{text-align:left;padding:9px 14px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-th);border-bottom:1px solid var(--th-border);white-space:nowrap}
        .a-table td{padding:11px 14px;border-bottom:1px solid var(--td-border);color:var(--text-td);vertical-align:middle}
        .a-table tr:last-child td{border-bottom:none}
        .a-table tbody tr:hover td{background:var(--tr-hover)}
        .a-input{width:100%;background:var(--bg-input);border:1.5px solid var(--border-input);border-radius:9px;padding:10px 13px;font-size:13.5px;font-family:inherit;color:var(--text-primary);outline:none;transition:border-color 0.2s,background 0.2s}
        .a-input::placeholder{color:var(--placeholder)}
        .a-input:focus{border-color:rgba(13,122,104,0.55)}
        .a-select{background:var(--bg-input);border:1.5px solid var(--border-input);border-radius:9px;padding:10px 13px;font-size:13.5px;font-family:inherit;color:var(--text-primary);outline:none;width:100%;cursor:pointer}
        .a-select option{background:var(--select-bg);color:var(--text-primary)}
        .a-textarea{width:100%;background:var(--bg-input);border:1.5px solid var(--border-input);border-radius:9px;padding:10px 13px;font-size:13.5px;font-family:inherit;color:var(--text-primary);outline:none;resize:vertical;min-height:80px}
        .a-textarea:focus{border-color:rgba(13,122,104,0.55)}
        .f-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-label);margin-bottom:5px}
        .f-group{display:flex;flex-direction:column;gap:5px}

        .btn-p{background:linear-gradient(135deg,#0d7a68,#0f9e87);border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:700;font-family:'Outfit',system-ui,sans-serif;color:#fff;transition:all 0.2s;box-shadow:0 3px 14px rgba(13,122,104,0.25);display:inline-flex;align-items:center;gap:6px}
        .btn-p:hover:not(:disabled){opacity:0.9;transform:translateY(-1px)}
        .btn-p:disabled{opacity:0.45;cursor:not-allowed;transform:none}
        .btn-s{background:var(--btn-s-bg);border:1px solid var(--btn-s-border);border-radius:9px;padding:9px 18px;font-size:13px;font-weight:600;font-family:inherit;color:var(--text-btn-s);transition:all 0.2s;display:inline-flex;align-items:center;gap:6px}
        .btn-s:hover{background:var(--btn-s-hover);color:var(--text-heading)}
        .btn-d{background:var(--btn-d-bg);border:1px solid var(--btn-d-border);border-radius:9px;padding:9px 18px;font-size:13px;font-weight:600;font-family:inherit;color:var(--btn-d-color);transition:all 0.2s;display:inline-flex;align-items:center;gap:6px}
        .btn-d:hover{background:var(--btn-d-hover)}
        .sm{padding:5px 11px!important;font-size:11.5px!important}

        .badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
        .bg-green{background:rgba(34,197,94,0.12);color:#16a34a}
        .bg-red{background:rgba(239,68,68,0.12);color:#dc2626}
        .bg-yellow{background:rgba(234,179,8,0.12);color:#b45309}
        .bg-blue{background:rgba(59,130,246,0.12);color:#2563eb}
        .bg-teal{background:rgba(13,122,104,0.12);color:#0d7a68}
        .bg-gray{background:var(--bg-badge-gray);color:var(--text-muted)}

        .toggle{position:relative;display:inline-block;width:42px;height:23px;flex-shrink:0}
        .toggle input{opacity:0;width:0;height:0}
        .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--slider-bg);border-radius:23px;transition:0.28s}
        .slider:before{position:absolute;content:"";height:17px;width:17px;left:3px;bottom:3px;background:white;border-radius:50%;transition:0.28s}
        input:checked+.slider{background:#0d7a68}
        input:checked+.slider:before{transform:translateX(19px)}

        .modal-bg{position:fixed;inset:0;background:var(--modal-overlay);backdrop-filter:blur(10px);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{background:var(--bg-modal);border:1px solid var(--border);border-radius:16px;padding:26px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.12)}
        .modal-h{font-family:'Outfit',system-ui,sans-serif;font-size:18px;font-weight:800;color:var(--text-heading);margin-bottom:18px}
        .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}

        .page-btns{display:flex;align-items:center;gap:5px;margin-top:18px;justify-content:center}
        .pg-btn{width:32px;height:32px;border-radius:8px;border:1px solid var(--border-input);background:none;color:var(--text-pg-btn);font-size:13px;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .pg-btn:hover:not(:disabled){background:var(--pg-hover-bg);color:var(--text-heading)}
        .pg-btn.on{background:var(--pg-on-bg);color:#0d7a68;border-color:rgba(13,122,104,0.35)}
        .pg-btn:disabled{opacity:0.28;cursor:default}

        .spin-row{display:flex;align-items:center;justify-content:center;height:180px;gap:10px;color:var(--text-spin);font-size:14px}
        .spin-ico{animation:spin 0.8s linear infinite;display:inline-block}
        @keyframes spin{to{transform:rotate(360deg)}}
        .err-msg{color:#dc2626;font-size:13px;margin-top:10px}
        .ok-msg{color:#16a34a;font-size:13px;margin-top:10px}
      `}</style>
    </div>
  );
}
