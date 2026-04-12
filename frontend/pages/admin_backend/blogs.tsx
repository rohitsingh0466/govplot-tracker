import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TAGS = ["General","Breaking News","Analysis","Comparison","Investment","How-To Guide","Announcement"];
const CITIES = [
  "Greater Noida","Lucknow","Jaipur","Agra","Prayagraj","Chandigarh",
  "Navi Mumbai","Hyderabad","Pune","Bengaluru","Delhi","Ahmedabad","Bhopal",
];

const BLANK: any = {
  title:"", excerpt:"", content_html:"", city:"Greater Noida",
  tag:"General", read_time_mins:5,
  is_published:false, is_featured:false,
  meta_title:"", meta_desc:"", cover_image_url:"",
};

export default function AdminBlogs() {
  const router = useRouter();
  const [rows, setRows]         = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"new"|"edit"|null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm]         = useState<any>(BLANK);
  const [editorMode, setEditorMode] = useState<"visual"|"html">("visual");
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState("");
  const [saveOk, setSaveOk]     = useState("");
  const [delId, setDelId]       = useState<number|null>(null);

  const token = () => localStorage.getItem("govplot_admin_token");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/v1/admin/data/blogs?page=${page}&limit=20`,
      { headers: { Authorization: `Bearer ${token()}` } });
    if (res.status === 401) { router.replace("/admin_backend/login"); return; }
    const d = await res.json();
    setRows(d.items||[]); setTotal(d.total||0); setPages(d.pages||1);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (router.isReady && router.query.action === "new") openNew();
  }, [router.isReady]);

  function f(key: string, val: any) { setForm((prev: any) => ({ ...prev, [key]: val })); }

  async function openEdit(r: any) {
    const res = await fetch(`${API}/api/v1/admin/data/blogs/${r.id}`,
      { headers: { Authorization: `Bearer ${token()}` } });
    const full = await res.json();
    setSelected(full); setForm({ ...BLANK, ...full }); setSaveErr(""); setSaveOk("");
    setEditorMode("visual"); setModal("edit");
  }

  function openNew() {
    setSelected(null); setForm({ ...BLANK });
    setSaveErr(""); setSaveOk(""); setEditorMode("visual"); setModal("new");
  }

  async function save() {
    if (!form.title.trim()) { setSaveErr("Title is required"); return; }
    if (!form.content_html.trim()) { setSaveErr("Content cannot be empty"); return; }
    setSaving(true); setSaveErr(""); setSaveOk("");
    try {
      const url = modal==="edit"
        ? `${API}/api/v1/admin/data/blogs/${selected.id}`
        : `${API}/api/v1/admin/data/blogs`;
      const res = await fetch(url, {
        method: modal==="edit" ? "PATCH" : "POST",
        headers: { Authorization:`Bearer ${token()}`, "Content-Type":"application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setSaveErr(d.detail||"Save failed"); return; }
      setSaveOk("Saved successfully ✓");
      setTimeout(() => { setModal(null); load(); }, 800);
    } catch { setSaveErr("Network error"); }
    finally { setSaving(false); }
  }

  async function togglePublish(r: any) {
    await fetch(`${API}/api/v1/admin/data/blogs/${r.id}/toggle`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token()}` }
    });
    load();
  }

  async function confirmDelete() {
    if (!delId) return;
    await fetch(`${API}/api/v1/admin/data/blogs/${delId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token()}` }
    });
    setDelId(null); load();
  }

  function fmt(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN",{ day:"numeric", month:"short", year:"numeric" });
  }

  // Simple toolbar buttons for visual mode
  const insertTag = (open: string, close: string) => {
    const ta = document.getElementById("content-editor") as HTMLTextAreaElement;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = form.content_html.substring(s, e) || "text";
    const newVal = form.content_html.substring(0,s) + open + sel + close + form.content_html.substring(e);
    f("content_html", newVal);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s+open.length, s+open.length+sel.length); }, 0);
  };

  return (
    <>
      <Head><title>Blogs — GovPlot Admin</title></Head>
      <AdminLayout title="Blog Management">

        {/* Header */}
        <div className="ctrl-row">
          <div>
            <h2 className="sec-head">Manage Blog Posts</h2>
            <p className="sec-sub">{total} posts · {rows.filter(r=>r.is_published).length} published</p>
          </div>
          <button className="btn-p" onClick={openNew}>✍ Write New Post</button>
        </div>

        {/* Table */}
        <div className="a-card" style={{padding:0,overflow:"hidden",marginTop:14}}>
          {loading ? <div className="spin-row"><span className="spin-ico">⟳</span> Loading…</div> : (
            <table className="a-table">
              <thead>
                <tr>
                  <th>Title</th><th>Tag</th><th>City</th>
                  <th>Published</th><th>Featured</th>
                  <th>Read</th><th>Published On</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="b-title">{r.title}</div>
                      <div className="b-slug">/{r.slug}</div>
                    </td>
                    <td><span className="badge bg-blue" style={{fontSize:10}}>{r.tag}</span></td>
                    <td style={{fontSize:12,color:"rgba(255,255,255,0.45)"}}>{r.city||"—"}</td>
                    <td>
                      <label className="toggle">
                        <input type="checkbox" checked={r.is_published} onChange={()=>togglePublish(r)} />
                        <span className="slider" />
                      </label>
                    </td>
                    <td>
                      {r.is_featured
                        ? <span className="badge bg-yellow">⭐ Featured</span>
                        : <span style={{color:"rgba(255,255,255,0.2)",fontSize:12}}>—</span>}
                    </td>
                    <td style={{whiteSpace:"nowrap",fontSize:12,color:"rgba(255,255,255,0.45)"}}>{r.read_time_mins} min</td>
                    <td style={{fontSize:12,color:"rgba(255,255,255,0.4)",whiteSpace:"nowrap"}}>{fmt(r.published_at)}</td>
                    <td>
                      <div style={{display:"flex",gap:6}}>
                        <button className="btn-s sm" onClick={() => openEdit(r)}>✏ Edit</button>
                        <button className="btn-d sm" onClick={() => setDelId(r.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={8} style={{textAlign:"center",color:"rgba(255,255,255,0.25)",padding:40}}>
                    No blog posts yet. Click "Write New Post" to create one.
                  </td></tr>
                )}
              </tbody>
            </table>
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

        {/* Edit / New Modal */}
        {modal && (
          <div className="modal-bg">
            <div className="modal" style={{maxWidth:820}}>
              <h2 className="modal-h">{modal==="new"?"✍ Write New Post":"✏ Edit Post"}</h2>
              {selected?.slug && (
                <p style={{fontSize:11,color:"rgba(255,255,255,0.28)",marginBottom:14,fontFamily:"monospace"}}>
                  slug: /{selected.slug}
                </p>
              )}

              {/* Two-column meta */}
              <div className="fg">
                <div className="f-group fg-full">
                  <label className="f-label">Title *</label>
                  <input className="a-input" value={form.title} onChange={e=>f("title",e.target.value)}
                    placeholder="YEIDA Plot Scheme 2026 — Full Guide" />
                </div>
                <div className="f-group fg-full">
                  <label className="f-label">Excerpt (shown on blog listing)</label>
                  <textarea className="a-textarea" rows={2} value={form.excerpt} onChange={e=>f("excerpt",e.target.value)}
                    placeholder="One or two sentences summarising the post…" />
                </div>
                <div className="f-group">
                  <label className="f-label">City</label>
                  <select className="a-select" value={form.city||""} onChange={e=>f("city",e.target.value)}>
                    <option value="">— None —</option>
                    {CITIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="f-group">
                  <label className="f-label">Tag / Category</label>
                  <select className="a-select" value={form.tag} onChange={e=>f("tag",e.target.value)}>
                    {TAGS.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="f-group">
                  <label className="f-label">Read Time (minutes)</label>
                  <input className="a-input" type="number" min={1} max={60} value={form.read_time_mins}
                    onChange={e=>f("read_time_mins",Number(e.target.value))} />
                </div>
                <div className="f-group">
                  <label className="f-label">Cover Image URL</label>
                  <input className="a-input" type="url" value={form.cover_image_url||""}
                    onChange={e=>f("cover_image_url",e.target.value)}
                    placeholder="https://cdn.govplottracker.com/blog/…" />
                </div>
                <div className="f-group">
                  <label className="f-label">Meta Title (SEO)</label>
                  <input className="a-input" value={form.meta_title||""} onChange={e=>f("meta_title",e.target.value)}
                    placeholder="Same as title if blank" />
                </div>
                <div className="f-group">
                  <label className="f-label">Meta Description (SEO)</label>
                  <input className="a-input" value={form.meta_desc||""} onChange={e=>f("meta_desc",e.target.value)}
                    placeholder="Under 155 characters for Google" />
                </div>
                <div className="f-group flags-row">
                  <label className="f-label">Options</label>
                  <div className="chk-row">
                    <label className="chk">
                      <label className="toggle"><input type="checkbox" checked={form.is_published}
                        onChange={e=>f("is_published",e.target.checked)}/><span className="slider"/></label>
                      <span>Published</span>
                    </label>
                    <label className="chk">
                      <label className="toggle"><input type="checkbox" checked={form.is_featured}
                        onChange={e=>f("is_featured",e.target.checked)}/><span className="slider"/></label>
                      <span>⭐ Featured</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Content Editor */}
              <div style={{marginTop:18}}>
                <div className="editor-hd">
                  <label className="f-label" style={{marginBottom:0}}>Content *</label>
                  <div className="editor-tabs">
                    <button className={`etab ${editorMode==="visual"?"active":""}`}
                      onClick={()=>setEditorMode("visual")}>🖊 Visual</button>
                    <button className={`etab ${editorMode==="html"?"active":""}`}
                      onClick={()=>setEditorMode("html")}>{"<>"} HTML</button>
                  </div>
                </div>

                {editorMode==="visual" && (
                  <div className="toolbar">
                    {[
                      ["H2",    "<h2>",    "</h2>"],
                      ["H3",    "<h3>",    "</h3>"],
                      ["Bold",  "<strong>","</strong>"],
                      ["Italic","<em>",    "</em>"],
                      ["Para",  "<p>",     "</p>"],
                      ["UL",    "<ul>\n  <li>","</li>\n</ul>"],
                      ["LI",    "<li>",    "</li>"],
                      ["OL",    "<ol>\n  <li>","</li>\n</ol>"],
                      ["Link",  '<a href="">',  "</a>"],
                      ["Table", '<table>\n  <thead><tr><th>Col 1</th><th>Col 2</th></tr></thead>\n  <tbody><tr><td>','</td><td>Value</td></tr></tbody>\n</table>'],
                    ].map(([label,o,c])=>(
                      <button key={label} className="tb-btn" onClick={()=>insertTag(o,c)}>{label}</button>
                    ))}
                  </div>
                )}

                <textarea
                  id="content-editor"
                  className="a-textarea"
                  style={{minHeight:280,fontFamily:editorMode==="html"?"monospace":undefined,fontSize:13.5}}
                  value={form.content_html}
                  onChange={e=>f("content_html",e.target.value)}
                  placeholder={editorMode==="visual"
                    ? "Use the toolbar above to format, or just type HTML tags directly…"
                    : "Paste or type HTML content here…"
                  }
                />

                {form.content_html && editorMode==="visual" && (
                  <details style={{marginTop:10}}>
                    <summary style={{fontSize:11.5,color:"rgba(255,255,255,0.3)",cursor:"pointer"}}>Preview rendered HTML</summary>
                    <div className="preview"
                      dangerouslySetInnerHTML={{ __html: form.content_html }} />
                  </details>
                )}
              </div>

              {saveErr && <div className="err-msg">⚠ {saveErr}</div>}
              {saveOk  && <div className="ok-msg">✓ {saveOk}</div>}

              <div className="modal-actions">
                <button className="btn-s" onClick={()=>setModal(null)}>Cancel</button>
                <button className="btn-p" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : modal==="new" ? "Publish Post" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {delId !== null && (
          <div className="modal-bg">
            <div className="modal" style={{maxWidth:400}}>
              <h2 className="modal-h">🗑 Delete Post?</h2>
              <p style={{color:"rgba(255,255,255,0.55)",fontSize:14,marginBottom:18}}>
                This will permanently delete the blog post and remove it from the live site. This cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn-s" onClick={()=>setDelId(null)}>Cancel</button>
                <button className="btn-d" onClick={confirmDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .ctrl-row { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:6px; }
          .sec-head { font-family:'Outfit',system-ui,sans-serif; font-size:18px; font-weight:800; color:#fff; }
          .sec-sub  { font-size:12px; color:rgba(255,255,255,0.35); margin-top:3px; }
          .b-title { font-size:13px; font-weight:600; color:rgba(255,255,255,0.82); max-width:340px; line-height:1.4; }
          .b-slug  { font-size:10.5px; color:rgba(255,255,255,0.28); font-family:monospace; margin-top:1px; }
          .fg { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
          .fg-full { grid-column:1/-1; }
          .flags-row { grid-column:1/-1; }
          .chk-row { display:flex; gap:20px; align-items:center; margin-top:4px; }
          .chk { display:flex; align-items:center; gap:9px; font-size:13px; color:rgba(255,255,255,0.6); cursor:pointer; }
          .editor-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
          .editor-tabs { display:flex; gap:4px; }
          .etab {
            background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
            color:rgba(255,255,255,0.45); padding:5px 13px;
            border-radius:7px; font-size:12px; font-weight:600; transition:all 0.15s;
          }
          .etab.active { background:rgba(13,122,104,0.20); border-color:rgba(13,122,104,0.35); color:#34d9bc; }
          .toolbar { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px; }
          .tb-btn {
            background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
            color:rgba(255,255,255,0.6); padding:4px 10px;
            border-radius:6px; font-size:11.5px; font-weight:600;
            transition:all 0.15s;
          }
          .tb-btn:hover { background:rgba(255,255,255,0.12); color:#fff; }
          .preview {
            margin-top:10px;
            background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
            border-radius:10px; padding:16px 20px;
            color:rgba(255,255,255,0.75); font-size:14px; line-height:1.7;
            max-height:300px; overflow-y:auto;
          }
          .preview h2 { color:#fff; font-size:18px; margin:16px 0 8px; }
          .preview h3 { color:#fff; font-size:15px; margin:14px 0 6px; }
          .preview p  { margin-bottom:10px; }
          .preview ul,ol { margin:8px 0 10px 20px; }
          .preview li { margin-bottom:4px; }
          .preview strong { color:#fff; }
          .preview a { color:#34d9bc; }
          .preview table { width:100%; border-collapse:collapse; font-size:13px; }
          .preview th,td { border:1px solid rgba(255,255,255,0.1); padding:6px 10px; }
          .preview th { background:rgba(255,255,255,0.06); font-weight:700; }
        `}</style>
      </AdminLayout>
    </>
  );
}
