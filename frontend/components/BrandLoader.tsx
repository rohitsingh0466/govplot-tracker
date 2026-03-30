type BrandLoaderProps = {
  label?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  compact?: boolean;
};

export default function BrandLoader({
  label = "Loading GovPlot Tracker...",
  fullScreen = false,
  overlay = false,
  compact = false,
}: BrandLoaderProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "gap-3" : "gap-4"}`}>
      <div className="relative">
        <div className={`${compact ? "w-16 h-16" : "w-20 h-20"} rounded-[28px] bg-white/90 border border-[--ink-100] shadow-[--shadow-lg] flex items-center justify-center`}>
          <div className={`${compact ? "w-11 h-11 text-xl" : "w-14 h-14 text-2xl"} rounded-2xl bg-gradient-to-br from-[--teal-500] via-[--teal-600] to-[--teal-800] text-white flex items-center justify-center shadow-[--shadow-teal]`}>
            🏠
          </div>
        </div>
        <span className="brand-loader-ring brand-loader-ring-one" />
        <span className="brand-loader-ring brand-loader-ring-two" />
      </div>

      <div>
        <div className={`font-[Outfit] font-800 text-[--ink-900] ${compact ? "text-[17px]" : "text-[20px]"}`}>
          GovPlot Tracker
        </div>
        <p className={`text-[--ink-500] ${compact ? "text-[12px]" : "text-[13.5px]"} mt-1`}>
          {label}
        </p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-white/78 backdrop-blur-sm px-6">
        {content}
      </div>
    );
  }

  return content;
}
