export default function Navbar({ onAlertClick }: { onAlertClick: () => void }) {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            🏠
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              GovPlot
            </span>
            <span className="text-xs text-slate-500 font-medium">Tracker</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="/" className="text-slate-600 hover:text-blue-600 transition">
            Schemes
          </a>
          <a href="/cities" className="text-slate-600 hover:text-blue-600 transition">
            Cities
          </a>
          <a href="/about" className="text-slate-600 hover:text-blue-600 transition">
            About
          </a>
        </div>

        {/* CTA Button */}
        <button
          onClick={onAlertClick}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          🔔 Free Alerts
        </button>
      </div>
    </nav>
  );
}
