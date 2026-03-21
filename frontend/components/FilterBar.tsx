const CITIES = ["Lucknow","Bangalore","Noida","Gurgaon","Hyderabad","Pune","Mumbai","Chandigarh","Agra"];
const STATUSES = ["OPEN","ACTIVE","UPCOMING","CLOSED"];

interface Props {
  city: string; setCity: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  search: string; setSearch: (v: string) => void;
}

export default function FilterBar({ city, setCity, status, setStatus, search, setSearch }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 sm:p-6 mx-4 sm:mx-0 mb-6 sm:mb-8 backdrop-blur-sm">
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search schemes by name or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50 hover:bg-white"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        {/* City filter */}
        <select
          value={city}
          onChange={e => setCity(e.target.value)}
          className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50 hover:bg-white font-medium flex-1 sm:flex-none"
        >
          <option value="">📍 All Cities</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {["", ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold border-2 transition transform hover:scale-105 whitespace-nowrap flex-1 sm:flex-none ${
                status === s
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              {s === "" ? "All" : s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
