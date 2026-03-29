interface Stats {
  total_schemes: number;
  open: number;
  active: number;
  upcoming: number;
  closed: number;
  cities_tracked: number;
}

const CARDS = [
  { key: "total_schemes",  label: "Schemes",        icon: "📋", color: "from-[--teal-600] to-[--teal-700]", bg: "bg-[--teal-100]/60",   ring: "border-[--teal-200]/60" },
  { key: "open",           label: "Open Now",       icon: "✅", color: "from-[#16a34a] to-[#15803d]",      bg: "bg-[--green-100]/60",  ring: "border-green-200/60" },
  { key: "active",         label: "Active",         icon: "⚡", color: "from-[--sky-500] to-[#0284c7]",   bg: "bg-[--sky-100]/60",    ring: "border-sky-200/60" },
  { key: "upcoming",       label: "Upcoming",       icon: "🔜", color: "from-[--amber-500] to-[#d97706]", bg: "bg-[--amber-100]/60",  ring: "border-amber-200/60" },
  { key: "cities_tracked", label: "Cities",         icon: "🗺️", color: "from-[--ink-700] to-[--ink-900]", bg: "bg-[--ink-100]/60",    ring: "border-[--ink-200]/60" },
];

export default function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
      {CARDS.map(({ key, label, icon, color, bg, ring }, i) => (
        <div
          key={key}
          className={`${bg} border ${ring} rounded-2xl p-4 text-center card card-hover`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="text-2xl mb-2">{icon}</div>
          <div className={`text-2xl sm:text-3xl font-[Outfit] font-800 bg-gradient-to-br ${color} bg-clip-text text-transparent`}>
            {stats[key as keyof Stats]}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[--ink-500] mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
