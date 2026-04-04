import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TelegramLinkModal from "../components/TelegramLinkModal";
import ProfileEditModal from "../components/ProfileEditModal";
import ProUpgradeModal from "../components/ProUpgradeModal";
import BrandLoader from "../components/BrandLoader";
import { withMinimumLoader } from "../lib/uiLoading";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AuthUser = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  is_premium: boolean;
  subscription_tier: string;
  subscription_status: string;
  telegram_username?: string | null;
  phone?: string | null;
  capabilities?: string[];
  max_alert_cities?: number;
};

type AlertItem = {
  id: number;
  city?: string | null;
  authority?: string | null;
  channel: string;
};

const CITIES = [
  "Delhi", "Mumbai", "Navi Mumbai", "Pune", "Bangalore", "Hyderabad", "Chennai",
  "Jaipur", "Lucknow", "Noida", "Gurgaon", "Ahmedabad", "Indore", "Chandigarh",
  "Kolkata", "Bhubaneswar", "Patna", "Ranchi", "Raipur", "Dehradun",
  "Visakhapatnam", "Kochi", "Nagpur", "Surat", "Vadodara", "Jodhpur",
];

const CHANNELS = [
  { id: "email", label: "Email", icon: "📧", tiers: ["pro", "premium"] },
  { id: "telegram", label: "Telegram", icon: "✈️", tiers: ["pro", "premium"] },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", tiers: ["premium"] },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Alert subscription form state
  const [alertCity, setAlertCity] = useState(CITIES[0]);
  const [alertChannel, setAlertChannel] = useState("email");
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertError, setAlertError] = useState("");
  const [alertSuccess, setAlertSuccess] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("govplot_auth_user");
    const token = localStorage.getItem("govplot_auth_token");
    if (!raw || !token) { router.push("/auth?next=/dashboard"); return; }
    const parsedUser: AuthUser = JSON.parse(raw);
    setUser(parsedUser);
    loadAlerts(token);
  }, [router]);

  async function loadAlerts(token: string) {
    try {
      const { data } = await withMinimumLoader(
        axios.get<AlertItem[]>(`${API}/api/v1/alerts/my`, { headers: { Authorization: `Bearer ${token}` } })
      );
      setAlerts(data);
    } catch { setAlerts([]); }
    finally { setLoading(false); }
  }

  async function removeAlert(id: number) {
    const token = localStorage.getItem("govplot_auth_token");
    if (!token) return;
    try {
      setLoading(true);
      await axios.delete(`${API}/api/v1/alerts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAlerts(prev => prev.filter(a => a.id !== id));
    } finally { setLoading(false); }
  }

  async function addAlert() {
    const token = localStorage.getItem("govplot_auth_token");
    if (!token) return;
    setAlertLoading(true); setAlertError(""); setAlertSuccess("");
    try {
      const { data } = await axios.post<AlertItem>(
        `${API}/api/v1/alerts/subscribe`,
        { city: alertCity, channel: alertChannel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlerts(prev => [...prev.filter(a => a.id !== data.id), data]);
      setAlertSuccess(`✅ Alert added for ${alertCity} via ${alertChannel}`);
    } catch (err: any) {
      setAlertError(err?.response?.data?.detail || "Could not add alert subscription.");
    } finally { setAlertLoading(false); }
  }

  if (loading || !user) return <BrandLoader fullScreen label="Loading your dashboard..." />;

  const displayName = user.first_name || user.name?.split(" ")[0] || user.email;
  const fullName = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.name || user.email;
  const tier = user.subscription_tier || "free";
  const isPro = tier === "pro";
  const isPremium = tier === "premium";
  const isPaid = isPro || isPremium;

  const maxCities = user.max_alert_cities ?? (isPremium ? 999 : isPro ? 2 : 0);

  const TIER_COLORS: Record<string, string> = {
    free: "bg-[--ink-100] text-[--ink-600]",
    pro: "bg-[--teal-100] text-[--teal-700]",
    premium: "bg-[--saffron-100] text-[--saffron-600]",
  };

  const availableChannels = CHANNELS.filter(ch => ch.tiers.includes(tier));

  return (
    <>
      <Head><title>Dashboard — GovPlot Tracker</title></Head>
      <Navbar />

      <div className="page-container page-top-offset pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-[32px] font-[Outfit] font-900 text-[--ink-900]">Welcome back, {displayName} 👋</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="flex flex-col gap-5">
              {/* Profile card */}
              <div className="card p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[--teal-500] to-[--teal-700] flex items-center justify-center text-white text-2xl font-[Outfit] font-800 shadow-[--shadow-teal]">
                      {displayName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-[16px] font-[Outfit] font-700 text-[--ink-900]">{fullName}</h2>
                      <p className="text-[12.5px] text-[--ink-500] mt-1">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3.5 border-t border-[--ink-100]">
                  <span className="text-[12.5px] text-[--ink-600]">Plan</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${TIER_COLORS[tier] || TIER_COLORS.free}`}>{tier}</span>
                </div>
                <div className="flex items-center justify-between py-3.5 border-t border-[--ink-100]">
                  <span className="text-[12.5px] text-[--ink-600]">Mobile</span>
                  <span className="text-[12.5px] font-medium text-[--ink-800]">{user.phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-3.5 border-t border-[--ink-100]">
                  <span className="text-[12.5px] text-[--ink-600]">Alert Cities</span>
                  <span className="text-[12.5px] font-medium text-[--ink-800]">
                    {isPaid ? (isPremium ? "Unlimited" : `${alerts.length} / ${maxCities}`) : "Upgrade required"}
                  </span>
                </div>

                <button onClick={() => setProfileOpen(true)} className="btn-ghost w-full justify-center text-[12px] py-2.5 mt-4 border border-[--ink-200]">Edit Profile</button>
                {!isPaid && (
                  <button onClick={() => setUpgradeOpen(true)} className="btn-saffron w-full justify-center text-[13px] py-2.5 mt-3">✦ Upgrade to Pro</button>
                )}
              </div>

              {/* Telegram card */}
              <div className="card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-2xl">✈️</div>
                  <div>
                    <h3 className="text-[14px] font-[Outfit] font-700 text-[--ink-900] mb-0.5">Telegram Alerts</h3>
                    <p className="text-[12px] text-[--ink-500]">
                      {isPaid
                        ? (user.telegram_username
                            ? `Connected as @${user.telegram_username}`
                            : "Available on your plan — link your bot below")
                        : "Pro / Premium only"}
                    </p>
                  </div>
                </div>

                {isPaid ? (
                  user.telegram_username ? (
                    <div className="bg-[--teal-100] text-[--teal-700] text-[12px] font-semibold px-3 py-2 rounded-xl text-center">
                      ✓ Telegram connected — alerts will be delivered
                    </div>
                  ) : (
                    <>
                      {/* Warning: telegram alerts subscribed but bot not linked */}
                      {alerts.some(a => a.channel === "telegram") && (
                        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <p className="text-[11.5px] text-amber-700 font-semibold mb-1">⚠️ Action required</p>
                          <p className="text-[11px] text-amber-600 leading-relaxed">
                            You have {alerts.filter(a => a.channel === "telegram").length} Telegram alert(s) subscribed
                            but your Telegram account is not linked. These alerts will <strong>not be delivered</strong> until you connect the bot below.
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => setTelegramOpen(true)}
                        className="btn-secondary w-full justify-center text-[13px] py-2"
                      >
                        Connect Telegram Bot →
                      </button>
                      <p className="text-[10.5px] text-[--ink-400] text-center mt-2">
                        Takes 30 seconds · Open bot, tap Start
                      </p>
                    </>
                  )
                ) : (
                  <button onClick={() => setUpgradeOpen(true)} className="btn-ghost w-full justify-center text-[12px] py-2 border border-[--ink-200] text-[--saffron-600]">
                    Upgrade to enable
                  </button>
                )}
              </div>

              {/* WhatsApp card */}
              {isPremium && (
                <div className="card p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-2xl">💬</div>
                    <div>
                      <h3 className="text-[14px] font-[Outfit] font-700 text-[--ink-900] mb-0.5">WhatsApp Alerts</h3>
                      <p className="text-[12px] text-[--ink-500]">{user.phone ? "Ready when delivery is enabled" : "Add mobile number first"}</p>
                    </div>
                  </div>
                  <button disabled className="btn-secondary w-full justify-center text-[13px] py-2 opacity-70 cursor-not-allowed">
                    {user.phone ? "Coming soon" : "Add mobile number first"}
                  </button>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Alert subscriptions */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[18px] font-[Outfit] font-700 text-[--ink-900]">My Alert Subscriptions</h2>
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-[--ink-50] border border-[--ink-100] text-[--ink-500] px-3 py-1 rounded-full">
                    {alerts.length}{isPaid && !isPremium ? ` / ${maxCities}` : ""} active
                  </span>
                </div>

                {/* Alert form — only for pro/premium */}
                {isPaid ? (
                  <div className="bg-[--ink-50] rounded-2xl border border-[--ink-100] p-5 mb-5">
                    <h3 className="text-[13px] font-[Outfit] font-700 text-[--ink-900] mb-3">Add New Alert</h3>
                    <div className="grid sm:grid-cols-3 gap-3 mb-3">
                      <select value={alertCity} onChange={e => setAlertCity(e.target.value)} className="input-field text-[13px]">
                        {CITIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <select value={alertChannel} onChange={e => setAlertChannel(e.target.value)} className="input-field text-[13px]">
                        {availableChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.icon} {ch.label}</option>)}
                      </select>
                      <button onClick={addAlert} disabled={alertLoading} className="btn-primary text-[13px] py-2.5 justify-center" style={{ fontFamily: "var(--font-display)" }}>
                        {alertLoading ? "Adding..." : "+ Add Alert"}
                      </button>
                    </div>
                    {alertError && <p className="text-[12px] text-red-600 mt-1">{alertError}</p>}
                    {alertSuccess && <p className="text-[12px] text-[--teal-700] mt-1">{alertSuccess}</p>}
                    {isPro && maxCities > 0 && (
                      <p className="text-[11.5px] text-[--ink-500]">
                        Pro plan: {alerts.length}/{maxCities} cities used.{" "}
                        <button onClick={() => setUpgradeOpen(true)} className="text-[--saffron-600] font-semibold underline">Upgrade to Premium for unlimited.</button>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-[--saffron-100]/50 border border-[--saffron-200]/60 rounded-2xl p-5 mb-5 text-center">
                    <p className="text-[13.5px] font-[Outfit] font-700 text-[--ink-900] mb-2">Upgrade to stay updated with active scheme alerts</p>
                    <p className="text-[12.5px] text-[--ink-600] mb-4">Pro plan: Email + Telegram for up to 2 cities. Premium: unlimited cities + WhatsApp.</p>
                    <button onClick={() => setUpgradeOpen(true)} className="btn-saffron text-[13px] py-2.5 px-6">✦ Upgrade Now →</button>
                  </div>
                )}

                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🔔</div>
                    <p className="text-[--ink-600] font-medium mb-2">No alert subscriptions yet</p>
                    {isPaid && <p className="text-[12px] text-[--ink-500]">Add your first city alert above.</p>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-4 bg-[--ink-50] rounded-2xl border border-[--ink-100]">
                        <div>
                          <p className="text-[13.5px] font-semibold text-[--ink-900]">{a.city || "All cities"} · {a.authority || "All authorities"}</p>
                          <p className="text-[11.5px] text-[--ink-500] mt-0.5">{a.channel} · Active</p>
                        </div>
                        <button onClick={() => removeAlert(a.id)} className="text-[12px] text-red-500 hover:text-red-700 font-semibold transition px-3 py-1 rounded-lg hover:bg-red-50">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Billing */}
              <div className="card p-6">
                <h2 className="text-[18px] font-[Outfit] font-700 text-[--ink-900] mb-5">Billing &amp; Subscription</h2>
                {tier === "free" ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <p className="text-[13.5px] text-[--ink-600] leading-relaxed flex-1">
                      You are on the <strong>Free plan</strong>. Upgrade to Pro to unlock city alerts and stay informed when a scheme opens.
                    </p>
                    <button onClick={() => setUpgradeOpen(true)} className="btn-saffron flex-shrink-0 text-[13px] py-2.5 px-6">Upgrade Now →</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between p-4 bg-[--teal-100]/40 rounded-2xl border border-[--teal-200]/50">
                      <div>
                        <p className="text-[13.5px] font-semibold text-[--ink-900]">{isPremium ? "Premium Plan" : "Pro Monthly"}</p>
                        <p className="text-[12px] text-[--ink-500] mt-2">Status: {user.subscription_status || "active"}</p>
                      </div>
                      <span className={`font-bold text-[12px] px-3 py-1 rounded-full h-fit ${TIER_COLORS[tier]}`}>{tier.toUpperCase()}</span>
                    </div>
                    {!isPremium && (
                      <button onClick={() => setUpgradeOpen(true)} className="btn-saffron w-full justify-center text-[13px]">✦ Upgrade to Premium</button>
                    )}
                    <button className="btn-ghost text-[13px] text-red-500 hover:text-red-700 hover:bg-red-50 w-full justify-center">Cancel subscription</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <TelegramLinkModal open={telegramOpen} onClose={() => setTelegramOpen(false)} onLinked={(u) => setUser(u as AuthUser)} />
      <ProfileEditModal open={profileOpen} user={user} onClose={() => setProfileOpen(false)} onUpdated={setUser} />
      <ProUpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onUpgraded={(u) => setUser(u as AuthUser)} initialPlan={isPro ? "premium_monthly" : "pro_monthly"} />
    </>
  );
}
