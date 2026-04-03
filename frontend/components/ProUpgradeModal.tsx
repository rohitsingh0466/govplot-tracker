import { useEffect, useState } from "react";
import Script from "next/script";
import axios from "axios";
import BrandLoader from "./BrandLoader";
import { withMinimumLoader } from "../lib/uiLoading";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type SubscriptionStartResponse = {
  subscription_id: string;
  checkout_key: string;
  plan_code: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill_email: string;
  prefill_name?: string | null;
  prefill_contact?: string | null;
};

type AuthUser = {
  id: number;
  email: string;
  name?: string | null;
  is_premium: boolean;
  subscription_tier: string;
  subscription_status: string;
  telegram_username?: string | null;
  max_alert_cities?: number;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const PLANS = [
  {
    code: "pro_monthly",
    name: "Pro",
    price: "₹99",
    period: "/month",
    tier: "pro",
    color: "from-[--teal-700] to-[--teal-900]",
    features: [
      "All schemes — Open, Active, Upcoming, Closed",
      "Email + Telegram alerts",
      "Up to 2 city subscriptions",
      "Scheme PDF downloads",
    ],
  },
  {
    code: "premium_monthly",
    name: "Premium",
    price: "₹299",
    period: "/month",
    tier: "premium",
    color: "from-[--saffron-500] to-[--saffron-600]",
    features: [
      "Everything in Pro",
      "WhatsApp alerts",
      "Unlimited city subscriptions",
      "Priority scheme intel",
    ],
  },
];

export default function ProUpgradeModal({
  open,
  onClose,
  onUpgraded,
  initialPlan = "pro_monthly",
}: {
  open: boolean;
  onClose: () => void;
  onUpgraded: (user: AuthUser) => void;
  initialPlan?: string;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);

  useEffect(() => {
    if (!open) { setError(""); setLoading(false); }
    else setSelectedPlan(initialPlan);
  }, [open, initialPlan]);

  if (!open) return null;

  async function upgrade() {
    const token = window.localStorage.getItem("govplot_auth_token");
    if (!token) { setError("Please sign in first."); return; }
    if (!scriptReady || !window.Razorpay) { setError("Razorpay checkout is still loading. Please try again."); return; }

    setLoading(true); setError("");

    try {
      const { data } = await withMinimumLoader(
        axios.post<SubscriptionStartResponse>(
          `${API}/api/v1/billing/subscription/start`,
          { plan_code: selectedPlan },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      const razorpay = new window.Razorpay({
        key: data.checkout_key,
        subscription_id: data.subscription_id,
        name: data.name,
        description: data.description,
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          await withMinimumLoader(
            axios.post(`${API}/api/v1/billing/subscription/verify`, response, { headers: { Authorization: `Bearer ${token}` } })
          );
          const me = await withMinimumLoader(
            axios.get<AuthUser>(`${API}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          );
          window.localStorage.setItem("govplot_auth_user", JSON.stringify(me.data));
          window.dispatchEvent(new Event("govplot-auth-changed"));
          onUpgraded(me.data);
          onClose();
        },
        prefill: { name: data.prefill_name || undefined, email: data.prefill_email, contact: data.prefill_contact || undefined },
        theme: { color: "#0d7a68" },
        modal: { ondismiss: () => setLoading(false) },
      });

      razorpay.open();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message || err?.response?.data?.detail || "We could not start the checkout.");
      setLoading(false);
    }
  }

  const plan = PLANS.find(p => p.code === selectedPlan) || PLANS[0];

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[--ink-900]/60 p-4 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-lg overflow-hidden rounded-[--r-2xl] bg-white shadow-[--shadow-xl]">
          {/* Header */}
          <div className={`bg-gradient-to-br ${plan.color} p-8`}>
            <button onClick={onClose} className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition">✕</button>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2">Upgrade GovPlot</p>
            <h2 className="text-[28px] font-[Outfit] font-900 text-white leading-tight">
              Stay updated on active scheme lotteries
            </h2>
            <p className="text-[13px] text-white/75 mt-2">Upgrade to get city alerts, unlimited access and never miss an opening window.</p>
          </div>

          <div className="relative p-7">
            {loading && <BrandLoader overlay compact label="Opening checkout..." />}

            {/* Plan selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PLANS.map(p => (
                <button key={p.code} onClick={() => setSelectedPlan(p.code)}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${selectedPlan === p.code ? "border-[--teal-500] bg-[--teal-100]/40" : "border-[--ink-200] hover:border-[--teal-300]"}`}>
                  <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${selectedPlan === p.code ? "text-[--teal-600]" : "text-[--ink-500]"}`}>{p.name}</div>
                  <div className="text-[24px] font-[Outfit] font-900 text-[--ink-900]">{p.price}</div>
                  <div className="text-[11px] text-[--ink-500]">{p.period}</div>
                </button>
              ))}
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] text-[--ink-700]">
                  <span className="w-5 h-5 rounded-full bg-[--teal-100] text-[--teal-700] flex items-center justify-center text-[11px] flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700">{error}</div>}

            <button onClick={upgrade} disabled={loading}
              className="btn-primary w-full justify-center text-[14px] py-3.5"
              style={{ fontFamily: "var(--font-display)" }}>
              {loading ? "Opening Razorpay..." : `Upgrade to ${plan.name} — ${plan.price}/mo`}
            </button>
            <p className="text-[11px] text-[--ink-400] text-center mt-3">Billed via Razorpay · Cancel anytime from dashboard</p>
          </div>
        </div>
      </div>
    </>
  );
}
