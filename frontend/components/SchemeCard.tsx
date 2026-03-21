const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  OPEN:     { label: "Open",     dot: "bg-green-500",  badge: "badge-OPEN" },
  ACTIVE:   { label: "Active",   dot: "bg-blue-500",   badge: "badge-ACTIVE" },
  UPCOMING: { label: "Upcoming", dot: "bg-yellow-400", badge: "badge-UPCOMING" },
  CLOSED:   { label: "Closed",   dot: "bg-gray-400",   badge: "badge-CLOSED" },
};

export default function SchemeCard({ scheme }: { scheme: any }) {
  const cfg = STATUS_CONFIG[scheme.status] ?? STATUS_CONFIG["ACTIVE"];

  return (
    <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition flex flex-col">
      {/* Card header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
            {cfg.label}
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{scheme.authority}</span>
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
          {scheme.name}
        </h3>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <span>📍</span>
          <span>{scheme.city}</span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {scheme.total_plots && (
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-400">Total Plots</div>
              <div className="font-semibold text-gray-800">{scheme.total_plots.toLocaleString()}</div>
            </div>
          )}
          {scheme.price_min && (
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-400">Price Range</div>
              <div className="font-semibold text-gray-800">
                ₹{scheme.price_min}L – ₹{scheme.price_max}L
              </div>
            </div>
          )}
          {scheme.area_sqft_min && (
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-400">Plot Size</div>
              <div className="font-semibold text-gray-800">
                {scheme.area_sqft_min}–{scheme.area_sqft_max} sq.ft
              </div>
            </div>
          )}
          {(scheme.open_date || scheme.close_date) && (
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-400">{scheme.status === "UPCOMING" ? "Opens" : "Closes"}</div>
              <div className="font-semibold text-gray-800">
                {scheme.status === "UPCOMING" ? scheme.open_date : scheme.close_date}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t px-5 py-3 flex gap-2">
        <a
          href={scheme.apply_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 text-center text-xs font-semibold py-2 rounded-lg transition ${
            scheme.status === "OPEN"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : scheme.status === "UPCOMING"
              ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
              : "bg-gray-100 text-gray-500 cursor-not-allowed"
          }`}
        >
          {scheme.status === "OPEN" ? "Apply Now →" : scheme.status === "UPCOMING" ? "Coming Soon" : "View Details"}
        </a>
      </div>
    </div>
  );
}
