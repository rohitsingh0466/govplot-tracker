import { useEffect, useState } from "react";
import axios from "axios";

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
  free_phone_edit_used?: boolean;
  capabilities?: string[];
};

export default function ProfileEditModal({
  open,
  user,
  onClose,
  onUpdated,
}: {
  open: boolean;
  user: AuthUser | null;
  onClose: () => void;
  onUpdated: (user: AuthUser) => void;
}) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setPhone(user?.phone || "");
    setError("");
    setLoading(false);
  }, [open, user]);

  if (!open || !user) return null;

  async function submit() {
    const token = window.localStorage.getItem("govplot_auth_token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    const normalized = phone.trim();
    if (normalized && !/^\d{10}$/.test(normalized)) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await axios.patch<AuthUser>(
        `${API}/api/v1/auth/profile`,
        { phone: normalized || null },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      window.localStorage.setItem("govplot_auth_user", JSON.stringify(data));
      window.dispatchEvent(new Event("govplot-auth-changed"));
      onUpdated(data);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not update your profile.");
    } finally {
      setLoading(false);
    }
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.name || "Google account";
  const isFreeUser = (user.subscription_tier || "free") === "free";
  const hasExistingPhone = Boolean((user.phone || "").trim());
  const freeEditConsumed = Boolean(user.free_phone_edit_used);
  const freeUserLocked = isFreeUser && hasExistingPhone && freeEditConsumed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[--ink-900]/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-[--r-2xl] overflow-hidden shadow-[--shadow-xl]">
        <div className="bg-gradient-to-br from-[--teal-700] to-[--teal-900] p-7 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition"
          >
            ✕
          </button>
          <div className="text-3xl mb-2">✏️</div>
          <h2 className="text-[22px] font-[Outfit] font-800 text-white mb-1">Edit profile</h2>
          <p className="text-[13px] text-[--teal-300]">You can update your mobile number here for future alert channels.</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">First Name</label>
            <input className="input-field bg-[--ink-50] text-[--ink-500] cursor-not-allowed" value={user.first_name || fullName.split(" ")[0] || ""} readOnly />
          </div>

          <div>
            <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Last Name</label>
            <input className="input-field bg-[--ink-50] text-[--ink-500] cursor-not-allowed" value={user.last_name || fullName.split(" ").slice(1).join(" ")} readOnly />
          </div>

          <div>
            <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Email Address</label>
            <input className="input-field bg-[--ink-50] text-[--ink-500] cursor-not-allowed" value={user.email || ""} readOnly />
          </div>

          <div>
            <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Mobile No</label>
            <input
              className="input-field"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter 10 digit mobile number"
              value={phone}
              readOnly={freeUserLocked}
              onChange={e => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                setError("");
              }}
            />
            <p className="text-[11px] text-[--ink-400] mt-2">
              {freeUserLocked
                ? "Free users can update the mobile number only once. Upgrade to Pro for more changes."
                : isFreeUser && hasExistingPhone
                  ? "Free users can change this mobile number one time. It must contain exactly 10 digits."
                  : "Only this field is editable. It must contain exactly 10 digits."}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700">{error}</div>
          )}

          <button
            onClick={submit}
            disabled={loading || freeUserLocked}
            className="btn-primary w-full justify-center text-[14px] py-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {loading ? "Saving..." : freeUserLocked ? "Edit Limit Reached" : "Save Mobile Number →"}
          </button>
        </div>
      </div>
    </div>
  );
}
