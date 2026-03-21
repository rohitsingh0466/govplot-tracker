import { useState } from "react";

export default function Navbar({ onAlertClick }: { onAlertClick: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
              🏠
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                GovPlot
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:block">Tracker</span>
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`block w-5 h-0.5 bg-slate-600 transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
              <span className={`block w-5 h-0.5 bg-slate-600 transition-opacity ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`block w-5 h-0.5 bg-slate-600 transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
            </div>
          </button>

          {/* CTA Button */}
          <button
            onClick={onAlertClick}
            className="hidden sm:block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full transition shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🔔 Free Alerts
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-100 pt-4">
            <div className="flex flex-col gap-4">
              <a href="/" className="text-slate-600 hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                Schemes
              </a>
              <a href="/cities" className="text-slate-600 hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                Cities
              </a>
              <a href="/about" className="text-slate-600 hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                About
              </a>
              <button
                onClick={() => { onAlertClick(); setMobileMenuOpen(false); }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-full transition shadow-lg hover:shadow-xl transform hover:scale-105 text-left"
              >
                🔔 Get Free Alerts
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
