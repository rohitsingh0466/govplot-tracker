interface Stats {
  total_schemes: number;
  open: number;
  active: number;
  upcoming: number;
  closed: number;
  cities_tracked: number;
}

export default function StatsBar({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Total Schemes", value: stats.total_schemes, gradient: "from-teal-600 to-cyan-700", icon: "📚", bg: "from-teal-50 to-cyan-50", ring: "ring-teal-100" },
    { label: "Open Now", value: stats.open, gradient: "from-emerald-600 to-green-700", icon: "🔓", bg: "from-emerald-50 to-green-50", ring: "ring-emerald-100" },
    { label: "Active", value: stats.active, gradient: "from-sky-600 to-blue-700", icon: "⚡", bg: "from-sky-50 to-blue-50", ring: "ring-sky-100" },
    { label: "Upcoming", value: stats.upcoming, gradient: "from-amber-500 to-orange-600", icon: "⏳", bg: "from-amber-50 to-orange-50", ring: "ring-amber-100" },
    { label: "Cities Tracked", value: stats.cities_tracked, gradient: "from-slate-700 to-slate-900", icon: "🗺️", bg: "from-slate-100 to-slate-50", ring: "ring-slate-200" },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 px-4 sm:mb-10 sm:grid-cols-3 sm:gap-4 sm:px-0 md:grid-cols-5">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={`animate-fade-in-up rounded-2xl border border-white/90 bg-gradient-to-br ${c.bg} p-3 text-center shadow-sm ring-1 ${c.ring} transition hover:-translate-y-1 hover:shadow-lg sm:p-5`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="mb-1 text-2xl sm:mb-2 sm:text-3xl">{c.icon}</div>
          <div className={`bg-gradient-to-r ${c.gradient} bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl`}>
            {c.value}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:mt-2">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
