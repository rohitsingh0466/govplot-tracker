import Link from "next/link";
import { getEffectiveSchemeStatus } from "../lib/schemeStatus";

const STATUS: Record<string, { label: string; dot: string; badge: string; bar: string }> = {
  OPEN:     { label: "Open Now",  dot: "#22c55e", badge: "badge-OPEN",     bar: "bg-[--green-500]" },
  ACTIVE:   { label: "Active",    dot: "#0ea5e9", badge: "badge-ACTIVE",   bar: "bg-[--sky-500]" },
  UPCOMING: { label: "Upcoming",  dot: "#f59e0b", badge: "badge-UPCOMING", bar: "bg-[--amber-500]" },
  CLOSED:   { label: "Closed",    dot: "#94a3b8", badge: "badge-CLOSED",   bar: "bg-[--slate-400]" },
};

export default function SchemeCard({ scheme, onSignUpClick }: { scheme: any; onSignUpClick?: () => void }) {
  const effectiveStatus = getEffectiveSchemeStatus(scheme);
  const cfg = STATUS[effectiveStatus] ?? STATUS.ACTIVE;
  const isBlurred = Boolean(scheme.blurred);

  return (
    <article className="card card-hover flex flex-col overflow-hidden relative">
      {/* Top color bar */}
      <div className={`h-1 w-full ${cfg.bar}`} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot, boxShadow: `0 0 0 2px ${cfg.dot}33` }} />
            {cfg.label}
          </span>
          <span className="text-[11.5px] font-semibold text-[--ink-500] bg-[--ink-50] px-2.5 py-1 rounded-full border border-[--ink-100]">
            {scheme.authority}
          </span>
        </div>

        {/* Name */}
        <h3 className={`text-[15px] font-[Outfit] font-700 text-[--ink-900] leading-snug mb-2 line-clamp-2 ${isBlurred ? "blur-[2px] select-none" : ""}`}>
          {scheme.name}
        </h3>

        {/* City */}
        <p className="text-[13px] text-[--ink-500] flex items-center gap-1.5 mb-4">
          <span>📍</span> {scheme.city}
        </p>

        {/* Stats grid — blurred for anonymous on OPEN/ACTIVE */}
        {isBlurred ? (
          <div className="flex-1 mb-4">
            <div className="bg-gradient-to-br from-[--teal-100]/60 to-[--saffron-100]/40 rounded-2xl p-5 border border-[--teal-200]/50 text-center">
              <div className="text-2xl mb-2">🔐</div>
              <p className="text-[13px] font-[Outfit] font-700 text-[--ink-900] mb-1">Sign up to view details</p>
              <p className="text-[11.5px] text-[--ink-500] mb-3 leading-relaxed">
                Create a free account to see pricing, plots, location and apply for Open &amp; Active schemes.
              </p>
              <button
                onClick={onSignUpClick}
                className="btn-primary text-[12px] py-2 px-5 w-full justify-center"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sign Up Free →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {scheme.total_plots && (
                <div className="bg-[--ink-50] rounded-xl p-3 border border-[--ink-100]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[--ink-400] mb-0.5">Plots</div>
                  <div className="text-[15px] font-[Outfit] font-700 text-[--ink-900]">{scheme.total_plots.toLocaleString()}</div>
                </div>
              )}
              {scheme.price_min && (
                <div className="bg-[--teal-100]/60 rounded-xl p-3 border border-[--teal-200]/50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[--teal-700] mb-0.5">Price</div>
                  <div className="text-[13px] font-[Outfit] font-700 text-[--teal-900]">₹{scheme.price_min}L{scheme.price_max ? `–₹${scheme.price_max}L` : "+"}</div>
                </div>
              )}
              {scheme.area_sqft_min && (
                <div className="bg-[--saffron-100]/50 rounded-xl p-3 border border-[--saffron-300]/30">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[--saffron-600] mb-0.5">Size</div>
                  <div className="text-[13px] font-[Outfit] font-700 text-[--ink-900]">{scheme.area_sqft_min}–{scheme.area_sqft_max} sq.ft</div>
                </div>
              )}
              {(scheme.open_date || scheme.close_date) && (
                <div className="bg-[--ink-50] rounded-xl p-3 border border-[--ink-100]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[--ink-400] mb-0.5">
                    {effectiveStatus === "UPCOMING" ? "Opens" : "Closes"}
                  </div>
                  <div className="text-[12px] font-semibold text-[--ink-800]">
                    {effectiveStatus === "UPCOMING" ? scheme.open_date : scheme.close_date}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto flex gap-2">
              <Link href={`/schemes/${scheme.scheme_id}`} className="btn-secondary flex-shrink-0 py-2 px-4 text-[13px]">Details</Link>
              <a href={scheme.apply_url || "#"} target="_blank" rel="noopener noreferrer"
                className={`flex-1 py-2 text-center text-[13px] font-semibold rounded-full transition ${effectiveStatus === "OPEN" ? "bg-gradient-to-r from-[--green-500] to-[#16a34a] text-white hover:opacity-90 shadow-sm" : effectiveStatus === "UPCOMING" ? "bg-gradient-to-r from-[--amber-500] to-[--saffron-600] text-white hover:opacity-90 shadow-sm" : "bg-[--ink-100] text-[--ink-500] cursor-not-allowed"}`}
                style={{ fontFamily: "var(--font-display)" }}>
                {effectiveStatus === "OPEN" ? "Apply Now ↗" : effectiveStatus === "UPCOMING" ? "Notify Me" : "Official Link"}
              </a>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
