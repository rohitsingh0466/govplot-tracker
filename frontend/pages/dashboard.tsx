import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TelegramLinkModal from "../components/TelegramLinkModal";
import ProfileEditModal from "../components/ProfileEditModal";

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
};

type AlertItem = {
  id: number;
  city?: string | null;
  authority?: string | null;
  channel: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("govplot_auth_user");
    const token = localStorage.getItem("govplot_auth_token");
    if (!raw || !token) {
      router.push("/auth?next=/dashboard");
      return;
    }
    const parsedUser: AuthUser = JSON.parse(raw);
    setUser(parsedUser);
    loadAlerts(token);
  }, [router]);

  async function loadAlerts(token: string) {
    try {
      const { data } = await axios.get<AlertItem[]>(`${API}/api/v1/alerts/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(data);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeAlert(id: number) {
    const token = localStorage.getItem("govplot_auth_token");
    if (!token) return;
    try {
      await axios.delete(`${API}/api/v1/alerts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {}
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[--teal-500] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[--ink-500]">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const displayName = user.first_name || user.name?.split(" ")[0] || user.email;
  const fullName = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.name || user.email;
  const tier = user.subscription_tier || "free";
  const isPaid = tier === "pro" || tier === "premium";
  const TIER_COLORS: Record<string, string> = {
    free: "bg-[--ink-100] text-[--ink-600]",
    pro: "bg-[--teal-100] text-[--teal-700]",
    premium: "bg-[--saffron-100] text-[--saffron-600]",
  };

  return (
    <>
      <Head>
        <title>Dashboard — GovPlot Tracker</title>
      </Head>
      <Navbar />

      <div className="page-container pt-10 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-[32px] font-[Outfit] font-900 text-[--ink-900]">
              Welcome back, {displayName} 👋
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-5">
              <div className="card p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[--teal-500] to-[--teal-700] flex items-center justify-center text-white text-2xl font-[Outfit] font-800 shadow-[--shadow-teal]">
                      {displayName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-[16px] font-[Outfit] font-700 text-[--ink-900]">{fullName}</h2>
                      <p className="text-[12.5px] text-[--ink-500]">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setProfileOpen(true)}
                    className="btn-ghost text-[12px] py-2 px-3 border border-[--ink-200]"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-[--ink-100]">
                  <span className="text-[12.5px] text-[--ink-600]">Plan</span>
                  <span className={`text-[11.5px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${TIER_COLORS[tier] || TIER_COLORS.free}`}>
                    {tier}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-t border-[--ink-100]">
                  <span className="text-[12.5px] text-[--ink-600]">Mobile</span>
                  <span className="text-[12.5px] font-medium text-[--ink-800]">{user.phone || "—"}</span>
                </div>
                {tier === "free" && (
                  <Link href="/pricing" className="btn-saffron w-full justify-center text-[13px] py-2.5 mt-4">
                    Upgrade to Pro
                  </Link>
                )}
              </div>

              <div className="card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-2xl">✈️</div>
                  <div>
                    <h3 className="text-[14px] font-[Outfit] font-700 text-[--ink-900] mb-0.5">Telegram Alerts</h3>
                    <p className="text-[12px] text-[--ink-500]">
                      {isPaid
                        ? (user.telegram_username ? `Connected as @${user.telegram_username}` : "Available on your plan")
                        : "Disabled on Free plan"}
                    </p>
                  </div>
                </div>
                {isPaid ? (
                  user.telegram_username ? (
                    <div className="bg-[--teal-100] text-[--teal-700] text-[12px] font-semibold px-3 py-2 rounded-xl text-center">
                      ✓ Telegram connected
                    </div>
                  ) : (
                    <button onClick={() => setTelegramOpen(true)} className="btn-secondary w-full justify-center text-[13px] py-2">
                      Connect Telegram →
                    </button>
                  )
                ) : (
                  <button disabled className="btn-secondary w-full justify-center text-[13px] py-2 opacity-60 cursor-not-allowed">
                    Pro required
                  </button>
                )}
              </div>

              <div className="card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-2xl">💬</div>
                  <div>
                    <h3 className="text-[14px] font-[Outfit] font-700 text-[--ink-900] mb-0.5">WhatsApp Alerts</h3>
                    <p className="text-[12px] text-[--ink-500]">
                      {isPaid
                        ? (user.phone ? "Ready once WhatsApp delivery is enabled" : "Add your mobile number first")
                        : "Disabled on Free plan"}
                    </p>
                  </div>
                </div>
                {isPaid ? (
                  <button disabled className="btn-secondary w-full justify-center text-[13px] py-2 opacity-70 cursor-not-allowed">
                    {user.phone ? "Coming soon" : "Add mobile number first"}
                  </button>
                ) : (
                  <button disabled className="btn-secondary w-full justify-center text-[13px] py-2 opacity-60 cursor-not-allowed">
                    Pro required
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[18px] font-[Outfit] font-700 text-[--ink-900]">My Alert Subscriptions</h2>
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-[--ink-50] border border-[--ink-100] text-[--ink-500] px-3 py-1 rounded-full">
                    {alerts.length} active
                  </span>
                </div>
                {alerts.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">🔔</div>
                    <p className="text-[--ink-600] font-medium mb-4">No subscriptions yet</p>
                    <Link href="/schemes" className="btn-primary text-[13px] py-2 px-6">
                      Browse Schemes →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-4 bg-[--ink-50] rounded-2xl border border-[--ink-100]">
                        <div>
                          <p className="text-[13.5px] font-semibold text-[--ink-900]">
                            {a.city || "All cities"} · {a.authority || "All authorities"}
                          </p>
                          <p className="text-[11.5px] text-[--ink-500] mt-0.5">{a.channel} · Active</p>
                        </div>
                        <button onClick={() => removeAlert(a.id)} className="text-[12px] text-red-500 hover:text-red-700 font-semibold transition px-3 py-1 rounded-lg hover:bg-red-50">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-6">
                <h2 className="text-[18px] font-[Outfit] font-700 text-[--ink-900] mb-5">Billing & Subscription</h2>
                {tier === "free" ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <p className="text-[13.5px] text-[--ink-600] leading-relaxed">
                        You are on the <strong>Free plan</strong>. Upgrade to Pro to unlock Telegram alerts, WhatsApp readiness, and upcoming premium features.
                      </p>
                    </div>
                    <Link href="/pricing" className="btn-saffron flex-shrink-0 text-[13px] py-2.5 px-6">
                      Upgrade Now →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between p-4 bg-[--teal-100]/40 rounded-2xl border border-[--teal-200]/50">
                      <div>
                        <p className="text-[13.5px] font-semibold text-[--ink-900]">{tier === "premium" ? "Premium Plan" : "Pro Monthly"}</p>
                        <p className="text-[12px] text-[--ink-500]">Status: {user.subscription_status || "active"}</p>
                      </div>
                      <span className={`font-bold text-[12px] px-3 py-1 rounded-full h-fit ${TIER_COLORS[tier]}`}>
                        {tier.toUpperCase()}
                      </span>
                    </div>
                    <button className="btn-ghost text-[13px] text-red-500 hover:text-red-700 hover:bg-red-50 w-full justify-center">
                      Cancel subscription
                    </button>
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
    </>
  );
}
