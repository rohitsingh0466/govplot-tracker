import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[--ink-900] text-[--ink-300] mt-28">
      <div className="page-container py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[--teal-500] to-[--teal-700] flex items-center justify-center text-lg">🏠</div>
              <div>
                <div className="text-white font-[Outfit] font-700 text-base">GovPlot Tracker</div>
                <div className="text-[--ink-500] text-[10px] uppercase tracking-widest">India's #1 Plot Tracker</div>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-[--ink-400] max-w-[220px]">
              Real-time monitoring of government residential plot schemes across 9 major Indian cities.
            </p>
            <div className="mt-5 flex gap-3">
              <a href="https://t.me/govplottracker" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[--ink-800] hover:bg-[--teal-800] flex items-center justify-center text-sm transition">✈️</a>
              <a href="https://twitter.com/govplottracker" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[--ink-800] hover:bg-[--teal-800] flex items-center justify-center text-sm transition">𝕏</a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-[Outfit] font-600 text-sm mb-4 uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/schemes",  label: "All Schemes" },
                { href: "/cities",   label: "Cities" },
                { href: "/pricing",  label: "Pricing" },
                { href: "/blog",     label: "Blog" },
                { href: "/about",    label: "About" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[13px] text-[--ink-400] hover:text-[--teal-400] transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4 className="text-white font-[Outfit] font-600 text-sm mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/contact", label: "Contact Us" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms",   label: "Terms of Use" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[13px] text-[--ink-400] hover:text-[--teal-400] transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[--ink-800] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-[--ink-600]">© 2026 GovPlot Tracker · Data from official government portals.</p>
          <div className="flex gap-4 text-[12px] text-[--ink-600]">
            <span>🇮🇳 Made in India</span>
            <Link href="/sitemap.xml" className="hover:text-[--ink-400]">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
