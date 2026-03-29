import { useEffect } from "react";

declare global {
  interface Window { adsbygoogle?: unknown[]; }
}

type AdFormat = "auto" | "rectangle" | "horizontal" | "vertical";

interface Props {
  slot?: string;
  format?: AdFormat;
  className?: string;
  label?: string;
}

// Placeholder mock ad images for demo
const PLACEHOLDER_ADS = [
  {
    img: "https://placehold.co/728x90/0d7a68/ffffff?text=Advertisement+|+Real+Estate+Deals&font=Playfair+Display",
    label: "Leaderboard (728×90)",
    height: 90,
  },
  {
    img: "https://placehold.co/300x250/0d7a68/ffffff?text=Ad+Space+300×250&font=Playfair+Display",
    label: "Rectangle (300×250)",
    height: 250,
  },
  {
    img: "https://placehold.co/336x280/11503e/ffffff?text=Premium+Ad+Slot&font=Playfair+Display",
    label: "Large Rectangle (336×280)",
    height: 280,
  },
];

export default function AdSenseSlot({
  slot,
  format = "auto",
  className = "",
  label,
}: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !slot) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, [client, slot]);

  // Real AdSense
  if (client && slot) {
    return (
      <div className={`overflow-hidden rounded-xl border border-[--ink-100] bg-white ${className}`}>
        <ins
          className="adsbygoogle block"
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Placeholder
  const placeholderIndex = format === "horizontal" ? 0 : format === "vertical" ? 2 : 1;
  const placeholder = PLACEHOLDER_ADS[placeholderIndex];

  return (
    <div className={`ads-placeholder ${className}`}>
      <div className="relative z-10 text-center px-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[--teal-600] mb-2">Advertisement</div>
        <div
          className="rounded-lg overflow-hidden border border-[--teal-200] shadow-sm mx-auto"
          style={{ maxWidth: format === "horizontal" ? 728 : 320 }}
        >
          <div
            className="flex items-center justify-center bg-gradient-to-br from-[--teal-800] to-[--ink-800] text-white text-center p-6"
            style={{ minHeight: format === "horizontal" ? 72 : 160 }}
          >
            <div>
              <div className="text-2xl mb-2">🏠</div>
              <p className="text-sm font-semibold text-[--teal-300]">Your Ad Here</p>
              <p className="text-[11px] text-[--teal-400] mt-1">{label || placeholder.label}</p>
              <div className="mt-3 inline-block bg-[--saffron-500] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                Real Estate · Gov Schemes · Investment
              </div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[--ink-400] mt-2">Set NEXT_PUBLIC_ADSENSE_CLIENT to enable Google AdSense</p>
      </div>
    </div>
  );
}
