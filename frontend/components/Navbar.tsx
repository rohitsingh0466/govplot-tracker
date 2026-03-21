export default function Navbar({ onAlertClick }: { onAlertClick: () => void }) {
  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="font-bold text-blue-700 text-lg">GovPlot Tracker</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="/" className="hover:text-blue-700">Schemes</a>
          <a href="/cities" className="hover:text-blue-700">Cities</a>
          <a href="/about" className="hover:text-blue-700">About</a>
        </div>
        <button
          onClick={onAlertClick}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
        >
          🔔 Get Alerts
        </button>
      </div>
    </nav>
  );
}
