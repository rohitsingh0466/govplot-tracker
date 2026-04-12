import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CHANNEL_META: Record<string, { icon: string; desc: string; color: string }> = {
  "notifications.email":    { icon:"📧", desc:"Email alerts sent via SendGrid when new matching schemes open.", color:"#0ea5e9" },
  "notifications.telegram": { icon:"✈️", desc:"Telegram bot notifications for scheme alerts.", color:"#229ED9" },
  "notifications.whatsapp": { icon:"💬", desc:"WhatsApp alerts via Twilio for Premium tier users.", color:"#25d366" },
  "notifications.sms":      { icon:"📱", desc:"SMS alerts via Twilio. Charged per message.", color:"#8b5cf6" },
};

export default function AdminSubscriptions() {
  const router = useRouter();
  const [flags, setFlags]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<string|null>(null);
  const [editing, setEditing] = useState<string|null>(null);
  const [editText, setEditText] = useState("");
  const [msg, setMsg]           = useState<{key:string;ok:boolean;text:string}|null>(null);

  const token = () => localStorage.getItem("govplot_admin_token");

  async function load() {
    setLoading(true);
    const res = await fetch(`${API}/api/v1/admin/data/feature-flags`,
      { headers: { Authorization: `Bearer ${token()}` } });
    if (res.status === 401) { router.replace("/admin_backend/login"); return; }
    setFlags(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(flag: any) {
    setSaving(flag.flag_key); setMsg(null);
    try {
      const res = await fetch(`${API}/api/v1/admin/data/feature-flags/${flag.flag_key}`, {
        method:"PATCH",
        headers:{ Authorization:`Bearer ${token()}`, "Content-Type":"application/json" },
        body: JSON.stringify({ is_enabled: !flag.is_enabled }),
      });
      if (!res.ok) { setMsg({ key:flag.flag_key, ok:false, text:"Failed to update" }); return; }
      setMsg({ key:flag.flag_key, ok:true, text:`${flag.flag_label} ${!flag.is_enabled?"enabled":"disabled"} ✓` });
      await load();
    } catch { setMsg({ key:flag.flag_key, ok:false, text:"Network error" }); }
    finally { setSaving(null); }
  }

  async function saveText(flagKey: string) {
    setSaving(flagKey); setMsg(null);
    const flag = flags.find(f => f.flag_key === flagKey);
    try {
      const res = await fetch(`${API}/api/v1/admin/data/feature-flags/${flagKey}`, {
        method:"PATCH",
        headers:{ Authorization:`Bearer ${token()}`, "Content-Type":"application/json" },
        body: JSON.stringify({ is_enabled: flag?.is_enabled ?? false, coming_soon_text: editText }),
      });
      if (!res.ok) { setMsg({ key:flagKey, ok:false, text:"Failed to save text" }); return; }
      setMsg({ key:flagKey, ok:true, text:"Coming soon text updated ✓" });
      setEditing(null); await load();
    } catch { setMsg({ key:flagKey, ok:false, text:"Network error" }); }
    finally { setSaving(null); }
  }

  return (
    <>
      <Head><title>Subscriptions — GovPlot Admin</title></Head>
      <AdminLayout title="Notification Subscriptions">

        <div className="page-intro">
          <h2 className="pi-title">Notification Channels</h2>
          <p className="pi-sub">
            Control which alert channels are active on the platform. Disabling a channel hides it from
            users and stops dispatching — existing subscriptions are preserved in the DB.
          </p>
        </div>

        {loading ? (
          <div className="spin-row"><span className="spin-ico">⟳</span> Loading flags…</div>
        ) : (
          <div className="flag-grid">
            {flags.map(flag => {
              const meta = CHANNEL_META[flag.flag_key] || { icon:"🔔", desc:"", color:"#64748b" };
              const isEditing = editing === flag.flag_key;
              const m = msg?.key === flag.flag_key ? msg : null;

              return (
                <div key={flag.flag_key}
                  className={`flag-card ${flag.is_enabled ? "on" : "off"}`}
                  style={{ borderLeft:`4px solid ${flag.is_enabled ? meta.color : "rgba(255,255,255,0.08)"}` }}>

                  {/* Header row */}
                  <div className="fc-hd">
                    <div className="fc-icon-wrap">
                      <span className="fc-icon">{meta.icon}</span>
                      <div>
                        <div className="fc-name">{flag.flag_label}</div>
                        <div className="fc-key">{flag.flag_key}</div>
                      </div>
                    </div>
                    <div className="fc-toggle-wrap">
                      {saving === flag.flag_key
                        ? <span className="spin-ico" style={{fontSize:16}}>⟳</span>
                        : (
                          <label className="toggle" title={flag.is_enabled ? "Click to disable" : "Click to enable"}>
                            <input type="checkbox" checked={flag.is_enabled} onChange={() => toggle(flag)} />
                            <span className="slider" />
                          </label>
                        )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`badge ${flag.is_enabled ? "bg-green" : "bg-red"}`}
                    style={{fontSize:10, marginBottom:10}}>
                    {flag.is_enabled ? "● Active" : "● Disabled"}
                  </span>

                  {/* Description */}
                  <p className="fc-desc">{meta.desc}</p>

                  {/* Coming soon text */}
                  <div className="fc-cs-row">
                    <span className="fc-cs-label">Coming soon text shown to users:</span>
                    {isEditing ? (
                      <div className="cs-edit">
                        <input className="a-input" style={{fontSize:12.5,padding:"7px 11px"}}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          placeholder="e.g. WhatsApp alerts — Coming Soon"
                        />
                        <div style={{display:"flex",gap:7,marginTop:7}}>
                          <button className="btn-p sm"
                            onClick={() => saveText(flag.flag_key)}
                            disabled={!!saving}>Save</button>
                          <button className="btn-s sm" onClick={() => setEditing(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="cs-display">
                        <span className="cs-text">
                          {flag.coming_soon_text || <em style={{opacity:0.35}}>— not set —</em>}
                        </span>
                        <button className="edit-txt-btn"
                          onClick={() => { setEditing(flag.flag_key); setEditText(flag.coming_soon_text||""); }}>
                          ✏ Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {m && (
                    <p className={m.ok ? "ok-msg" : "err-msg"} style={{marginTop:8,fontSize:12}}>
                      {m.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info panel */}
        <div className="info-box" style={{marginTop:28}}>
          <h3 className="ib-title">ℹ How feature flags work</h3>
          <ul className="ib-list">
            <li><strong>Enabled</strong> — channel shown to users, alerts dispatched (requires env vars set on Railway)</li>
            <li><strong>Disabled</strong> — frontend shows "Coming Soon" badge; alert dispatch skips this channel</li>
            <li><strong>Coming soon text</strong> — shown on the user-facing subscription page when the channel is disabled</li>
            <li>Required env vars: <code>SENDGRID_API_KEY</code>, <code>TWILIO_SID</code>, <code>TWILIO_TOKEN</code>, <code>TELEGRAM_BOT_TOKEN</code></li>
          </ul>
        </div>

        <style jsx>{`
          .page-intro { margin-bottom:24px; }
          .pi-title { font-family:'Outfit',system-ui,sans-serif; font-size:20px; font-weight:800; color:#fff; margin-bottom:6px; }
          .pi-sub { font-size:13.5px; color:rgba(255,255,255,0.4); line-height:1.6; max-width:620px; }

          .flag-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:16px; }
          .flag-card {
            background:rgba(255,255,255,0.03);
            border:1px solid rgba(255,255,255,0.07);
            border-radius:14px; padding:20px;
            transition: background 0.2s;
          }
          .flag-card.on  { background:rgba(255,255,255,0.04); }
          .flag-card.off { opacity:0.72; }

          .fc-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
          .fc-icon-wrap { display:flex; align-items:center; gap:10px; }
          .fc-icon { font-size:26px; }
          .fc-name { font-family:'Outfit',system-ui,sans-serif; font-size:15px; font-weight:800; color:#fff; }
          .fc-key  { font-size:10px; color:rgba(255,255,255,0.28); font-family:monospace; margin-top:1px; }

          .fc-desc { font-size:12.5px; color:rgba(255,255,255,0.42); line-height:1.55; margin-bottom:14px; }

          .fc-cs-row { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:9px; padding:10px 12px; }
          .fc-cs-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.3); display:block; margin-bottom:6px; }
          .cs-display { display:flex; align-items:center; justify-content:space-between; gap:10px; }
          .cs-text { font-size:12.5px; color:rgba(255,255,255,0.55); font-style:normal; }
          .edit-txt-btn { background:none; border:none; color:rgba(255,255,255,0.3); font-size:11px; cursor:pointer; padding:0; transition:color 0.15s; }
          .edit-txt-btn:hover { color:#34d9bc; }
          .cs-edit { }

          .info-box {
            background:rgba(255,255,255,0.025);
            border:1px solid rgba(255,255,255,0.07);
            border-radius:12px; padding:18px 20px;
          }
          .ib-title { font-size:13.5px; font-weight:700; color:rgba(255,255,255,0.6); margin-bottom:10px; }
          .ib-list { list-style:disc; padding-left:18px; display:flex; flex-direction:column; gap:5px; }
          .ib-list li { font-size:12.5px; color:rgba(255,255,255,0.38); line-height:1.5; }
          .ib-list strong { color:rgba(255,255,255,0.65); }
          .ib-list code {
            background:rgba(255,255,255,0.07); padding:1px 6px;
            border-radius:4px; font-family:monospace; font-size:11.5px;
            color:rgba(255,255,255,0.6);
          }
        `}</style>
      </AdminLayout>
    </>
  );
}
