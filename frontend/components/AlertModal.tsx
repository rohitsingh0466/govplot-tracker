import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../lib/AuthContext";
import AuthModal from "./AuthModal";
import BrandLoader from "./BrandLoader";
import { withMinimumLoader } from "../lib/uiLoading";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CITIES = [
  "All Cities",
  // UP
  "Lucknow","Kanpur","Agra","Varanasi","Prayagraj","Meerut","Ghaziabad","Noida",
  "Aligarh","Mathura","Bareilly","Gorakhpur","Jhansi","Moradabad",
  // Delhi
  "Delhi",
  // Maharashtra
  "Mumbai","Navi Mumbai","Pune","Nagpur","Nashik","Aurangabad","Thane",
  "Kolhapur","Solapur","Amravati","Kalyan","Vasai","Panvel","Latur","Nanded",
  // Karnataka
  "Bangalore","Mysuru","Hubballi","Mangalore","Belgaum","Shimoga","Tumkur","Davangere","Gulbarga",
  // Telangana
  "Hyderabad","Warangal","Karimnagar","Nizamabad","Khammam","Mahabubnagar",
  // Tamil Nadu
  "Chennai","Coimbatore","Madurai","Salem","Tiruchirappalli","Vellore","Erode","Tirunelveli","Thoothukudi","Thanjavur","Hosur",
  // Rajasthan
  "Jaipur","Jodhpur","Udaipur","Kota","Ajmer","Bikaner",
  // Gujarat
  "Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Gandhinagar","Jamnagar","Mehsana","Anand","Bharuch",
  // Haryana
  "Gurgaon","Faridabad","Panchkula","Karnal","Rohtak","Hisar","Ambala","Panipat","Sonipat","Rewari","Kurukshetra",
  // MP
  "Indore","Bhopal","Jabalpur",
  // Punjab / Chandigarh
  "Chandigarh","Ludhiana","Amritsar","Jalandhar","Mohali","Patiala","Bathinda","Zirakpur",
  // West Bengal
  "Kolkata","New Town","Durgapur",
  // Andhra Pradesh
  "Visakhapatnam","Vijayawada","Guntur","Tirupati","Nellore","Kakinada","Kurnool","Rajahmundry",
  // Kerala
  "Kochi","Thiruvananthapuram","Kozhikode","Thrissur","Palakkad","Kannur","Kollam","Kottayam",
  // Odisha
  "Bhubaneswar","Cuttack","Sambalpur","Berhampur","Rourkela",
  // Bihar
  "Patna","Muzaffarpur","Gaya","Bhagalpur","Darbhanga",
  // Jharkhand
  "Ranchi","Dhanbad","Jamshedpur","Bokaro","Hazaribagh",
  // CG
  "Raipur","Bhilai","Bilaspur","Korba","Durg",
  // Uttarakhand
  "Dehradun","Haridwar","Haldwani","Roorkee","Rishikesh",
  // Others
  "Panaji","Guwahati","Agartala","Imphal","Shillong",
  "Shimla","Dharamsala","Solan","Baddi",
  "Jammu","Srinagar",
];

