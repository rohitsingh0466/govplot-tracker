/**
 * GovPlot Admin — SCM Run Logs
 * Route: /admin_backend/scm/run-logs
 * Per-authority run history, LIVE vs STATIC, error details, latest summary.
 */
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import AdminLayout from "../../components/AdminLayout";

const API   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const token = () => typeof window !== "undefined" ? localStorage.getItem("govplot_admin_token") || "" : "";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  success:  { bg: "rgba(34,197,94,.12)",   color: "#22c55e" },
  fallback: { bg: "rgba(245,158,11,.1)",   color: "#fbbf24" },
  failed:   { bg: "rgba(239,68,68,.1)",    color: "#f87171" },
  skipped:  { bg: "rgba(107,114,128,.12)", color: "#9ca3af" },
};

export default function SCMRunLogs() {
  const [summary, setSummary]     = useState<any>(null);
  const [health,  setHealth]      = useState<any>(null);
  const [logs,    setLogs]        = useState<any[]>([]);
  const [total,   setTotal]       = useState(0);
  const [page,    setPage]        = useState(1);
  const [pages,   setPages]       = useState(1);
  const [filter,  setFilter]      = useState({ authority: "", status: "", mode: "" });
  const [loading, setLoading]     = useState(true);
  const [selLog,  setSelLog]      = useState<any>(null);
  const PAGE = 30;

  const loadSummary = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/v1/admin/scm/run-logs/summaries/latest`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setSummary(await r.json());
    } catch {}
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/v1/admin/scm/run-logs/health`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await r.json();
      setHealth(d);
    } catch {}
  }, []);

  const loadLogs = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      limit:  String(PAGE),
      offset: String((p - 1) * PAGE),
    });
    if (filter.authority) params.set("authority_code", filter.authority);
    if (filter.status)    params.set("status",         filter.status);
    if (filter.mode)      params.set("run_mode",        filter.mode);
    try {
      const r = await fetch(`${API}/api/v1/admin/scm/run-logs/?${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await r.json();
      setLogs(d.items || []);
      setTotal(d.total || 0);
      setPages(d.pages || 1);
    } catch { setLogs([]); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadSummary(); loadHealth(); }, [loadSummary, loadHealth]);
  useEffect(() => { setPage(1); loadLogs(1); }, [filter, loadLogs]);

  function fmt(dt: string) {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  }
  function dur(ms?: number) {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  const HEALTH_COLORS: Record<string, string> = {
    healthy: "#22c55e", degraded: "#f59e0b", failing: "#ef4444",
    disabled: "#6b7280", never_run: "#8b5cf6", unknown: "#6b7280",
  };

  return (
    <>
      <Head><title>SCM — Run Logs · GovPlot Admin</title></Head>
      <AdminLayout title="Scraper Config — Run Logs">
        <style>{`
          .rl-summary{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));
            gap:10px;margin-bottom:20px}
          .rl-stat{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;
            padding:12px 14px}
          .rl-stat-val{font-size:1.4rem;font-weight:800;color:var(--text-heading)}
          .rl-stat-lbl{font-size:.73rem;color:var(--text-muted);margin-top:2px}
          .rl-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
          .rl-input{background:var(--bg-input);border:1px solid var(--border);color:var(--text-heading);
            border-radius:6px;padding:6px 10px;font-size:.82rem;outline:none}
          .rl-input:focus{border-color:var(--accent)}
          .rl-table-wrap{overflow-x:auto}
          table{width:100%;border-collapse:collapse;font-size:.8rem}
          th{padding:8px 10px;text-align:left;color:var(--text-muted);font-size:.73rem;
            font-weight:700;text-transform:uppercase;letter-spacing:.04em;
            border-bottom:1px solid var(--border);white-space:nowrap}
          td{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.04);
            color:var(--text-heading);vertical-align:top}
          tr:hover td{background:var(--bg-input)}
          .status-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:700}
          .auth-code-cell{font-size:.75rem;font-weight:700;color:#818cf8;font-family:monospace}
          .url-cell{font-family:monospace;font-size:.72rem;color:var(--text-muted);
            max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .pager{display:flex;align-items:center;gap:10px;margin-top:14px;font-size:.82rem;
            color:var(--text-muted)}
          .pager button{background:var(--bg-input);border:1px solid var(--border);color:var(--text-heading);
            border-radius:6px;padding:5px 12px;cursor:pointer;font-size:.8rem}
          .pager button:disabled{opacity:.4;cursor:not-allowed}
          .health-section{margin-bottom:24px}
          .health-title{font-size:.88rem;font-weight:700;color:var(--text-heading);margin-bottom:10px}
          .health-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
          .health-card{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;
            padding:10px 12px;display:flex;align-items:center;gap:10px}
          .health-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
          .health-card-code{font-size:.78rem;font-weight:700;color:var(--text-heading)}
          .health-card-meta{font-size:.7rem;color:var(--text-muted)}
          .detail-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100;
            display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}
          .detail-box{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;
            padding:22px;width:100%;max-width:560px}
          .detail-row{display:flex;gap:8px;margin-bottom:8px;font-size:.82rem}
          .detail-key{color:var(--text-muted);min-width:140px;flex-shrink:0;font-weight:600}
          .detail-val{color:var(--text-heading);word-break:break-all}
          .error-box{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);
            border-radius:6px;padding:10px;font-size:.78rem;color:#f87171;font-family:monospace;
            word-break:break-all;margin-top:8px}
          .empty-state{text-align:center;padding:40px;color:var(--text-muted);font-size:.88rem}
          .live-pill{background:rgba(34,197,94,.12);color:#4ade80;padding:2px 6px;border-radius:4px;
            font-size:.72rem;margin-right:4px}
          .static-pill{background:rgba(245,158,11,.1);color:#fbbf24;padding:2px 6px;border-radius:4px;
            font-size:.72rem}
        `}</style>

        {/* Latest run summary */}
        {summary && !summary.message && (
          <div className="rl-summary">
            {[
              { val: summary.total_scrapers,    lbl: "Scrapers" },
              { val: summary.scrapers_success,  lbl: "Success",  color: "#22c55e" },
              { val: summary.scrapers_fallback, lbl: "Fallback", color: "#f59e0b" },
              { val: summary.scrapers_failed,   lbl: "Failed",   color: "#f87171" },
              { val: summary.total_schemes,     lbl: "Schemes" },
              { val: summary.live_schemes,      lbl: "LIVE",     color: "#22c55e" },
              { val: summary.static_schemes,    lbl: "STATIC",   color: "#f59e0b" },
              { val: `${summary.duration_seconds}s`, lbl: "Duration" },
            ].map(s => (
              <div className="rl-stat" key={s.lbl}>
                <div className="rl-stat-val" style={s.color ? { color: s.color } : {}}>{s.val ?? "—"}</div>
                <div className="rl-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        )}
        {summary?.message && (
          <div style={{color:"var(--text-muted)",fontSize:".85rem",marginBottom:16}}>
            No scraper runs recorded yet.
          </div>
        )}

        {/* Health overview */}
        {health?.authorities && (
          <div className="health-section">
            <div className="health-title">Authority Health</div>
            <div className="health-grid">
              {health.authorities.map((a: any) => (
                <div className="health-card" key={a.authority_code}>
                  <div className="health-dot" style={{ background: HEALTH_COLORS[a.health_status] || "#6b7280" }} />
                  <div>
                    <div className="health-card-code">{a.authority_code}</div>
                    <div className="health-card-meta">
                      {a.last_run_at ? fmt(a.last_run_at) : "Never run"}
                      {a.schemes_live > 0 && <span className="live-pill">{a.schemes_live} live</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="rl-filters">
          <input className="rl-input" placeholder="Authority code…"
            value={filter.authority}
            onChange={e => setFilter(p => ({ ...p, authority: e.target.value.toUpperCase() }))} />
          <select className="rl-input" value={filter.status}
            onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="fallback">Fallback</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
          <select className="rl-input" value={filter.mode}
            onChange={e => setFilter(p => ({ ...p, mode: e.target.value }))}>
            <option value="">All modes</option>
            <option value="full">full</option>
            <option value="refresh">refresh</option>
            <option value="manual">manual</option>
          </select>
          <span style={{fontSize:".8rem",color:"var(--text-muted)",alignSelf:"center"}}>
            {total} records
          </span>
        </div>

        {/* Logs table */}
        <div className="rl-table-wrap">
          {loading ? (
            <div className="empty-state">Loading logs…</div>
          ) : logs.length === 0 ? (
            <div className="empty-state">No run logs match your filter.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Authority</th>
                  <th>Status</th>
                  <th>Schemes</th>
                  <th>Mode</th>
                  <th>Duration</th>
                  <th>URL Used</th>
                  <th>Run At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => {
                  const st = STATUS_STYLE[l.status] || STATUS_STYLE.failed;
                  return (
                    <tr key={l.id}>
                      <td className="auth-code-cell">{l.authority_code}</td>
                      <td>
                        <span className="status-badge" style={{ background: st.bg, color: st.color }}>
                          {l.status}
                        </span>
                      </td>
                      <td>
                        {l.schemes_found > 0 ? (
                          <>
                            <span className="live-pill">{l.schemes_live}L</span>
                            <span className="static-pill">{l.schemes_static}S</span>
                          </>
                        ) : "0"}
                      </td>
                      <td style={{color:"var(--text-muted)"}}>{l.run_mode}</td>
                      <td style={{color:"var(--text-muted)"}}>{dur(l.duration_ms)}</td>
                      <td className="url-cell" title={l.url_attempted || ""}>{l.url_attempted || "—"}</td>
                      <td style={{color:"var(--text-muted)",whiteSpace:"nowrap"}}>{fmt(l.run_at)}</td>
                      <td>
                        <button style={{background:"none",border:"none",color:"var(--text-muted)",
                          cursor:"pointer",fontSize:".78rem"}} onClick={() => setSelLog(l)}>
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="pager">
            <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); loadLogs(p); }}>← Prev</button>
            <span>Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); loadLogs(p); }}>Next →</button>
          </div>
        )}

        {/* Log Detail Modal */}
        {selLog && (
          <div className="detail-modal-bg" onClick={e => { if (e.target === e.currentTarget) setSelLog(null); }}>
            <div className="detail-box">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:700,color:"var(--text-heading)"}}>
                  Run Log #{selLog.id} — {selLog.authority_code}
                </div>
                <button style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:"1.1rem"}}
                  onClick={() => setSelLog(null)}>✕</button>
              </div>
              {[
                ["Authority",    selLog.authority_code],
                ["City",         selLog.city],
                ["Status",       selLog.status],
                ["Run Mode",     selLog.run_mode],
                ["Schemes Found",selLog.schemes_found],
                ["LIVE",         selLog.schemes_live],
                ["STATIC",       selLog.schemes_static],
                ["Duration",     dur(selLog.duration_ms)],
                ["Tier Tried",   selLog.tier_attempted ?? "—"],
                ["Used Proxy",   selLog.used_proxy ? "Yes" : "No"],
                ["Used Playwright", selLog.used_playwright ? "Yes" : "No"],
                ["URL Attempted",selLog.url_attempted || "—"],
                ["URL Type",     selLog.url_type || "—"],
                ["Run At",       fmt(selLog.run_at)],
                ["Version",      selLog.scraper_version || "—"],
              ].map(([k, v]) => (
                <div className="detail-row" key={k as string}>
                  <span className="detail-key">{k}</span>
                  <span className="detail-val">{String(v ?? "—")}</span>
                </div>
              ))}

              {selLog.error_type && (
                <div className="error-box">
                  <strong>{selLog.error_type}</strong><br />
                  {selLog.error_detail}
                </div>
              )}

              {selLog.github_run_url && (
                <div style={{marginTop:12}}>
                  <a href={selLog.github_run_url} target="_blank" rel="noopener noreferrer"
                    style={{color:"var(--accent)",fontSize:".82rem"}}>
                    🔗 View GitHub Actions Run
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
