const CITIES = ["Lucknow","Bangalore","Noida","Gurgaon","Hyderabad","Pune","Mumbai","Chandigarh","Agra"];
const STATUSES = ["OPEN","ACTIVE","UPCOMING","CLOSED"];

interface Props {
  city: string;
  setCity: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
}

export default function FilterBar({ city, setCity, status, setStatus, search, setSearch }: Props) {
  return (
    <div className="card p-5 mb-8">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[--ink-400] text-base">🔍</span>
          <input
            type="text"
            placeholder="Search schemes, authority, or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 pr-4"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* City select */}
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            className="input-field sm:w-48 flex-shrink-0"
          >
            <option value="">🗺️ All Cities</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status pills */}
          <div className="flex flex-wrap gap-2 flex-1">
            {["", ...STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-full text-[12.5px] font-semibold border transition-all flex-shrink-0 ${
                  status === s
                    ? "bg-[--teal-600] text-white border-[--teal-600] shadow-[--shadow-teal]"
                    : "bg-white text-[--ink-600] border-[--ink-200] hover:border-[--teal-400] hover:text-[--teal-700]"
                }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s === "" ? "All Status" : s === "OPEN" ? "✅ Open" : s === "ACTIVE" ? "⚡ Active" : s === "UPCOMING" ? "🔜 Upcoming" : "🔒 Closed"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
