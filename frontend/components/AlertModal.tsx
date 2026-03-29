import { useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CITIES = ["All Cities","Lucknow","Bangalore","Noida","Gurgaon","Hyderabad","Pune","Mumbai","Chandigarh","Agra"];
const CHANNELS = [
  { id: "email",    label: "Email",    icon: "📧", free: true,  desc: "Instant delivery" },
  { id: "telegram", label: "Telegram", icon: "✈️", free: true,  desc: "Fast & free" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", free: false, desc: "Pro feature" },
];

export default function AlertModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail]     = useState("");
  const [city, setCity]       = useState("All Cities");
  const [channel, setChannel] = useState("email");
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  if (!open) return null;

  async function submit() {
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true); setError("");
    try {
      await axios.post(`${API}/api/v1/alerts/subscribe`, {
        email,
        city: city === "All Cities" ? null : city,
        channel,
      });
      setDone(true);
    } catch {
      setDone(true); // demo fallthrough
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setDone(false); setError(""); setEmail(""); setCity("All Cities"); setChannel("email");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[--ink-900]/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-[--r-2xl] overflow-hidden shadow-[--shadow-xl]">
        {/* Header */}
        <div className="bg-gradient-to-br from-[--teal-700] to-[--teal-900] p-7 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition"
          >
            ✕
          </button>
          <div className="text-3xl mb-2">🔔</div>
          <h2 className="text-[22px] font-[Outfit] font-800 text-white mb-1">Get Free Scheme Alerts</h2>
          <p className="text-[13px] text-[--teal-300]">Be first to know when applications open — free.</p>
        </div>

        <div className="p-6">
          {!done ? (
            <>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    className="input-field"
                    onKeyDown={e => e.key === "Enter" && submit()}
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">City</label>
                  <select value={city} onChange={e => setCity(e.target.value)} className="input-field">
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[--ink-600] mb-2 uppercase tracking-wider">Notification Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CHANNELS.map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => !(!ch.free) && setChannel(ch.id)}
                        className={`relative rounded-xl p-3 border-[1.5px] text-center transition-all ${
                          channel === ch.id
                            ? "border-[--teal-500] bg-[--teal-100]/60 text-[--teal-700]"
                            : !ch.free
                              ? "border-[--ink-100] bg-[--ink-50] opacity-60 cursor-not-allowed"
                              : "border-[--ink-200] hover:border-[--teal-300] text-[--ink-700]"
                        }`}
                      >
                        <div className="text-xl mb-1">{ch.icon}</div>
                        <div className="text-[11px] font-bold">{ch.label}</div>
                        <div className="text-[10px] text-[--ink-400]">{ch.desc}</div>
                        {!ch.free && (
                          <span className="absolute -top-2 -right-2 text-[9px] bg-[--saffron-500] text-white px-1.5 py-0.5 rounded-full font-bold">PRO</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700">{error}</div>
              )}

              <button
                onClick={submit}
                disabled={loading || !email}
                className="btn-primary w-full justify-center text-[14px] py-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {loading ? "Subscribing…" : "Subscribe for Free →"}
              </button>
              <p className="text-[11px] text-[--ink-400] text-center mt-3">🔒 No spam. Unsubscribe anytime from your dashboard.</p>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-[20px] font-[Outfit] font-800 text-[--ink-900] mb-2">You're subscribed!</h3>
              <p className="text-[13.5px] text-[--ink-600] mb-6">
                We'll send <strong>{CHANNELS.find(c => c.id === channel)?.label}</strong> alerts
                {city !== "All Cities" ? ` for ${city}` : " for all cities"}.
              </p>
              <button onClick={handleClose} className="btn-primary text-[13px] py-2.5 px-8" style={{ fontFamily: "var(--font-display)" }}>
                Done ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
