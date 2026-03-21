const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; gradientBg: string }> = {
  OPEN:     { label: "🔓 Open",     dot: "bg-emerald-500",  badge: "badge-OPEN",     gradientBg: "from-emerald-50 to-emerald-100/50" },
  ACTIVE:   { label: "🔵 Active",   dot: "bg-sky-500",      badge: "badge-ACTIVE",   gradientBg: "from-sky-50 to-sky-100/50" },
  UPCOMING: { label: "⏳ Upcoming", dot: "bg-amber-500",    badge: "badge-UPCOMING", gradientBg: "from-amber-50 to-amber-100/50" },
  CLOSED:   { label: "❌ Closed",   dot: "bg-slate-400",    badge: "badge-CLOSED",   gradientBg: "from-slate-50 to-slate-100/50" },
};

export default function SchemeCard({ scheme }: { scheme: any }) {
  const cfg = STATUS_CONFIG[scheme.status] ?? STATUS_CONFIG["ACTIVE"];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all transform hover:-translate-y-1 flex flex-col overflow-hidden group`}>
      {/* Header with gradient background */}
      <div className={`bg-gradient-to-r ${cfg.gradientBg} p-5 flex-1 border-b border-slate-100`}>
        <div className="flex items-start justify-between gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${cfg.badge}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot} inline-block animate-pulse`} />
            {cfg.label}
          </span>
          <span className="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-full font-medium border border-slate-100">
            {scheme.authority}
          </span>
        </div>

        <h3 className="font-bold text-slate-900 text-base leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition">
          {scheme.name}
        </h3>

        <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
          <span>📍</span>
          <span className="font-medium">{scheme.city}</span>
        </div>
      </div>

      {/* Details grid */}
      <div className="p-5 flex-1">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {scheme.total_plots && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-3 border border-slate-200/50">
              <div className="text-slate-500 text-xs font-medium">Total Plots</div>
              <div className="font-bold text-slate-800 text-lg">{scheme.total_plots.toLocaleString()}</div>
            </div>
          )}
          {scheme.price_min && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200/50">
              <div className="text-blue-600 text-xs font-medium">Price Range</div>
              <div className="font-bold text-blue-800">₹{scheme.price_min}L – ₹{scheme.price_max}L</div>
            </div>
          )}
          {scheme.area_sqft_min && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 border border-purple-200/50">
              <div className="text-purple-600 text-xs font-medium">Plot Size</div>
              <div className="font-bold text-purple-800">{scheme.area_sqft_min}–{scheme.area_sqft_max} sq.ft</div>
            </div>
          )}
          {(scheme.open_date || scheme.close_date) && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3 border border-orange-200/50">
              <div className="text-orange-600 text-xs font-medium">{scheme.status === "UPCOMING" ? "Opens" : "Closes"}</div>
              <div className="font-bold text-orange-800 text-sm">
                {scheme.status === "UPCOMING" ? scheme.open_date : scheme.close_date}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-slate-100 px-5 py-3 flex gap-2">
        <a
          href={scheme.apply_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 text-center text-sm font-bold py-3 rounded-xl transition transform hover:scale-105 ${
            scheme.status === "OPEN"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
              : scheme.status === "UPCOMING"
              ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 shadow-lg hover:shadow-xl"
              : "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-600 cursor-not-allowed"
          }`}
        >
          {scheme.status === "OPEN" ? "Apply Now →" : scheme.status === "UPCOMING" ? "Coming Soon ⏳" : "View Details"}
        </a>
      </div>
    </div>
  );
}
