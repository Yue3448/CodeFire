export const HEATMAP_LEGEND_XP_VALUES = [0, 1, 31, 61, 121, 241] as const;

export function getHeatmapIntensityClass(xp: number) {
  if (xp <= 0) {
    return "border-white/10 bg-white/[0.045]";
  }

  if (xp <= 30) {
    return "border-emerald-950/80 bg-[#0f2a1f]";
  }

  if (xp <= 60) {
    return "border-emerald-800/70 bg-[#14532d]";
  }

  if (xp <= 120) {
    return "border-emerald-500/50 bg-[#16a34a]";
  }

  if (xp <= 240) {
    return "border-emerald-300/60 bg-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.24)]";
  }

  return "border-emerald-100/80 bg-[#86efac] shadow-[0_0_14px_rgba(134,239,172,0.42)]";
}
