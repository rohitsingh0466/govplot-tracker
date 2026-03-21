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
    { label: "Total Schemes",   value: stats.total_schemes, color: "text-blue-700",   bg: "bg-blue-50",   icon: "📋" },
    { label: "Open Now",        value: stats.open,           color: "text-green-700",  bg: "bg-green-50",  icon: "✅" },
    { label: "Active",          value: stats.active,         color: "text-blue-600",   bg: "bg-blue-50",   icon: "🔵" },
    { label: "Upcoming",        value: stats.upcoming,       color: "text-yellow-700", bg: "bg-yellow-50", icon: "⏳" },
    { label: "Cities Tracked",  value: stats.cities_tracked, color: "text-purple-700", bg: "bg-purple-50", icon: "🏙️" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-xl p-4 text-center shadow-sm`}>
          <div className="text-2xl mb-1">{c.icon}</div>
          <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
          <div className="text-xs text-gray-500 mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
