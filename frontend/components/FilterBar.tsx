const CITIES = ["Lucknow", "Bangalore", "Noida", "Gurgaon", "Hyderabad", "Pune", "Mumbai", "Chandigarh", "Agra"];
const STATUSES = ["OPEN", "ACTIVE", "UPCOMING", "CLOSED"];

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
    <div className="surface-card mb-6 border-amber-100/90 p-4 sm:mb-8 sm:p-6">
      <div className="mb-4">
        <label htmlFor="scheme-search" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Search
        </label>
        <input
          id="scheme-search"
          type="text"
          placeholder="Search schemes, authority, or city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {["", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg border px-3 py-2 text-xs font-bold tracking-wide transition ${
                status === s
                  ? "border-teal-700 bg-teal-700 text-white shadow"
                  : "border-amber-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
              }`}
            >
              {s === "" ? "ALL" : s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
