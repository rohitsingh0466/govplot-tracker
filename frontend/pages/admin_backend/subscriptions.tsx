import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CHANNELS = [
  {
    key: "email",
    icon: "📧",
    name: "Email Alerts",
    sub: "notifications.email",
    desc: "Email alerts sent via SendGrid when new matching schemes open.",
    defaultText: "Email alerts — coming soon",
  },
  {
    key: "telegram",
    icon: "✈️",
    name: "Telegram Alerts",
    sub: "notifications.telegram",
    desc: "Telegram bot notifications for scheme alerts.",
    defaultText: "Telegram alerts — coming soon",
  },
  {
    key: "whatsapp",
    icon: "💬",
    name: "WhatsApp Alerts",
    sub: "notifications.whatsapp",
    desc: "WhatsApp alerts via Twilio for Premium tier users.",
    defaultText: "WhatsApp alerts — Coming Soon",
  },
  {
    key: "sms",
    icon: "📱",
    name: "SMS Alerts",
    sub: "notifications.sms",
    desc: "SMS alerts via Twilio. Charged per message.",
    defaultText: "SMS alerts — Coming Soon",
  },
];

interface ChannelState {
  enabled: boolean;
  coming_soon_text: string;
}

export default function AdminSubscriptions() {
  const router = useRouter();
  const [channels, setChannels] = useState<Record<string, ChannelState>>({});
  const [loading, setLoading] = useState(true);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("govplot_admin_token");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/data/feature-flags`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.status === 401) { router.replace("/admin_backend/login"); return; }
      const d = await res.json();
      // Build channel state from feature flags
      const cs: Record<string, ChannelState> = {};
      for (const ch of CHANNELS) {
        const flag = d.flags?.find((f: any) => f.key === ch.sub);
        cs[ch.key] = {
          enabled: flag?.enabled ?? false,
          coming_soon_text: flag?.coming_soon_text ?? ch.defaultText,
        };
      }
      setChannels(cs);
    } catch {
      // If endpoint doesn't exist yet, use defaults
      const cs: Record<string, ChannelState> = {};
      for (const ch of CHANNELS) {
        cs[ch.key] = { enabled: false, coming_soon_text: ch.defaultText };
      }
      setChannels(cs);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleChannel(key: string) {
    const cur = channels[key];
    const next = { ...cur, enabled: !cur.enabled };
    setChannels(prev => ({ ...prev, [key]: next }));
    try {
      const ch = CHANNELS.find(c => c.key === key)!;
      await fetch(`${API}/api/v1/admin/data/feature-flags/${ch.sub}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next.enabled }),
      });
    } catch { /* revert on error */ load(); }
  }

  async function saveText() {
    if (!editKey) return;
    setSaving(true);
    const ch = CHANNELS.find(c => c.key === editKey)!;
    try {
      await fetch(`${API}/api/v1/admin/data/feature-flags/${ch.sub}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ coming_soon_text: editText }),
      });
      setChannels(prev => ({ ...prev, [editKey]: { ...prev[editKey], coming_soon_text: editText } }));
    } catch {}
    setSaving(false);
    setEditKey(null);
  }

  return (
    <>
      <Head><title>Subscriptions — GovPlot Admin</title></Head>
      <AdminLayout title="Notification Subscriptions">

        <style>{`
          .sec-title { font-family:'Outfit',system-ui,sans-serif; font-size:20px; font-weight:800; color:var(--text-heading); margin-bottom:4px; }
          .sec-desc  { font-size:13.5px; color:var(--text-muted); margin-bottom:20px; line-height:1.6; }
          .ch-grid   { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px; }
          .ch-card   {
            background:var(--bg-card); border:1px solid var(--border);
            border-radius:14px; padding:18px 16px;
            display:flex; flex-direction:column; gap:10px;
            transition: background 0.25s, border-color 0.25s;
          }
          .ch-card.enabled  { border-top:3px solid #0d7a68; }
          .ch-card.disabled { border-top:3px solid #475569; }
          .ch-head   { display:flex; align-items:center; justify-content:space-between; gap:8px; }
          .ch-meta   { display:flex; flex-direction:column; gap:2px; }
          .ch-name   { font-size:14px; font-weight:700; color:var(--text-heading); }
          .ch-sub    { font-size:10.5px; color:var(--text-muted); font-family:monospace; }
          .ch-icon   { font-size:22px; }
          .ch-status-row { display:flex; align-items:center; gap:7px; }
          .ch-dot    { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
          .dot-on    { background:#16a34a; }
          .dot-off   { background:#dc2626; }
          .ch-status-txt { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; }
          .status-on  { color:#16a34a; }
          .status-off { color:#dc2626; }
          .ch-desc   { font-size:12.5px; color:var(--text-muted); line-height:1.5; }
          .cs-box    {
            background:var(--fc-cs-bg); border:1px solid var(--fc-cs-border);
            border-radius:8px; padding:10px 12px;
          }
          .cs-label  { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--fc-cs-label); margin-bottom:5px; }
          .cs-row    { display:flex; align-items:center; justify-content:space-between; gap:8px; }
          .cs-text   { font-size:12px; color:var(--cs-text-color); flex:1; }
          .cs-edit   { font-size:11px; color:#0d7a68; font-weight:700; background:none; border:none; padding:0; cursor:pointer; }
          .cs-edit:hover { opacity:0.75; }
          .info-box  {
            background:var(--bg-card); border:1px solid var(--border);
            border-radius:14px; padding:20px 22px;
            margin-top:4px;
          }
          .info-title { font-size:14px; font-weight:700; color:var(--ib-title-color); margin-bottom:12px; }
          .info-list  { display:flex; flex-direction:column; gap:8px; }
          .info-item  { font-size:13px; color:var(--ib-text-color); line-height:1.5; }
          .info-item strong { color:var(--text-heading); }
          .info-code  { font-family:monospace; font-size:11.5px; background:var(--code-bg); color:var(--code-color); padding:2px 6px; border-radius:4px; }
          .codes-row  { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
        `}</style>

        {/* Header */}
        <h2 className="sec-title">Notification Channels</h2>
        <p className="sec-desc">
          Control which alert channels are active on the platform. Disabling a channel hides it from users and
          stops dispatching — existing subscriptions are preserved in the DB.
        </p>

        {/* Channel cards */}
        {loading ? (
          <div className="spin-row"><span className="spin-ico">⟳</span> Loading channels…</div>
        ) : (
          <div className="ch-grid">
            {CHANNELS.map(ch => {
              const state = channels[ch.key] || { enabled: false, coming_soon_text: ch.defaultText };
              return (
                <div key={ch.key} className={`ch-card ${state.enabled ? "enabled" : "disabled"}`}>
                  {/* Header row */}
                  <div className="ch-head">
                    <div>
                      <div className="ch-name">{ch.name}</div>
                      <div className="ch-sub">{ch.sub}</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={state.enabled} onChange={() => toggleChannel(ch.key)} />
                      <span className="slider" />
                    </label>
                  </div>

                  {/* Status */}
                  <div className="ch-status-row">
                    <div className={`ch-dot ${state.enabled ? "dot-on" : "dot-off"}`} />
                    <span className={`ch-status-txt ${state.enabled ? "status-on" : "status-off"}`}>
                      {state.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="ch-desc">{ch.desc}</div>

                  {/* Coming soon text */}
                  <div className="cs-box">
                    <div className="cs-label">Coming Soon Text Shown to Users:</div>
                    <div className="cs-row">
                      <span className="cs-text">{state.coming_soon_text}</span>
                      <button className="cs-edit" onClick={() => { setEditKey(ch.key); setEditText(state.coming_soon_text); }}>
                        ✏ Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How feature flags work */}
        <div className="info-box">
          <div className="info-title">ℹ How feature flags work</div>
          <div className="info-list">
            <div className="info-item"><strong>Enabled</strong> — channel shown to users, alerts dispatched (requires env vars set on Railway)</div>
            <div className="info-item"><strong>Disabled</strong> — frontend shows "Coming Soon" badge; alert dispatch skips this channel</div>
            <div className="info-item"><strong>Coming soon text</strong> — shown on the user-facing subscription page when the channel is disabled</div>
            <div className="info-item">
              <strong>Required env vars: </strong>
              <div className="codes-row">
                {["SENDGRID_API_KEY", "TWILIO_SID", "TWILIO_TOKEN", "TELEGRAM_BOT_TOKEN"].map(v => (
                  <span key={v} className="info-code">{v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit coming-soon text modal */}
        {editKey && (
          <div className="modal-bg">
            <div className="modal" style={{ maxWidth: 480 }}>
              <h2 className="modal-h">✏ Edit Coming Soon Text</h2>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14 }}>
                Channel: <strong style={{ color: "var(--text-heading)" }}>
                  {CHANNELS.find(c => c.key === editKey)?.name}
                </strong>
              </p>
              <div className="f-group">
                <label className="f-label">Text shown to users when disabled</label>
                <input
                  className="a-input"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  placeholder="e.g. Email alerts — coming soon"
                />
              </div>
              <div className="modal-actions">
                <button className="btn-s" onClick={() => setEditKey(null)}>Cancel</button>
                <button className="btn-p" onClick={saveText} disabled={saving}>
                  {saving ? "Saving…" : "Save Text"}
                </button>
              </div>
            </div>
          </div>
        )}

      </AdminLayout>
    </>
  );
}
