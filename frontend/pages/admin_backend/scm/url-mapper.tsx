/**
 * GovPlot Admin — SCM URL Mapper
 * Route: /admin_backend/scm/url-mapper
 * Manage URLs per authority: add/edit/delete/toggle/reorder, sub-pages, health status.
 */
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import AdminLayout from "../../../components/AdminLayout";

const API   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const token = () => typeof window !== "undefined" ? localStorage.getItem("govplot_admin_token") || "" : "";

const URL_TYPES = ["primary","scheme_list","notice_board","pdf_portal","alternative","aggregator"];
const TYPE_COLORS: Record<string, string> = {
  primary:      "#6366f1", scheme_list: "#0ea5e9", notice_board: "#8b5cf6",
  pdf_portal:   "#ec4899", alternative: "#f59e0b", aggregator:   "#14b8a6",
};
const TYPE_ICONS: Record<string, string> = {
  primary: "🏛️", scheme_list: "📋", notice_board: "📌",
  pdf_portal: "📄", alternative: "🔄", aggregator: "🔍",
};

const BLANK_URL = {
  authority_code: "", url_type: "primary", url: "", label: "",
  priority: 1, requires_proxy: false, requires_playwright: false, notes: "",
};

export default function SCMUrlMapper() {
  const router = useRouter();
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [selectedCode, setSelected]   = useState<string>("");
  const [urlConfigs, setUrlConfigs]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [modal, setModal]             = useState<string|null>(null);   // "add"|"edit"|"subpages"
  const [editTarget, setEditTarget]   = useState<any>(null);
  const [form, setForm]               = useState<any>(BLANK_URL);
  const [subPages, setSubPages]       = useState<any[]>([]);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState("");
  const [delId, setDelId]             = useState<string|null>(null);

  // Load authority list once
  useEffect(() => {
    fetch(`${API}/api/v1/admin/scm/authorities/`, {
      headers: { Authorization: `Bearer ${token()}` },
    }).then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d.sort((a: any, b: any) => a.priority_rank - b.priority_rank) : [];
      setAuthorities(list);
      // Auto-select from query param
      const code = router.isReady ? (router.query.code as string) : "";
      if (code && list.find((a: any) => a.authority_code === code)) {
        setSelected(code);
      } else if (list.length) {
        setSelected(list[0].authority_code);
      }
    }).catch(() => {});
  }, [router.isReady]);

  const loadUrls = useCallback(async (code: string) => {
    if (!code) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/v1/admin/scm/urls/by-authority/${code}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await r.json();
      setUrlConfigs(d.url_configs || []);
    } catch { setUrlConfigs([]); }
    setLoading(false);
  }, []);

  useEffect(() => { if (selectedCode) loadUrls(selectedCode); }, [selectedCode, loadUrls]);

  // Group by url_type
  const grouped = URL_TYPES.reduce((acc, t) => {
    acc[t] = urlConfigs.filter(u => u.url_type === t);
    return acc;
  }, {} as Record<string, any[]>);

  async function toggleUrl(u: any) {
    await fetch(`${API}/api/v1/admin/scm/urls/${u.id}/toggle`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token()}` },
    });
    loadUrls(selectedCode);
  }

  async function saveUrl() {
    setSaving(true); setMsg("");
    try {
      const isEdit = modal === "edit" && editTarget;
      const url    = isEdit
        ? `${API}/api/v1/admin/scm/urls/${editTarget.id}`
        : `${API}/api/v1/admin/scm/urls/`;
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        authority_code:       selectedCode,
        url_type:             form.url_type,
        url:                  form.url,
        label:                form.label || null,
        priority:             Number(form.priority),
        requires_proxy:       form.requires_proxy,
        requires_playwright:  form.requires_playwright,
        notes:                form.notes || null,
        sub_pages:            [],
      };
      const r = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) { const e = await r.json(); setMsg(e.detail || "Save failed"); }
      else { setMsg("✅ Saved"); setTimeout(() => { setModal(null); loadUrls(selectedCode); }, 700); }
    } catch (e: any) { setMsg(e.message); }
    setSaving(false);
  }

  async function deleteUrl() {
    if (!delId) return;
    try {
      await fetch(`${API}/api/v1/admin/scm/urls/${delId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token()}` },
      });
      setDelId(null); loadUrls(selectedCode);
    } catch {}
  }

  async function saveSubPages() {
    if (!editTarget) return;
    setSaving(true); setMsg("");
    try {
      const r = await fetch(`${API}/api/v1/admin/scm/urls/${editTarget.id}/sub-pages`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sub_pages: subPages }),
      });
      if (!r.ok) { const e = await r.json(); setMsg(e.detail || "Save failed"); }
      else { setMsg("✅ Saved"); setTimeout(() => { setModal(null); loadUrls(selectedCode); }, 700); }
    } catch (e: any) { setMsg(e.message); }
    setSaving(false);
  }

  const selAuth = authorities.find(a => a.authority_code === selectedCode);

  return (
    <>
      <Head><title>SCM — URL Mapper · GovPlot Admin</title></Head>
      <AdminLayout title="Scraper Config — URL Mapper">
        <style>{`
          .mapper-wrap{display:flex;gap:0;height:calc(100vh - 120px);min-height:500px}
          .auth-sidebar{width:220px;flex-shrink:0;border-right:1px solid var(--border);
            overflow-y:auto;padding:8px 0}
          .auth-sidebar-item{padding:9px 16px;cursor:pointer;font-size:.82rem;
            border-left:3px solid transparent;transition:.15s;color:var(--text-muted)}
          .auth-sidebar-item:hover{background:var(--bg-input);color:var(--text-heading)}
          .auth-sidebar-item.active{border-left-color:var(--accent);background:rgba(99,102,241,.1);
            color:var(--text-heading);font-weight:700}
          .auth-sidebar-code{font-size:.72rem;font-weight:700;color:#818cf8;display:block}
          .auth-sidebar-name{font-size:.78rem;color:inherit;display:block;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px}
          .url-main{flex:1;overflow-y:auto;padding:16px 20px}
          .url-main-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
          .url-main-title{font-size:1.05rem;font-weight:700;color:var(--text-heading)}
          .btn-add{background:var(--accent);color:#fff;border:none;border-radius:7px;
            padding:7px 14px;font-size:.82rem;font-weight:700;cursor:pointer}
          .url-type-section{margin-bottom:20px}
          .url-type-label{display:flex;align-items:center;gap:8px;font-size:.8rem;
            font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;
            letter-spacing:.06em}
          .url-type-dot{width:8px;height:8px;border-radius:50%}
          .url-card{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;
            padding:12px 14px;margin-bottom:8px;display:flex;gap:10px;align-items:flex-start}
          .url-card-left{flex:1;min-width:0}
          .url-card-url{font-size:.82rem;color:var(--accent);word-break:break-all;
            text-decoration:none;font-family:monospace}
          .url-card-label{font-size:.75rem;color:var(--text-muted);margin-top:3px}
          .url-card-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
          .url-meta-tag{font-size:.68rem;padding:2px 6px;border-radius:4px;
            background:var(--bg-input);color:var(--text-dim)}
          .url-card-actions{display:flex;gap:6px;flex-shrink:0}
          .btn-xs{padding:4px 9px;border-radius:5px;font-size:.72rem;font-weight:600;
            cursor:pointer;border:1px solid transparent;white-space:nowrap}
          .btn-xs-blue{background:rgba(99,102,241,.15);color:#818cf8;border-color:rgba(99,102,241,.3)}
          .btn-xs-green{background:rgba(34,197,94,.12);color:#22c55e;border-color:rgba(34,197,94,.3)}
          .btn-xs-red{background:rgba(239,68,68,.1);color:#f87171;border-color:rgba(239,68,68,.3)}
          .btn-xs-amber{background:rgba(245,158,11,.1);color:#fbbf24;border-color:rgba(245,158,11,.3)}
          .url-disabled{opacity:.5}
          .health-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:4px}
          .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100;
            display:flex;align-items:center;justify-content:center;padding:20px}
          .modal-box{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;
            padding:24px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto}
          .modal-title{font-size:1rem;font-weight:700;color:var(--text-heading);margin:0 0 18px}
          .form-row{margin-bottom:13px}
          .form-label{display:block;font-size:.77rem;color:var(--text-muted);margin-bottom:4px;font-weight:600}
          .form-input{width:100%;box-sizing:border-box;background:var(--bg-input);
            border:1px solid var(--border);color:var(--text-heading);border-radius:7px;
            padding:7px 11px;font-size:.84rem;outline:none}
          .form-input:focus{border-color:var(--accent)}
          .form-check{display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--text-muted);cursor:pointer}
          .form-check input{width:16px;height:16px;accent-color:var(--accent)}
          .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}
          .btn-save{background:var(--accent);color:#fff;padding:7px 18px;border:none;
            border-radius:7px;font-size:.84rem;font-weight:700;cursor:pointer}
          .btn-cancel{background:var(--bg-input);color:var(--text-muted);padding:7px 18px;
            border:1px solid var(--border);border-radius:7px;font-size:.84rem;cursor:pointer}
          .msg{font-size:.8rem;margin-top:8px;color:#4ade80}
          .msg.err{color:#f87171}
          .sp-row{display:flex;gap:8px;align-items:center;margin-bottom:8px}
          .sp-row input{flex:1;background:var(--bg-input);border:1px solid var(--border);
            color:var(--text-heading);border-radius:6px;padding:6px 9px;font-size:.82rem;outline:none}
          .sp-row input:focus{border-color:var(--accent)}
          .empty-state{text-align:center;padding:32px 16px;color:var(--text-muted);font-size:.85rem}
          .del-confirm{background:var(--bg-card);border:1px solid var(--border);border-radius:10px;
            padding:20px;max-width:360px;width:100%}
          .del-confirm p{color:var(--text-muted);font-size:.88rem;margin:0 0 14px}
          .failure-badge{background:rgba(239,68,68,.12);color:#f87171;font-size:.68rem;
            padding:2px 6px;border-radius:4px;margin-left:4px}
        `}</style>

        <div className="mapper-wrap">
          {/* Left sidebar — authority list */}
          <div className="auth-sidebar">
            {authorities.map(a => (
              <div key={a.authority_code}
                className={`auth-sidebar-item${a.authority_code === selectedCode ? " active" : ""}`}
                onClick={() => setSelected(a.authority_code)}>
                <span className="auth-sidebar-code">{a.authority_code}</span>
                <span className="auth-sidebar-name">{a.authority_name}</span>
              </div>
            ))}
          </div>

          {/* Right — URL configs for selected authority */}
          <div className="url-main">
            <div className="url-main-hdr">
              <div className="url-main-title">
                {selAuth ? `${selAuth.authority_code} — ${selAuth.authority_name}` : "Select an authority"}
                {selAuth && <span style={{fontSize:".78rem",color:"var(--text-muted)",fontWeight:400,marginLeft:8}}>
                  ({selAuth.state})
                </span>}
              </div>
              {selectedCode && (
                <button className="btn-add" onClick={() => {
                  setForm({ ...BLANK_URL, authority_code: selectedCode });
                  setMsg(""); setEditTarget(null); setModal("add");
                }}>+ Add URL</button>
              )}
            </div>

            {loading ? (
              <div className="empty-state">Loading URLs…</div>
            ) : !selectedCode ? (
              <div className="empty-state">Select an authority from the left to manage its URLs.</div>
            ) : (
              URL_TYPES.map(type => {
                const list = grouped[type] || [];
                if (list.length === 0) return null;
                return (
                  <div className="url-type-section" key={type}>
                    <div className="url-type-label">
                      <div className="url-type-dot" style={{ background: TYPE_COLORS[type] }} />
                      {TYPE_ICONS[type]} {type.replace(/_/g, " ")}
                      <span style={{color:"var(--text-dim)",fontSize:".72rem",fontWeight:400,marginLeft:4}}>
                        ({list.length})
                      </span>
                    </div>
                    {list.map(u => (
                      <div key={u.id} className={`url-card${!u.is_enabled ? " url-disabled" : ""}`}>
                        <div className="url-card-left">
                          <a href={u.url} target="_blank" rel="noopener noreferrer" className="url-card-url">
                            {u.url}
                          </a>
                          {u.label && <div className="url-card-label">{u.label}</div>}
                          <div className="url-card-meta">
                            <span className="url-meta-tag">P{u.priority}</span>
                            {u.requires_proxy     && <span className="url-meta-tag">🛡️ Proxy</span>}
                            {u.requires_playwright && <span className="url-meta-tag">🎭 Playwright</span>}
                            {(u.sub_pages?.length > 0) && (
                              <span className="url-meta-tag">📑 {u.sub_pages.length} sub-pages</span>
                            )}
                            {u.failure_count > 0 && (
                              <span className="failure-badge">⚠ {u.failure_count} fails</span>
                            )}
                            {u.last_success_at && (
                              <span className="url-meta-tag">
                                ✅ {new Date(u.last_success_at).toLocaleDateString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="url-card-actions">
                          <button className="btn-xs btn-xs-blue" onClick={() => {
                            setForm({
                              authority_code:       selectedCode,
                              url_type:             u.url_type,
                              url:                  u.url,
                              label:                u.label || "",
                              priority:             u.priority,
                              requires_proxy:       u.requires_proxy,
                              requires_playwright:  u.requires_playwright,
                              notes:                u.notes || "",
                            });
                            setMsg(""); setEditTarget(u); setModal("edit");
                          }}>✏️</button>
                          <button className="btn-xs btn-xs-amber" onClick={() => {
                            setSubPages(u.sub_pages || []);
                            setMsg(""); setEditTarget(u); setModal("subpages");
                          }}>📑</button>
                          <button className={`btn-xs ${u.is_enabled ? "btn-xs-green" : "btn-xs-red"}`}
                            onClick={() => toggleUrl(u)}>
                            {u.is_enabled ? "ON" : "OFF"}
                          </button>
                          <button className="btn-xs btn-xs-red" onClick={() => setDelId(u.id)}>🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}

            {/* Empty URLs state */}
            {!loading && selectedCode && urlConfigs.length === 0 && (
              <div className="empty-state">
                No URLs configured yet.<br />
                <button className="btn-add" style={{marginTop:12}} onClick={() => {
                  setForm({ ...BLANK_URL, authority_code: selectedCode });
                  setMsg(""); setEditTarget(null); setModal("add");
                }}>+ Add First URL</button>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit URL Modal */}
        {(modal === "add" || modal === "edit") && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className="modal-box">
              <div className="modal-title">
                {modal === "add" ? `➕ Add URL — ${selectedCode}` : `✏️ Edit URL — ${selectedCode}`}
              </div>

              <div className="form-row">
                <label className="form-label">URL Type</label>
                <select className="form-input" value={form.url_type}
                  onChange={e => setForm((p: any) => ({ ...p, url_type: e.target.value }))}>
                  {URL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">URL *</label>
                <input className="form-input" value={form.url}
                  onChange={e => setForm((p: any) => ({ ...p, url: e.target.value }))}
                  placeholder="https://authority.gov.in/schemes" />
              </div>
              <div className="form-row">
                <label className="form-label">Label (optional)</label>
                <input className="form-input" value={form.label}
                  onChange={e => setForm((p: any) => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. Residential Plot Listing" />
              </div>
              <div className="form-row">
                <label className="form-label">Priority (1 = tried first)</label>
                <input className="form-input" type="number" min={1} max={10} value={form.priority}
                  onChange={e => setForm((p: any) => ({ ...p, priority: e.target.value }))} />
              </div>
              <div className="form-row" style={{display:"flex",gap:20}}>
                <label className="form-check">
                  <input type="checkbox" checked={form.requires_proxy}
                    onChange={e => setForm((p: any) => ({ ...p, requires_proxy: e.target.checked }))} />
                  Requires Proxy (NIC/gov.in sites)
                </label>
                <label className="form-check">
                  <input type="checkbox" checked={form.requires_playwright}
                    onChange={e => setForm((p: any) => ({ ...p, requires_playwright: e.target.checked }))} />
                  Requires Playwright (JS-rendered)
                </label>
              </div>
              <div className="form-row">
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.notes}
                  onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))} />
              </div>

              {msg && <div className={`msg${msg.startsWith("✅") ? "" : " err"}`}>{msg}</div>}

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn-save" onClick={saveUrl} disabled={saving || !form.url}>
                  {saving ? "Saving…" : modal === "add" ? "Add URL" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-pages Modal */}
        {modal === "subpages" && editTarget && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className="modal-box">
              <div className="modal-title">📑 Sub-pages — {editTarget.url.slice(0, 50)}…</div>
              <p style={{fontSize:".8rem",color:"var(--text-muted)",margin:"0 0 14px"}}>
                Max 5 sub-pages. Each will be scraped after the parent URL.
              </p>

              {subPages.map((sp, i) => (
                <div className="sp-row" key={i}>
                  <input placeholder="URL" value={sp.url || ""}
                    onChange={e => setSubPages(prev => prev.map((p, j) => j===i ? {...p, url: e.target.value} : p))} />
                  <input placeholder="Label (optional)" value={sp.label || ""}
                    onChange={e => setSubPages(prev => prev.map((p, j) => j===i ? {...p, label: e.target.value} : p))} />
                  <label className="form-check" style={{whiteSpace:"nowrap"}}>
                    <input type="checkbox" checked={sp.is_enabled !== false}
                      onChange={e => setSubPages(prev => prev.map((p, j) => j===i ? {...p, is_enabled: e.target.checked} : p))} />
                    On
                  </label>
                  <button className="btn-xs btn-xs-red"
                    onClick={() => setSubPages(prev => prev.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}

              {subPages.length < 5 && (
                <button className="btn-xs btn-xs-blue" style={{marginTop:8}}
                  onClick={() => setSubPages(prev => [...prev, { url: "", label: "", is_enabled: true }])}>
                  + Add Sub-page
                </button>
              )}

              {msg && <div className={`msg${msg.startsWith("✅") ? "" : " err"}`}>{msg}</div>}

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn-save" onClick={saveSubPages} disabled={saving}>
                  {saving ? "Saving…" : "Save Sub-pages"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {delId && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setDelId(null); }}>
            <div className="del-confirm">
              <div className="modal-title" style={{marginBottom:8}}>🗑 Delete URL?</div>
              <p>This will permanently remove the URL config. If scraper run logs reference it, deletion will be blocked — disable it instead.</p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDelId(null)}>Cancel</button>
                <button style={{background:"#ef4444",color:"#fff",padding:"7px 18px",border:"none",
                  borderRadius:"7px",fontSize:".84rem",fontWeight:700,cursor:"pointer"}}
                  onClick={deleteUrl}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
