const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; ribbon: string; accent: string }> = {
  OPEN: { label: "Open", dot: "bg-emerald-500", badge: "badge-OPEN", ribbon: "bg-emerald-500", accent: "from-emerald-500/10 to-emerald-100/70" },
  ACTIVE: { label: "Active", dot: "bg-sky-500", badge: "badge-ACTIVE", ribbon: "bg-sky-500", accent: "from-sky-500/10 to-sky-100/70" },
  UPCOMING: { label: "Upcoming", dot: "bg-amber-500", badge: "badge-UPCOMING", ribbon: "bg-amber-500", accent: "from-amber-500/10 to-amber-100/70" },
  CLOSED: { label: "Closed", dot: "bg-slate-400", badge: "badge-CLOSED", ribbon: "bg-slate-400", accent: "from-slate-500/10 to-slate-100/70" },
};

export default function SchemeCard({ scheme }: { scheme: any }) {
  const cfg = STATUS_CONFIG[scheme.status] ?? STATUS_CONFIG.ACTIVE;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className={`h-1 w-full ${cfg.ribbon}`} />

      <div className={`border-b border-amber-100 bg-gradient-to-br ${cfg.accent} p-4 sm:p-5`}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.badge}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot} animate-pulse`} />
            {cfg.label}
          </span>
          <span className="rounded-full border border-amber-100 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
            {scheme.authority}
          </span>
        </div>

        <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-slate-900 transition group-hover:text-teal-700 sm:text-lg">
          {scheme.name}
        </h3>

        <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <span>📍</span>
          {scheme.city}
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 text-sm sm:gap-3">
          {scheme.total_plots && (
            <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Plots</div>
              <div className="text-lg font-bold text-slate-800">{scheme.total_plots.toLocaleString()}</div>
            </div>
          )}
          {scheme.price_min && (
            <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">Price</div>
              <div className="text-sm font-bold text-teal-900 sm:text-base">₹{scheme.price_min}L - ₹{scheme.price_max}L</div>
            </div>
          )}
          {scheme.area_sqft_min && (
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Plot Size</div>
              <div className="text-sm font-bold text-cyan-900 sm:text-base">{scheme.area_sqft_min}-{scheme.area_sqft_max} sq.ft</div>
            </div>
          )}
          {(scheme.open_date || scheme.close_date) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">{scheme.status === "UPCOMING" ? "Opens" : "Closes"}</div>
              <div className="text-xs font-bold text-amber-900 sm:text-sm">{scheme.status === "UPCOMING" ? scheme.open_date : scheme.close_date}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t border-amber-100 px-4 py-3 sm:px-5">
        <a
          href={`/schemes/${scheme.scheme_id}`}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
        >
          Details
        </a>
        <a
          href={scheme.apply_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition ${
            scheme.status === "OPEN"
              ? "bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow hover:from-emerald-700 hover:to-green-800"
              : scheme.status === "UPCOMING"
                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 shadow hover:from-amber-500 hover:to-orange-600"
                : "cursor-not-allowed bg-slate-200 text-slate-600"
          }`}
        >
          {scheme.status === "OPEN" ? "Apply Now" : scheme.status === "UPCOMING" ? "Coming Soon" : "Official Link"}
        </a>
      </div>
    </article>
  );
}
