/**
 * GovPlot Admin — SCM Authorities
 * Route: /admin_backend/scm/authorities
 * Lists all 20 scraper authorities with health status, enable/disable toggle, edit modal.
 */
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import AdminLayout from "../../../components/AdminLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const token = () => typeof window !== "undefined" ? localStorage.getItem("govplot_admin_token") || "" : "";

const H: Record<string, { color: string; label: string; icon: string }> = {
  healthy:   { color: "#22c55e", label: "Healthy",   icon: "🟢" },
  degraded:  { color: "#f59e0b", label: "Degraded",  icon: "🟡" },
  failing:   { color: "#ef4444", label: "Failing",   icon: "🔴" },
  disabled:  { color: "#6b7280", label: "Disabled",  icon: "⚫" },
  never_run: { color: "#8b5cf6", label: "Never Run", icon: "🔵" },
  unknown:   { color: "#6b7280", label: "Unknown",   icon: "⚪" },
};

const BLANK_EDIT = {
  authority_name: "", state: "", cities: "", scraper_class: "", scraper_file: "", priority_rank: 99, notes: "",
};

export default function SCMAuthorities() {
  const [rows, setRows]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterState, setFilter]  = useState("all");
  const [modal, setModal]         = useState<any>(null);   // null | {mode:"edit"|"toggle", row}
  const [form, setForm]           = useState<any>(BLANK_EDIT);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/v1/admin/scm/authorities/`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await r.json();
      setRows(Array.isArray(d) ? d : []);
    } catch { setRows([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.authority_code?.toLowerCase().includes(q) ||
      r.authority_name?.toLowerCase().includes(q) || r.state?.toLowerCase().includes(q);
    const matchS = filterState === "all" || r.state === filterState;
    return matchQ && matchS;
  });

  const states = Array.from(new Set(rows.map(r => r.state).filter(Boolean))).sort();

  async function toggle(row: any) {
    try {
      await fetch(`${API}/api/v1/admin/scm/authorities/${row.authority_code}/toggle`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token()}` },
      });
      load();
    } catch {}
  }

  async function saveEdit() {
    if (!modal) return;
    setSaving(true); setMsg("");
    try {
      const payload = {
        authority_name: form.authority_name,
        state:          form.state,
        cities:         form.cities.split(",").map((c: string) => c.trim()).filter(Boolean),
        scraper_class:  form.scraper_class,
        scraper_file:   form.scraper_file,
        priority_rank:  Number(form.priority_rank),
        notes:          form.notes || null,
      };
      const r = await fetch(`${API}/api/v1/admin/scm/authorities/${modal.row.authority_code}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) { const e = await r.json(); setMsg(e.detail || "Save failed"); }
      else { setMsg("✅ Saved"); setTimeout(() => { setModal(null); load(); }, 700); }
    } catch (e: any) { setMsg(e.message); }
    setSaving(false);
  }

  return (
    <>
      <Head><title>SCM — Authorities · GovPlot Admin</title></Head>
      <AdminLayout title="Scraper Config — Authorities">
        <style>{`
          .scm-hdr{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}
          .scm-hdr h2{margin:0;font-size:1.15rem;color:var(--text-heading)}
          .scm-controls{display:flex;gap:8px;flex-wrap:wrap}
          .scm-input{background:var(--bg-input);border:1px solid var(--border);color:var(--text-heading);
            border-radius:6px;padding:6px 11px;font-size:.85rem;outline:none;min-width:180px}
          .scm-input:focus{border-color:var(--accent)}
          .scm-select{background:var(--bg-input);border:1px solid var(--border);color:var(--text-heading);
            border-radius:6px;padding:6px 11px;font-size:.85rem;outline:none}
          .auth-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}
          .auth-card{background:var(--bg-card);border:1px solid var(--border);border-radius:10px;
            padding:16px;display:flex;flex-direction:column;gap:10px;transition:.15s border-color}
          .auth-card:hover{border-color:var(--accent)}
          .auth-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
          .auth-code{font-size:.8rem;font-weight:700;letter-spacing:.06em;
            background:rgba(99,102,241,.15);color:#818cf8;padding:3px 8px;border-radius:4px}
          .auth-name{font-size:.95rem;font-weight:600;color:var(--text-heading);margin:4px 0 2px}
          .auth-state{font-size:.78rem;color:var(--text-muted)}
          .auth-meta{display:flex;gap:8px;flex-wrap:wrap;font-size:.75rem;color:var(--text-dim)}
          .auth-meta span{background:var(--bg-input);padding:2px 7px;border-radius:4px}
          .auth-health{display:flex;align-items:center;gap:5px;font-size:.78rem;font-weight:600}
          .auth-actions{display:flex;gap:8px;margin-top:4px}
          .btn-sm{padding:5px 12px;border-radius:6px;font-size:.78rem;font-weight:600;cursor:pointer;
            border:1px solid transparent;transition:.15s}
          .btn-edit{background:rgba(99,102,241,.15);color:#818cf8;border-color:rgba(99,102,241,.3)}
          .btn-edit:hover{background:rgba(99,102,241,.3)}
          .btn-toggle-on{background:rgba(34,197,94,.12);color:#22c55e;border-color:rgba(34,197,94,.3)}
          .btn-toggle-on:hover{background:rgba(34,197,94,.25)}
          .btn-toggle-off{background:rgba(239,68,68,.1);color:#f87171;border-color:rgba(239,68,68,.3)}
          .btn-toggle-off:hover{background:rgba(239,68,68,.2)}
          .auth-disabled{opacity:.55}
          .url-pill{display:inline-block;background:rgba(34,197,94,.1);color:#4ade80;
            font-size:.7rem;padding:2px 6px;border-radius:4px;margin-right:4px}
          .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100;
            display:flex;align-items:center;justify-content:center;padding:20px}
          .modal-box{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;
            padding:24px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto}
          .modal-title{font-size:1rem;font-weight:700;color:var(--text-heading);margin:0 0 18px}
          .form-row{margin-bottom:14px}
          .form-label{display:block;font-size:.78rem;color:var(--text-muted);margin-bottom:5px;font-weight:600}
          .form-input{width:100%;box-sizing:border-box;background:var(--bg-input);
            border:1px solid var(--border);color:var(--text-heading);border-radius:7px;
            padding:8px 11px;font-size:.85rem;outline:none}
          .form-input:focus{border-color:var(--accent)}
          .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}
          .btn-save{background:var(--accent);color:#fff;padding:7px 18px;border:none;
            border-radius:7px;font-size:.85rem;font-weight:700;cursor:pointer}
          .btn-cancel{background:var(--bg-input);color:var(--text-muted);padding:7px 18px;
            border:1px solid var(--border);border-radius:7px;font-size:.85rem;cursor:pointer}
          .msg{font-size:.82rem;margin-top:10px;color:#4ade80}
          .msg.err{color:#f87171}
          .empty-state{text-align:center;padding:60px 20px;color:var(--text-muted);font-size:.9rem}
          .stats-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}
          .stat-chip{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;
            padding:10px 16px;font-size:.82rem;color:var(--text-muted)}
          .stat-chip strong{color:var(--text-heading);font-size:1.1rem;display:block}
        `}</style>

        {/* Header */}
        <div className="scm-hdr">
          <h2>🏛️ Authorities <span style={{color:"var(--text-muted)",fontWeight:400,fontSize:".85rem"}}>({filtered.length} of {rows.length})</span></h2>
          <div className="scm-controls">
            <input className="scm-input" placeholder="Search code / name / state…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="scm-select" value={filterState} onChange={e => setFilter(e.target.value)}>
              <option value="all">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          {[
            { label: "Total",    val: rows.length },
            { label: "Active",   val: rows.filter(r => r.is_active).length },
            { label: "Healthy",  val: rows.filter(r => r.last_run_status === "success").length },
            { label: "URLs",     val: rows.reduce((s, r) => s + (r.enabled_url_configs || 0), 0) },
          ].map(s => (
            <div className="stat-chip" key={s.label}>
              <strong>{s.val}</strong>{s.label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="empty-state">Loading authorities…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No authorities match your filter.</div>
        ) : (
          <div className="auth-grid">
            {filtered.map(row => {
              const hs = H[row.health_status || "unknown"];
              return (
                <div key={row.authority_code} className={`auth-card${!row.is_active ? " auth-disabled" : ""}`}>
                  <div className="auth-card-top">
                    <div>
                      <div className="auth-code">{row.authority_code}</div>
                      <div className="auth-name">{row.authority_name}</div>
                      <div className="auth-state">{row.state}</div>
                    </div>
                    <div className="auth-health" style={{ color: hs.color }}>
                      {hs.icon} {hs.label}
                    </div>
                  </div>

                  <div className="auth-meta">
                    <span>🏙️ {(row.cities || []).join(", ") || "—"}</span>
                    <span>⚡ P{row.priority_rank}</span>
                    <span>🔗 {row.enabled_url_configs || 0} URLs</span>
                    {row.last_run_at && (
                      <span>🕒 {new Date(row.last_run_at).toLocaleDateString("en-IN")}</span>
                    )}
                  </div>

                  <div className="auth-meta">
                    <span style={{fontFamily:"monospace",fontSize:".7rem"}}>{row.scraper_class}</span>
                  </div>

                  {row.notes && (
                    <div style={{fontSize:".75rem",color:"var(--text-dim)",fontStyle:"italic"}}>{row.notes}</div>
                  )}

                  <div className="auth-actions">
                    <button className="btn-sm btn-edit" onClick={() => {
                      setForm({
                        authority_name: row.authority_name,
                        state:          row.state,
                        cities:         (row.cities || []).join(", "),
                        scraper_class:  row.scraper_class,
                        scraper_file:   row.scraper_file,
                        priority_rank:  row.priority_rank,
                        notes:          row.notes || "",
                      });
                      setMsg("");
                      setModal({ mode: "edit", row });
                    }}>✏️ Edit</button>
                    <button className={`btn-sm ${row.is_active ? "btn-toggle-on" : "btn-toggle-off"}`}
                      onClick={() => toggle(row)}>
                      {row.is_active ? "✅ Enabled" : "⛔ Disabled"}
                    </button>
                    <button className="btn-sm btn-edit" onClick={() => {
                      window.location.href = `/admin_backend/scm/url-mapper?code=${row.authority_code}`;
                    }}>🔗 URLs</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Modal */}
        {modal?.mode === "edit" && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className="modal-box">
              <div className="modal-title">✏️ Edit — {modal.row.authority_code}</div>

              {[
                { key: "authority_name", label: "Authority Name" },
                { key: "state",          label: "State" },
                { key: "cities",         label: "Cities (comma-separated)" },
                { key: "scraper_class",  label: "Scraper Class" },
                { key: "scraper_file",   label: "Scraper File (module path)" },
              ].map(f => (
                <div className="form-row" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" value={form[f.key] || ""}
                    onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}

              <div className="form-row">
                <label className="form-label">Priority Rank (1 = highest)</label>
                <input className="form-input" type="number" min={1} max={999}
                  value={form.priority_rank}
                  onChange={e => setForm((p: any) => ({ ...p, priority_rank: e.target.value }))} />
              </div>
              <div className="form-row">
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.notes || ""}
                  onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))} />
              </div>

              {msg && <div className={`msg${msg.startsWith("✅") ? "" : " err"}`}>{msg}</div>}

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn-save" onClick={saveEdit} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
