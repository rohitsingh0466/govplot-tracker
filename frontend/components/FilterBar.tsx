const CITIES = ["Lucknow","Bangalore","Noida","Gurgaon","Hyderabad","Pune","Mumbai","Chandigarh","Agra"];
const STATUSES = ["OPEN","ACTIVE","UPCOMING","CLOSED"];

interface Props {
  city: string; setCity: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  search: string; setSearch: (v: string) => void;
}

export default function FilterBar({ city, setCity, status, setStatus, search, setSearch }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-wrap gap-3 items-center">
      {/* Search */}
      <input
        type="text"
        placeholder="🔍  Search schemes..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* City filter */}
      <select
        value={city}
        onChange={e => setCity(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Cities</option>
        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["", ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              status === s
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {s === "" ? "All" : s}
          </button>
        ))}
      </div>
    </div>
  );
}
