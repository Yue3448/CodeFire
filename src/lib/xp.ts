import type { ProductivityStatus, Progression } from "@/lib/types";
import { getRankProgress } from "@/lib/ranks";
import { getTodayStatus } from "@/lib/status-phrases";

export function secondsToXP(seconds: number) {
  return Math.floor(Math.max(seconds, 0) / 60);
}

export function getLevel(totalXP: number) {
  return Math.floor(Math.sqrt(Math.max(totalXP, 0) / 100)) + 1;
}

export function getProgression(totalXP: number, todayXP: number): Progression {
  const safeTotal = Math.max(totalXP, 0);
  const level = getLevel(safeTotal);
  const rankProgress = getRankProgress(safeTotal);
  const currentLevelXP = 100 * (level - 1) ** 2;
  const nextLevelXP = 100 * level ** 2;
  const xpIntoLevel = safeTotal - currentLevelXP;
  const xpForLevel = nextLevelXP - currentLevelXP;
  const progressPercent =
    xpForLevel === 0 ? 100 : Math.min(100, Math.max(0, (xpIntoLevel / xpForLevel) * 100));

  return {
    totalXP: safeTotal,
    todayXP,
    level,
    currentLevelXP,
    nextLevelXP,
    xpIntoLevel,
    xpForLevel,
    progressPercent,
    rank: rankProgress,
    rankProgress,
  };
}

export function getProductivityStatus(todayXP: number, dateKey?: string): ProductivityStatus {
  const status = getTodayStatus(todayXP, dateKey);

  return {
    label: status.title,
    tone: status.tone,
    description: status.description,
  };
}
