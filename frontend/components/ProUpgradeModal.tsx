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
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function ProUpgradeModal({
  open,
  onClose,
  onUpgraded,
}: {
  open: boolean;
  onClose: () => void;
  onUpgraded: (user: AuthUser) => void;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setError("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  async function upgrade() {
    const token = window.localStorage.getItem("govplot_auth_token");
    if (!token) {
      setError("Please sign in first.");
      return;
    }

    if (!scriptReady || !window.Razorpay) {
      setError("Razorpay checkout is still loading. Please try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await withMinimumLoader(
        axios.post<SubscriptionStartResponse>(
          `${API}/api/v1/billing/subscription/start`,
          { plan_code: "pro_monthly" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      );

      const razorpay = new window.Razorpay({
        key: data.checkout_key,
        subscription_id: data.subscription_id,
        name: data.name,
        description: data.description,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          await withMinimumLoader(
            axios.post(
              `${API}/api/v1/billing/subscription/verify`,
              response,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
          );

          const me = await withMinimumLoader(
            axios.get<AuthUser>(`${API}/api/v1/auth/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          );

          window.localStorage.setItem("govplot_auth_user", JSON.stringify(me.data));
          window.dispatchEvent(new Event("govplot-auth-changed"));
          onUpgraded(me.data);
          onClose();
        },
        prefill: {
          name: data.prefill_name || undefined,
          email: data.prefill_email,
          contact: data.prefill_contact || undefined,
        },
        theme: {
          color: "#1d4ed8",
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      razorpay.open();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message || err?.response?.data?.detail || "We could not start the Pro checkout.");
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="bg-gradient-to-br from-amber-300 via-orange-200 to-white p-8">
            <button
              onClick={onClose}
              className="absolute right-6 top-6 rounded-full p-2 text-slate-900 transition hover:bg-black/5"
              aria-label="Close Pro modal"
            >
              ✕
            </button>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">
              GovPlot Pro
            </p>
            <h2 className="text-3xl font-black leading-tight text-slate-950">
              Upgrade for premium alerts and unlimited tracking
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              This v1.1 step connects Razorpay checkout to your authenticated GovPlot account using the same FastAPI and Next.js stack from the product document.
            </p>
          </div>

          <div className="relative p-8">
            {loading && <BrandLoader overlay compact label="Preparing your upgrade..." />}
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Plan</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Pro Monthly</h3>
                  <p className="mt-2 text-sm text-slate-600">Razorpay recurring billing for Pro notifications and member features.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-950">Rs. 99</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">per month</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 px-4 py-3">Unlimited city tracking</div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3">WhatsApp and premium alert readiness</div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3">Account linked subscription status in your profile</div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              onClick={upgrade}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Opening Razorpay..." : "Upgrade to Pro"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
