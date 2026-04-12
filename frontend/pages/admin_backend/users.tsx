import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TIER_COLORS: Record<string,string> = {
  free: "bg-gray", pro: "bg-blue", premium: "bg-yellow",
};

export default function AdminUsers() {
  const router = useRouter();
  const [rows, setRows]     = useState<any[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tier, setTier]     = useState("");

  const token = () => localStorage.getItem("govplot_admin_token");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({
      page:String(page), limit:"25",
      ...(search && { search }),
      ...(tier   && { tier   }),
    });
    const res = await fetch(`${API}/api/v1/admin/data/users?${p}`,
      { headers: { Authorization: `Bearer ${token()}` } });
    if (res.status === 401) { router.replace("/admin_backend/login"); return; }
    const d = await res.json();
    setRows(d.items||[]); setTotal(d.total||0); setPages(d.pages||1);
    setLoading(false);
  }, [page, search, tier]);

  useEffect(() => { load(); }, [load]);

  function fmt(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN",{ day:"numeric", month:"short", year:"numeric" });
  }

  function initials(r: any) {
    const n = r.name || r.email || "?";
    return n.slice(0,2).toUpperCase();
  }

  const TIER_COLORS_MAP: Record<string,string> = {
    free: "#64748b", pro: "#2563eb", premium: "#d97706",
  };

  return (
    <>
      <Head><title>Users — GovPlot Admin</title></Head>
      <AdminLayout title="Users">

        <style>{`
          .ctrl-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:14px; }
          .total-ct { margin-left:auto; font-size:12px; color:var(--text-muted); font-weight:600; }
          .tier-tiles { display:grid; grid-template-columns:repeat(4,1fr); gap:11px; margin-bottom:14px; }
          .t-tile {
            background:var(--bg-card); border:1px solid var(--border);
            border-radius:12px; padding:14px 16px;
            display:flex; flex-direction:column; gap:3px;
            transition: background 0.25s, border-color 0.25s;
          }
          .t-val { font-family:'Outfit',system-ui,sans-serif; font-size:24px; font-weight:900; color:var(--tile-val-color); }
          .t-lbl { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--tile-lbl-color); }
          .u-row { display:flex; align-items:center; gap:10px; }
          .u-av {
            width:30px; height:30px; flex-shrink:0;
            background:linear-gradient(135deg,#0d7a68,#12c2a4);
            border-radius:8px; display:flex; align-items:center; justify-content:center;
            font-weight:800; font-size:11px; color:#fff;
          }
          .u-name  { font-size:13px; font-weight:600; color:var(--s-name-color); }
          .u-email { font-size:11.5px; color:var(--text-muted); }
          .u-phone { font-size:12px; color:var(--text-muted); }
          .u-date  { font-size:12px; color:var(--text-dim); white-space:nowrap; }
          .u-telegram { font-size:12px; color:var(--text-muted); }
        `}</style>

        {/* Controls */}
        <div className="ctrl-row">
          <input className="a-input" style={{maxWidth:280}} placeholder="🔍 Search email or name…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="a-select" style={{maxWidth:150}}
            value={tier} onChange={e => { setTier(e.target.value); setPage(1); }}>
            <option value="">All Tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
          <span className="total-ct">{total.toLocaleString()} users</span>
        </div>

        {/* Summary tiles */}
        <div className="tier-tiles">
          {[
            {label:"Total",    val:total,       color:"#0f9e87"},
            {label:"Free",     val:rows.filter(r=>r.subscription_tier==="free"||!r.subscription_tier).length, color:"#64748b"},
            {label:"Pro ⭐",   val:rows.filter(r=>r.subscription_tier==="pro").length, color:"#0ea5e9"},
            {label:"Premium 💎",val:rows.filter(r=>r.subscription_tier==="premium").length, color:"#f59e0b"},
          ].map(t => (
            <div key={t.label} className="t-tile" style={{borderTop:`3px solid ${t.color}`}}>
              <span className="t-val">{t.val}</span>
              <span className="t-lbl">{t.label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="a-card" style={{padding:0,overflow:"hidden"}}>
          {loading ? <div className="spin-row"><span className="spin-ico">⟳</span> Loading…</div> : (
            <div style={{overflowX:"auto"}}>
              <table className="a-table">
                <thead>
                  <tr>
                    <th>User</th><th>Plan</th><th>Status</th>
                    <th>Telegram</th><th>Phone</th>
                    <th>Joined</th><th>Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="u-row">
                          <div className="u-av">{initials(r)}</div>
                          <div>
                            <div className="u-name">{r.name || r.first_name || "—"}</div>
                            <div className="u-email">{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${TIER_COLORS[r.subscription_tier]||"bg-gray"}`}>
                          {r.subscription_tier || "free"}
                        </span>
                      </td>
                      <td>
                        {r.is_active
                          ? <span className="badge bg-green" style={{fontSize:10}}>Active</span>
                          : <span className="badge bg-red"   style={{fontSize:10}}>Inactive</span>}
                      </td>
                      <td className="u-telegram">
                        {r.telegram_username ? `@${r.telegram_username}` : "—"}
                      </td>
                      <td className="u-phone">
                        {r.phone ? r.phone.replace(/(\d{5})(\d{5})/,"$1-$2") : "—"}
                      </td>
                      <td className="u-date">{fmt(r.created_at)}</td>
                      <td className="u-date">{fmt(r.last_login_at)}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr><td colSpan={7} style={{textAlign:"center",color:"var(--text-dim)",padding:40}}>
                      No users match your search
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="page-btns">
            <button className="pg-btn" onClick={()=>setPage(1)} disabled={page===1}>«</button>
            <button className="pg-btn" onClick={()=>setPage(p=>p-1)} disabled={page===1}>‹</button>
            {Array.from({length:Math.min(pages,7)},(_,i)=>{
              const p = page<=4?i+1:page-3+i;
              if(p<1||p>pages)return null;
              return <button key={p} className={`pg-btn ${p===page?"on":""}`} onClick={()=>setPage(p)}>{p}</button>;
            })}
            <button className="pg-btn" onClick={()=>setPage(p=>p+1)} disabled={page===pages}>›</button>
            <button className="pg-btn" onClick={()=>setPage(pages)} disabled={page===pages}>»</button>
          </div>
        )}

      </AdminLayout>
    </>
  );
}
