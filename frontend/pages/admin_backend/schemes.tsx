import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CITIES = [
  "Greater Noida","Lucknow","Jaipur","Agra","Prayagraj","Chandigarh",
  "Navi Mumbai","Hyderabad","Pune","Bengaluru","Raipur","Varanasi",
  "Bhubaneswar","Nagpur","Ahmedabad","Delhi","Bhopal","Udaipur","Dehradun","Meerut",
];
const STATUSES = ["OPEN","ACTIVE","UPCOMING","CLOSED"];

const BLANK: any = {
  scheme_id:"", name:"", city:"Greater Noida", authority:"",
  status:"UPCOMING", open_date:"", close_date:"",
  total_plots:"", price_min:"", price_max:"",
  area_sqft_min:"", area_sqft_max:"",
  location_details:"", apply_url:"", source_url:"",
  is_active:true, manual_notes:"",
};

export default function AdminSchemes() {
  const router = useRouter();
  const [rows, setRows]     = useState<any[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity]     = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal]   = useState<"new"|"edit"|null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm]     = useState<any>(BLANK);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [saveOk, setSaveOk]   = useState("");

  const token = () => localStorage.getItem("govplot_admin_token");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({
      page: String(page), limit: "20",
      ...(search && { search }),
      ...(city && { city }),
      ...(status && { status }),
    });
    const res = await fetch(`${API}/api/v1/admin/data/schemes?${p}`,
      { headers: { Authorization: `Bearer ${token()}` } });
    if (res.status === 401) { router.replace("/admin_backend/login"); return; }
    const d = await res.json();
    setRows(d.items || []); setTotal(d.total || 0); setPages(d.pages || 1);
    setLoading(false);
  }, [page, search, city, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (router.isReady && router.query.action === "new") openNew();
  }, [router.isReady]);

  function f(key: string, val: any) { setForm((prev: any) => ({ ...prev, [key]: val })); }

  function openEdit(r: any) {
    setSelected(r);
    setForm({ ...r,
      total_plots: r.total_plots ?? "", price_min: r.price_min ?? "",
      price_max: r.price_max ?? "", area_sqft_min: r.area_sqft_min ?? "",
      area_sqft_max: r.area_sqft_max ?? "",
    });
    setSaveErr(""); setSaveOk(""); setModal("edit");
  }
  function openNew() {
    setSelected(null); setForm({ ...BLANK });
    setSaveErr(""); setSaveOk(""); setModal("new");
  }

  async function save() {
    setSaving(true); setSaveErr(""); setSaveOk("");
    const body: any = { ...form };
    ["total_plots","price_min","price_max","area_sqft_min","area_sqft_max"].forEach(k => {
      body[k] = body[k] === "" || body[k] === null ? null : Number(body[k]);
    });

    try {
      const url = modal === "edit"
        ? `${API}/api/v1/admin/data/schemes/${selected.scheme_id}`
        : `${API}/api/v1/admin/data/schemes`;
      const method = modal === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token()}`, "Content-Type":"application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setSaveErr(d.detail || "Save failed"); return; }
      setSaveOk("Saved! Reflecting on frontend…");
      setTimeout(() => { setModal(null); load(); }, 900);
    } catch { setSaveErr("Network error"); }
    finally { setSaving(false); }
  }

  async function toggle(id: string) {
    await fetch(`${API}/api/v1/admin/data/schemes/${id}/toggle`, {
      method:"PATCH", headers: { Authorization: `Bearer ${token()}` }
    });
    load();
  }

  const sbadge = (s: string) => {
    const m: Record<string,string> = { OPEN:"bg-green", ACTIVE:"bg-blue", UPCOMING:"bg-yellow", CLOSED:"bg-gray" };
    return <span className={`badge ${m[s]||"bg-gray"}`}>{s}</span>;
  };

  return (
    <>
      <Head><title>Schemes — GovPlot Admin</title></Head>
      <AdminLayout title="Schemes">

        {/* Controls */}
        <div className="ctrl-row">
          <input className="a-input" style={{maxWidth:260}} placeholder="🔍 Search name, authority, city…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="a-select" style={{maxWidth:160}}
            value={city} onChange={e => { setCity(e.target.value); setPage(1); }}>
            <option value="">All Cities</option>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="a-select" style={{maxWidth:140}}
            value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-p" onClick={openNew}>➕ Add Scheme</button>
          <span className="total-ct">{total} total</span>
        </div>

        {/* Table */}
        <div className="a-card" style={{padding:0,overflow:"hidden",marginTop:14}}>
          {loading ? <div className="spin-row"><span className="spin-ico">⟳</span>Loading…</div> : (
            <div style={{overflowX:"auto"}}>
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Scheme</th><th>City</th><th>Authority</th>
                    <th>Status</th><th>Price (₹L)</th><th>Plots</th>
                    <th>Source</th><th>Show</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.scheme_id}>
                      <td>
                        <div className="s-name">{r.name}</div>
                        <div className="s-id">{r.scheme_id}</div>
                        {r.is_manually_edited && <span className="badge bg-teal" style={{fontSize:9,padding:"1px 6px"}}>Edited</span>}
                      </td>
                      <td style={{whiteSpace:"nowrap"}}>{r.city}</td>
                      <td><span className="badge bg-gray">{r.authority}</span></td>
                      <td>{sbadge(r.status)}</td>
                      <td style={{whiteSpace:"nowrap"}}>
                        {r.price_min ? `₹${r.price_min}${r.price_max ? `–${r.price_max}` : "+"}L` : "—"}
                      </td>
                      <td>{r.total_plots?.toLocaleString() || "—"}</td>
                      <td>
                        <span className={`badge ${r.data_source==="LIVE"?"bg-green":"bg-gray"}`}
                          style={{fontSize:9}}>{r.data_source}</span>
                      </td>
                      <td>
                        <label className="toggle">
                          <input type="checkbox" checked={r.is_active} onChange={() => toggle(r.scheme_id)} />
                          <span className="slider" />
                        </label>
                      </td>
                      <td>
                        <button className="btn-s sm" onClick={() => openEdit(r)}>✏ Edit</button>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr><td colSpan={9} style={{textAlign:"center",color:"rgba(255,255,255,0.25)",padding:"40px"}}>
                      No schemes found
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
            <button className="pg-btn" onClick={() => setPage(1)} disabled={page===1}>«</button>
            <button className="pg-btn" onClick={() => setPage(p=>p-1)} disabled={page===1}>‹</button>
            {Array.from({length:Math.min(pages,7)},(_,i)=>{
              const p = page<=4 ? i+1 : page-3+i;
              if(p<1||p>pages) return null;
              return <button key={p} className={`pg-btn ${p===page?"on":""}`} onClick={()=>setPage(p)}>{p}</button>;
            })}
            <button className="pg-btn" onClick={() => setPage(p=>p+1)} disabled={page===pages}>›</button>
            <button className="pg-btn" onClick={() => setPage(pages)} disabled={page===pages}>»</button>
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className="modal-bg">
            <div className="modal" style={{maxWidth:720}}>
              <h2 className="modal-h">{modal==="new"?"➕ Add New Scheme":"✏ Edit Scheme"}</h2>
              {modal==="edit" && <p style={{fontSize:11.5,color:"rgba(255,255,255,0.3)",marginBottom:14,fontFamily:"monospace"}}>{selected?.scheme_id}</p>}

              <div className="fg">
                {modal==="new" && (
                  <div className="f-group fg-full">
                    <label className="f-label">Scheme ID *</label>
                    <input className="a-input" value={form.scheme_id} onChange={e=>f("scheme_id",e.target.value)}
                      placeholder="e.g. YEIDA-RPS11-2027" />
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>Must be unique. Format: AUTHORITY-DESCRIPTOR-YEAR</span>
                  </div>
                )}
                <div className="f-group fg-full">
                  <label className="f-label">Scheme Name *</label>
                  <input className="a-input" value={form.name} onChange={e=>f("name",e.target.value)}
                    placeholder="Authority City Scheme Description Year" />
                </div>
                <div className="f-group">
                  <label className="f-label">City *</label>
                  <select className="a-select" value={form.city} onChange={e=>f("city",e.target.value)}>
                    {CITIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="f-group">
                  <label className="f-label">Authority *</label>
                  <input className="a-input" value={form.authority} onChange={e=>f("authority",e.target.value)}
                    placeholder="e.g. YEIDA, LDA, DDA" />
                </div>
                <div className="f-group">
                  <label className="f-label">Status *</label>
                  <select className="a-select" value={form.status} onChange={e=>f("status",e.target.value)}>
                    {STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="f-group">
                  <label className="f-label">Open Date</label>
                  <input className="a-input" type="date" value={form.open_date||""} onChange={e=>f("open_date",e.target.value)} />
                </div>
                <div className="f-group">
                  <label className="f-label">Close Date</label>
                  <input className="a-input" type="date" value={form.close_date||""} onChange={e=>f("close_date",e.target.value)} />
                </div>
                <div className="f-group">
                  <label className="f-label">Total Plots</label>
                  <input className="a-input" type="number" value={form.total_plots} onChange={e=>f("total_plots",e.target.value)} placeholder="e.g. 2000" />
                </div>
                <div className="f-group">
                  <label className="f-label">Price Min (₹ Lakh)</label>
                  <input className="a-input" type="number" step="0.1" value={form.price_min} onChange={e=>f("price_min",e.target.value)} placeholder="e.g. 30" />
                </div>
                <div className="f-group">
                  <label className="f-label">Price Max (₹ Lakh)</label>
                  <input className="a-input" type="number" step="0.1" value={form.price_max} onChange={e=>f("price_max",e.target.value)} placeholder="e.g. 90" />
                </div>
                <div className="f-group">
                  <label className="f-label">Area Min (sq.ft)</label>
                  <input className="a-input" type="number" value={form.area_sqft_min} onChange={e=>f("area_sqft_min",e.target.value)} placeholder="e.g. 1740" />
                </div>
                <div className="f-group">
                  <label className="f-label">Area Max (sq.ft)</label>
                  <input className="a-input" type="number" value={form.area_sqft_max} onChange={e=>f("area_sqft_max",e.target.value)} placeholder="e.g. 3120" />
                </div>
                <div className="f-group fg-full">
                  <label className="f-label">Location Details</label>
                  <input className="a-input" value={form.location_details||""} onChange={e=>f("location_details",e.target.value)}
                    placeholder="e.g. Sector 18, Yamuna Expressway near Jewar Airport" />
                </div>
                <div className="f-group fg-full">
                  <label className="f-label">Apply URL</label>
                  <input className="a-input" type="url" value={form.apply_url||""} onChange={e=>f("apply_url",e.target.value)}
                    placeholder="https://authority.gov.in/apply" />
                </div>
                <div className="f-group fg-full">
                  <label className="f-label">Source URL</label>
                  <input className="a-input" type="url" value={form.source_url||""} onChange={e=>f("source_url",e.target.value)}
                    placeholder="https://authority.gov.in" />
                </div>
                <div className="f-group fg-full">
                  <label className="f-label">Admin Notes (internal only)</label>
                  <textarea className="a-textarea" value={form.manual_notes||""} onChange={e=>f("manual_notes",e.target.value)}
                    placeholder="Notes about manual changes…" rows={2} />
                </div>
                <div className="f-group" style={{flexDirection:"row",alignItems:"center",gap:10}}>
                  <label className="f-label" style={{marginBottom:0}}>Show on Frontend</label>
                  <label className="toggle">
                    <input type="checkbox" checked={form.is_active} onChange={e=>f("is_active",e.target.checked)} />
                    <span className="slider" />
                  </label>
                </div>
              </div>

              {saveErr && <div className="err-msg">⚠ {saveErr}</div>}
              {saveOk  && <div className="ok-msg">✓ {saveOk}</div>}

              <div className="modal-actions">
                <button className="btn-s" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn-p" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : modal==="new" ? "Create Scheme" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .ctrl-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
          .total-ct { margin-left:auto; font-size:12px; color:rgba(255,255,255,0.3); font-weight:600; }
          .s-name { font-size:13px; font-weight:600; color:rgba(255,255,255,0.82); line-height:1.35; margin-bottom:2px; max-width:280px; }
          .s-id { font-size:10.5px; color:rgba(255,255,255,0.28); font-family:monospace; }
          .fg { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
          .fg-full { grid-column:1/-1; }
        `}</style>
      </AdminLayout>
    </>
  );
}
