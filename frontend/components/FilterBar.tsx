import { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Fallback static groups (used if API fails) — 20 cities only
const FALLBACK_CITY_GROUPS = [
  { state: "Uttar Pradesh",  cities: ["Greater Noida", "Lucknow", "Agra", "Prayagraj", "Varanasi", "Meerut"] },
  { state: "Rajasthan",      cities: ["Jaipur", "Udaipur"] },
  { state: "Punjab",         cities: ["Chandigarh"] },
  { state: "Maharashtra",    cities: ["Navi Mumbai", "Pune", "Nagpur"] },
  { state: "Telangana",      cities: ["Hyderabad"] },
  { state: "Karnataka",      cities: ["Bengaluru"] },
  { state: "Chhattisgarh",   cities: ["Raipur"] },
  { state: "Odisha",         cities: ["Bhubaneswar"] },
  { state: "Gujarat",        cities: ["Ahmedabad"] },
  { state: "Delhi",          cities: ["Delhi"] },
  { state: "Madhya Pradesh", cities: ["Bhopal"] },
  { state: "Uttarakhand",    cities: ["Dehradun"] },
];

const STATUSES = ["OPEN", "ACTIVE", "UPCOMING", "CLOSED"];

interface Props {
  city: string;
  setCity: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
}

export default function FilterBar({ city, setCity, status, setStatus, search, setSearch }: Props) {
  const [cityGroups, setCityGroups] = useState<{ state: string; cities: string[] }[]>(FALLBACK_CITY_GROUPS);

  // Fetch city groups from backend API (reads city_config.py)
  useEffect(() => {
    axios.get(`${API}/api/v1/cities/by-state`)
      .then(r => {
        // Convert API response {state: [cityObj, ...]} → [{state, cities: [name, ...]}]
        const data = r.data as Record<string, Array<{ name: string }>>;
        const groups = Object.entries(data).map(([state, citiesArr]) => ({
          state,
          cities: citiesArr.map(c => c.name),
        }));
        if (groups.length > 0) setCityGroups(groups);
      })
      .catch(() => {
        // Keep fallback
      });
  }, []);

  return (
    <div className="card p-5 mb-8">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[--ink-400] text-base">🔍</span>
          <input
            type="text"
            placeholder="Search by scheme name, authority, or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 pr-4"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input-field sm:w-64 flex-shrink-0"
          >
            <option value="">🗺️ All Cities (20 tracked)</option>
            {cityGroups.map((group) => (
              <optgroup key={group.state} label={group.state}>
                {group.cities.map((cityOption) => (
                  <option key={cityOption} value={cityOption}>
                    {cityOption}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <div className="flex flex-wrap gap-2 flex-1">
            {["", ...STATUSES].map((value) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={`px-4 py-2 rounded-full text-[12.5px] font-semibold border transition-all flex-shrink-0 ${status === value ? "bg-[--teal-600] text-white border-[--teal-600]" : "bg-white text-[--ink-600] border-[--ink-200] hover:border-[--teal-400]"}`}
              >
                {value === ""
                  ? "All Status"
                  : value === "OPEN"
                    ? "✅ Open"
                    : value === "ACTIVE"
                      ? "⚡ Active"
                      : value === "UPCOMING"
                        ? "🔜 Upcoming"
                        : "🔒 Closed"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
