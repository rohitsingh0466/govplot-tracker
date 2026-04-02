const CITY_GROUPS = [
  { state: "Uttar Pradesh", cities: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj", "Meerut", "Ghaziabad", "Noida", "Aligarh", "Mathura", "Bareilly", "Gorakhpur", "Jhansi", "Moradabad", "Saharanpur", "Muzaffarnagar"] },
  { state: "Delhi", cities: ["Delhi"] },
  { state: "Maharashtra", cities: ["Mumbai", "Navi Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Kolhapur", "Solapur", "Amravati", "Akola", "Jalgaon", "Latur", "Nanded", "Kalyan", "Vasai", "Panvel"] },
  { state: "Karnataka", cities: ["Bangalore", "Mysuru", "Hubballi", "Mangalore", "Belgaum", "Shimoga", "Tumkur", "Davangere", "Gulbarga"] },
  { state: "Telangana", cities: ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Khammam", "Mahabubnagar"] },
  { state: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Vellore", "Erode", "Tirunelveli", "Thoothukudi", "Thanjavur", "Hosur"] },
  { state: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"] },
  { state: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar", "Jamnagar", "Mehsana", "Anand", "Bharuch"] },
  { state: "Haryana", cities: ["Gurgaon", "Faridabad", "Panchkula", "Karnal", "Rohtak", "Hisar", "Ambala", "Panipat", "Sonipat", "Rewari", "Kurukshetra"] },
  { state: "Madhya Pradesh", cities: ["Indore", "Bhopal", "Jabalpur"] },
  { state: "Punjab / Chandigarh", cities: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Mohali", "Patiala", "Bathinda", "Zirakpur"] },
  { state: "West Bengal", cities: ["Kolkata", "New Town", "Durgapur"] },
  { state: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Kakinada", "Kurnool", "Rajahmundry"] },
  { state: "Kerala", cities: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Palakkad", "Kannur", "Kollam", "Kottayam"] },
  { state: "Odisha", cities: ["Bhubaneswar", "Cuttack", "Sambalpur", "Berhampur", "Rourkela"] },
  { state: "Bihar", cities: ["Patna", "Muzaffarpur", "Gaya", "Bhagalpur", "Darbhanga"] },
  { state: "Jharkhand", cities: ["Ranchi", "Dhanbad", "Jamshedpur", "Bokaro", "Hazaribagh"] },
  { state: "Chhattisgarh", cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"] },
  { state: "Uttarakhand", cities: ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Rishikesh"] },
  { state: "Goa", cities: ["Panaji"] },
  { state: "Assam / Northeast", cities: ["Guwahati", "Agartala", "Imphal", "Shillong"] },
  { state: "Himachal Pradesh", cities: ["Shimla", "Dharamsala", "Solan", "Baddi"] },
  { state: "J&K", cities: ["Jammu", "Srinagar"] },
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
            <option value="">🗺️ All Cities (100+)</option>
            {CITY_GROUPS.map((group) => (
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
