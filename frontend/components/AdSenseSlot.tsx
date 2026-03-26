import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSenseSlot({
  slot,
  format = "auto",
  className = "",
}: {
  slot?: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
}) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore duplicate push errors during local UI refreshes.
    }
  }, [client, slot]);

  if (!client || !slot) {
    return (
      <div className={`rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-r from-slate-100 to-slate-50 p-8 text-center text-slate-500 ${className}`}>
        <div className="mb-3 text-3xl">📢</div>
        <p className="mb-1 font-semibold">Advertisement Space</p>
        <p className="text-sm">Set `NEXT_PUBLIC_ADSENSE_CLIENT` and an ad slot id to enable Google AdSense.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
