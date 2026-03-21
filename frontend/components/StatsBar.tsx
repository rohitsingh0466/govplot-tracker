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
    { label: "Total Schemes",   value: stats.total_schemes, color: "from-blue-600 to-blue-700",     icon: "📋", bg: "bg-blue-50" },
    { label: "🔓 Open Now",     value: stats.open,          color: "from-emerald-600 to-emerald-700", icon: "✅", bg: "bg-emerald-50" },
    { label: "🔵 Active",       value: stats.active,        color: "from-sky-600 to-sky-700",       icon: "⚡", bg: "bg-sky-50" },
    { label: "⏳ Upcoming",     value: stats.upcoming,      color: "from-amber-600 to-amber-700",    icon: "🔜", bg: "bg-amber-50" },
    { label: "Cities Tracked",  value: stats.cities_tracked, color: "from-purple-600 to-purple-700", icon: "🌍", bg: "bg-purple-50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={`${c.bg} rounded-2xl p-5 text-center shadow-sm hover:shadow-lg transition transform hover:-translate-y-1 border border-white/50 animate-fade-in-up`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="text-3xl mb-2">{c.icon}</div>
          <div className={`text-4xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>
            {c.value}
          </div>
          <div className="text-xs text-slate-600 mt-2 font-medium">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