export default function AlertModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, token, isPro } = useAuth();
  const [city, setCity] = useState("All Cities");
  const [channel, setChannel] = useState("email");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  const channels = useMemo(() => ([
    { id: "email",    label: "Email",    icon: "📧", desc: "Included for all users", disabled: false, badge: null },
    { id: "telegram", label: "Telegram", icon: "✈️", desc: isPro ? "Available on your plan" : "Pro feature", disabled: !isPro, badge: isPro ? null : "PRO" },
    { id: "whatsapp", label: "WhatsApp", icon: "💬", desc: isPro ? "Available on your plan" : "Pro feature", disabled: !isPro, badge: isPro ? null : "PRO" },
  ]), [isPro]);

  useEffect(() => {
    if (!open) return;
    setError(""); setDone(false);
    if (!isPro) setChannel("email");
  }, [open, isPro]);

  if (!open) return null;

  async function submit() {
    if (!token || !user) { setAuthOpen(true); return; }
    setLoading(true); setError("");
    try {
      await withMinimumLoader(
        axios.post(`${API}/api/v1/alerts/subscribe`,
          { city: city === "All Cities" ? null : city, channel },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not save your alert subscription.");
    } finally { setLoading(false); }
  }

  function handleClose() {
    setDone(false); setError(""); setCity("All Cities");
    setChannel("email"); setAuthOpen(false); onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[--ink-900]/60 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-md bg-white rounded-[--r-2xl] overflow-hidden shadow-[--shadow-xl]">
          <div className="bg-gradient-to-br from-[--teal-700] to-[--teal-900] p-7 relative">
            <button onClick={handleClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition">✕</button>
            <div className="text-3xl mb-2">🔔</div>
            <h2 className="text-[22px] font-[Outfit] font-800 text-white mb-1">Get Scheme Alerts</h2>
            <p className="text-[13px] text-[--teal-300]">
              {user ? "Manage alerts for your signed-in account." : "Sign in first, then save alerts to your dashboard."}
            </p>
          </div>

          <div className="relative p-6">
            {loading && <BrandLoader overlay compact label="Saving your alert..." />}
            {!user ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🔐</div>
                <h3 className="text-[20px] font-[Outfit] font-800 text-[--ink-900] mb-2">Sign in required</h3>
                <p className="text-[13.5px] text-[--ink-600] mb-6 leading-relaxed">Free alerts require an account. Continue with Google to subscribe.</p>
                <button onClick={() => setAuthOpen(true)} className="btn-primary w-full justify-center text-[14px] py-3" style={{ fontFamily: "var(--font-display)" }}>Continue to Sign In</button>
              </div>
            ) : !done ? (
              <>
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input type="email" value={user.email || ""} readOnly className="input-field bg-[--ink-50] text-[--ink-500] cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">City (100+ available)</label>
                    <select value={city} onChange={e => setCity(e.target.value)} className="input-field">
                      {CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[--ink-600] mb-2 uppercase tracking-wider">Notification Channel</label>
                    <div className="grid grid-cols-3 gap-2">
                      {channels.map(ch => (
                        <button key={ch.id} onClick={() => !ch.disabled && setChannel(ch.id)}
                          className={`relative rounded-xl p-3 border-[1.5px] text-center transition-all ${channel === ch.id ? "border-[--teal-500] bg-[--teal-100]/60 text-[--teal-700]" : ch.disabled ? "border-[--ink-100] bg-[--ink-50] opacity-60 cursor-not-allowed" : "border-[--ink-200] hover:border-[--teal-300] text-[--ink-700]"}`}
                          disabled={ch.disabled}>
                          <div className="text-xl mb-1">{ch.icon}</div>
                          <div className="text-[11px] font-bold">{ch.label}</div>
                          <div className="text-[10px] text-[--ink-400]">{ch.desc}</div>
                          {ch.badge && <span className="absolute -top-2 -right-2 text-[9px] bg-[--saffron-500] text-white px-1.5 py-0.5 rounded-full font-bold">{ch.badge}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700">{error}</div>}
                <button onClick={submit} disabled={loading} className="btn-primary w-full justify-center text-[14px] py-3" style={{ fontFamily: "var(--font-display)" }}>
                  {loading ? "Saving alert..." : "Save Alert Subscription →"}
                </button>
                <p className="text-[11px] text-[--ink-400] text-center mt-3">Free users: email alerts. Telegram and WhatsApp unlock on Pro.</p>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-[20px] font-[Outfit] font-800 text-[--ink-900] mb-2">Alert saved</h3>
                <p className="text-[13.5px] text-[--ink-600] mb-6">
                  We will send <strong>{channels.find(c => c.id === channel)?.label}</strong> alerts
                  {city !== "All Cities" ? ` for ${city}` : " for all cities"} to <strong>{user.email}</strong>.
                </p>
                <button onClick={handleClose} className="btn-primary text-[13px] py-2.5 px-8" style={{ fontFamily: "var(--font-display)" }}>Done ✓</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} returnAction="open-alert" />
    </>
  );
}
