/**
 * GovPlot Admin — SCM Static Data Manager
 * Route: /admin_backend/scm/static-data
 * View and update fallback static scheme snapshots per authority.
 */
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import AdminLayout from "../../../components/AdminLayout";

const API   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const token = () => typeof window !== "undefined" ? localStorage.getItem("govplot_admin_token") || "" : "";

export default function SCMStaticData() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<"all"|"with"|"without">("all");
  const [modal,   setModal]   = useState<any>(null);   // {code, current} | null
  const [detail,  setDetail]  = useState<any>(null);   // full snapshot with scheme_data
  const [history, setHistory] = useState<any[]>([]);
  const [histCode,setHistCode]= useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadText, setUploadText] = useState("");
  const [uploadSrc,  setUploadSrc]  = useState("manual_upload");
  const [uploadNotes,setUploadNotes]= useState("");
  const [msg, setMsg]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/v1/admin/scm/static-data/`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await r.json();
      setRows(d.items || []);
    } catch { setRows([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r => {
    if (filter === "with")    return r.has_static_data;
    if (filter === "without") return !r.has_static_data;
    return true;
  });

  async function loadDetail(code: string) {
    try {
      const r = await fetch(`${API}/api/v1/admin/scm/static-data/${code}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await r.json();
      setDetail(d);
    } catch {}
  }

  async function loadHistory(code: string) {
    setHistCode(code);
    try {
      const r = await fetch(`${API}/api/v1/admin/scm/static-data/${code}/history?limit=10`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await r.json();
      setHistory(d.items || []);
    } catch { setHistory([]); }
  }

  async function upload() {
    if (!modal) return;
    setUploading(true); setMsg("");
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(uploadText);
      if (!Array.isArray(parsed)) throw new Error("Must be a JSON array");
    } catch (e: any) {
      setMsg("❌ Invalid JSON — " + e.message);
      setUploading(false);
      return;
    }
    try {
      const r = await fetch(`${API}/api/v1/admin/scm/static-data/${modal.code}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          scheme_data:     parsed,
          snapshot_source: uploadSrc || "manual_upload",
          notes:           uploadNotes || null,
        }),
      });
      if (!r.ok) { const e = await r.json(); setMsg("❌ " + (e.detail || "Upload failed")); }
      else {
        setMsg(`✅ Saved ${parsed.length} schemes`);
        setTimeout(() => { setModal(null); load(); }, 900);
      }
    } catch (e: any) { setMsg("❌ " + e.message); }
    setUploading(false);
  }

  async function clearData(code: string) {
    if (!confirm(`Clear all static fallback data for ${code}? (Historical snapshots are preserved)`)) return;
    try {
      await fetch(`${API}/api/v1/admin/scm/static-data/${code}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token()}` },
      });
      load();
    } catch {}
  }

  function fmt(dt: string) {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <>
      <Head><title>SCM — Static Data · GovPlot Admin</title></Head>
      <AdminLayout title="Scraper Config — Static Data Manager">
        <style>{`
          .sd-hdr{display:flex;align-items:center;justify-content:space-between;
            flex-wrap:wrap;gap:10px;margin-bottom:16px}
          .sd-hdr h2{margin:0;font-size:1.1rem;color:var(--text-heading)}
          .sd-tabs{display:flex;gap:6px}
          .sd-tab{padding:6px 14px;border-radius:6px;font-size:.8rem;font-weight:600;cursor:pointer;
            border:1px solid var(--border);background:var(--bg-input);color:var(--text-muted);transition:.15s}
          .sd-tab.active{background:var(--accent);color:#fff;border-color:var(--accent)}
          .sd-table-wrap{overflow-x:auto}
          table{width:100%;border-collapse:collapse;font-size:.8rem}
          th{padding:8px 12px;text-align:left;color:var(--text-muted);font-size:.73rem;
            font-weight:700;text-transform:uppercase;letter-spacing:.04em;
            border-bottom:1px solid var(--border)}
          td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04);
            color:var(--text-heading);vertical-align:middle}
          tr:hover td{background:var(--bg-input)}
          .auth-code-cell{font-size:.75rem;font-weight:700;color:#818cf8;font-family:monospace}
          .has-badge{background:rgba(34,197,94,.12);color:#22c55e;padding:2px 8px;
            border-radius:4px;font-size:.72rem;font-weight:700}
          .no-badge{background:rgba(239,68,68,.08);color:#f87171;padding:2px 8px;
            border-radius:4px;font-size:.72rem;font-weight:700}
          .btn-xs{padding:4px 9px;border-radius:5px;font-size:.72rem;font-weight:600;
            cursor:pointer;border:1px solid transparent;margin-right:5px}
          .btn-xs-blue{background:rgba(99,102,241,.15);color:#818cf8;border-color:rgba(99,102,241,.3)}
          .btn-xs-green{background:rgba(34,197,94,.12);color:#22c55e;border-color:rgba(34,197,94,.3)}
          .btn-xs-red{background:rgba(239,68,68,.1);color:#f87171;border-color:rgba(239,68,68,.3)}
          .btn-xs-amber{background:rgba(245,158,11,.1);color:#fbbf24;border-color:rgba(245,158,11,.3)}
          .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100;
            display:flex;align-items:center;justify-content:center;padding:20px}
          .modal-box{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;
            padding:22px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto}
          .modal-title{font-size:1rem;font-weight:700;color:var(--text-heading);margin:0 0 14px}
          .form-row{margin-bottom:13px}
          .form-label{display:block;font-size:.77rem;color:var(--text-muted);margin-bottom:4px;font-weight:600}
          .form-input{width:100%;box-sizing:border-box;background:var(--bg-input);
            border:1px solid var(--border);color:var(--text-heading);border-radius:7px;
            padding:7px 10px;font-size:.83rem;outline:none}
          .form-input:focus{border-color:var(--accent)}
          .form-textarea{width:100%;box-sizing:border-box;background:var(--bg-input);
            border:1px solid var(--border);color:var(--text-heading);border-radius:7px;
            padding:8px 10px;font-size:.78rem;font-family:monospace;outline:none;
            resize:vertical;min-height:180px}
          .form-textarea:focus{border-color:var(--accent)}
          .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
          .btn-save{background:var(--accent);color:#fff;padding:7px 18px;border:none;
            border-radius:7px;font-size:.84rem;font-weight:700;cursor:pointer}
          .btn-cancel{background:var(--bg-input);color:var(--text-muted);padding:7px 18px;
            border:1px solid var(--border);border-radius:7px;font-size:.84rem;cursor:pointer}
          .msg{font-size:.8rem;margin-top:8px}
          .scheme-preview{background:var(--bg-input);border-radius:6px;padding:10px;
            font-size:.75rem;font-family:monospace;max-height:200px;overflow-y:auto;
            color:var(--text-muted);margin-top:10px}
          .hint-box{background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);
            border-radius:6px;padding:10px;font-size:.78rem;color:var(--text-muted);margin-bottom:14px}
          .hist-row{display:flex;align-items:center;gap:10px;padding:7px 0;
            border-bottom:1px solid var(--border);font-size:.8rem}
          .hist-current{background:rgba(34,197,94,.12);color:#22c55e;padding:1px 6px;
            border-radius:4px;font-size:.7rem;font-weight:700}
          .empty-state{text-align:center;padding:50px;color:var(--text-muted);font-size:.88rem}
          .stat-bar{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
          .stat-chip{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;
            padding:8px 14px;font-size:.8rem;color:var(--text-muted)}
          .stat-chip strong{color:var(--text-heading);font-size:1rem;display:block}
        `}</style>

        {/* Header */}
        <div className="sd-hdr">
          <h2>💾 Static Fallback Data Manager</h2>
          <div className="sd-tabs">
            {["all","with","without"].map(v => (
              <button key={v} className={`sd-tab${filter === v ? " active" : ""}`}
                onClick={() => setFilter(v as any)}>
                {v === "all" ? "All" : v === "with" ? "✅ Has Data" : "❌ No Data"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="stat-bar">
          {[
            { val: rows.length,                              lbl: "Total Authorities" },
            { val: rows.filter(r => r.has_static_data).length,  lbl: "Have Fallback Data" },
            { val: rows.filter(r => !r.has_static_data).length, lbl: "No Fallback Data" },
            { val: rows.reduce((s, r) => s + (r.scheme_count || 0), 0), lbl: "Total Static Schemes" },
          ].map(s => (
            <div className="stat-chip" key={s.lbl}>
              <strong>{s.val}</strong>{s.lbl}
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="sd-table-wrap">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No authorities match the filter.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Authority</th>
                  <th>State</th>
                  <th>Status</th>
                  <th>Schemes</th>
                  <th>Source</th>
                  <th>Snapshot</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.authority_code}>
                    <td className="auth-code-cell">{row.authority_code}</td>
                    <td style={{color:"var(--text-muted)",fontSize:".78rem"}}>{row.state}</td>
                    <td>
                      {row.has_static_data
                        ? <span className="has-badge">✅ Has Data</span>
                        : <span className="no-badge">❌ Empty</span>}
                    </td>
                    <td style={{color:"var(--text-muted)"}}>
                      {row.has_static_data ? row.scheme_count || 0 : "—"}
                    </td>
                    <td style={{color:"var(--text-muted)",fontSize:".75rem",maxWidth:150,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {row.snapshot_source || "—"}
                    </td>
                    <td style={{color:"var(--text-muted)",fontSize:".75rem",whiteSpace:"nowrap"}}>
                      {row.snapshot_at ? fmt(row.snapshot_at) : "—"}
                    </td>
                    <td>
                      <button className="btn-xs btn-xs-green" onClick={() => {
                        setModal({ code: row.authority_code, current: row });
                        setUploadText(""); setUploadSrc("manual_upload");
                        setUploadNotes(""); setMsg("");
                      }}>⬆ Upload</button>
                      {row.has_static_data && (
                        <>
                          <button className="btn-xs btn-xs-blue" onClick={async () => {
                            await loadDetail(row.authority_code);
                            await loadHistory(row.authority_code);
                            setModal({ code: row.authority_code, view: true });
                          }}>👁 View</button>
                          <button className="btn-xs btn-xs-red"
                            onClick={() => clearData(row.authority_code)}>🗑 Clear</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Upload Modal */}
        {modal && !modal.view && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className="modal-box">
              <div className="modal-title">⬆ Upload Static Data — {modal.code}</div>

              <div className="hint-box">
                Paste a JSON array of scheme objects. Each must have at least <code>name</code> and <code>authority</code> fields.
                This replaces the current snapshot; old data is archived for history.
              </div>

              <div className="form-row">
                <label className="form-label">Snapshot Source Label</label>
                <input className="form-input" value={uploadSrc}
                  onChange={e => setUploadSrc(e.target.value)}
                  placeholder="e.g. manual_upload or last_good_scrape_2026-04-17" />
              </div>
              <div className="form-row">
                <label className="form-label">Notes (optional)</label>
                <input className="form-input" value={uploadNotes}
                  onChange={e => setUploadNotes(e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Scheme Data (JSON array) *</label>
                <textarea className="form-textarea" value={uploadText}
                  onChange={e => setUploadText(e.target.value)}
                  placeholder={`[\n  {\n    "name": "YEIDA RPS-10 Residential Plot Scheme 2026",\n    "authority": "YEIDA",\n    "city": "Greater Noida",\n    "status": "UPCOMING"\n  }\n]`} />
              </div>

              {msg && (
                <div className="msg" style={{ color: msg.startsWith("✅") ? "#4ade80" : "#f87171" }}>
                  {msg}
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn-save" onClick={upload}
                  disabled={uploading || !uploadText.trim()}>
                  {uploading ? "Uploading…" : "Upload & Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View/History Modal */}
        {modal?.view && detail && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className="modal-box">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div className="modal-title" style={{margin:0}}>
                  👁 {modal.code} — Current Snapshot
                </div>
                <button style={{background:"none",border:"none",color:"var(--text-muted)",
                  cursor:"pointer",fontSize:"1.1rem"}} onClick={() => setModal(null)}>✕</button>
              </div>

              {detail.has_static_data ? (
                <>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:12,fontSize:".8rem",color:"var(--text-muted)"}}>
                    <span>📦 <strong style={{color:"var(--text-heading)"}}>{detail.scheme_count}</strong> schemes</span>
                    <span>🏷 {detail.snapshot_source || "—"}</span>
                    <span>📅 {fmt(detail.snapshot_at)}</span>
                  </div>

                  <div className="scheme-preview">
                    {JSON.stringify(detail.scheme_data?.slice(0, 3) || [], null, 2)}
                    {(detail.scheme_data?.length || 0) > 3 && (
                      <div style={{color:"#818cf8",marginTop:6}}>
                        … {(detail.scheme_data?.length || 0) - 3} more schemes
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{color:"var(--text-muted)",fontSize:".85rem"}}>No snapshot data.</div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div style={{marginTop:16}}>
                  <div style={{fontWeight:700,fontSize:".82rem",color:"var(--text-heading)",marginBottom:8}}>
                    📜 Snapshot History
                  </div>
                  {history.map((h: any) => (
                    <div className="hist-row" key={h.id}>
                      <div style={{flex:1,fontSize:".78rem",color:"var(--text-muted)"}}>
                        {fmt(h.snapshot_at)} — {h.scheme_count} schemes — {h.snapshot_source || "—"}
                      </div>
                      {h.is_current && <span className="hist-current">CURRENT</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setModal(null)}>Close</button>
                <button className="btn-save" onClick={() => {
                  setModal({ code: modal.code }); setUploadText(""); setMsg("");
                }}>⬆ Upload New</button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
