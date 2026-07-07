import { clampPercent, secondsToMinutes } from "@/lib/codefire-config";
import { isExcludedLanguage } from "@/lib/activity-filters";
import { getLanguageRankProgress, type LanguageRankProgress } from "@/lib/language-ranks";
import type { DailyCodingActivity } from "@/lib/types";

export type LanguageLevel = {
  name: string;
  xp: number;
  level: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpForLevel: number;
  progressPercent: number;
  rankProgress: LanguageRankProgress;
};

function getLanguageLevel(xp: number) {
  return Math.floor(Math.sqrt(Math.max(xp, 0) / 50)) + 1;
}

export function getLanguageLevels(days: DailyCodingActivity[]): LanguageLevel[] {
  const totals = new Map<string, number>();

  for (const day of days) {
    for (const language of day.languages) {
      if (isExcludedLanguage(language.name)) {
        continue;
      }

      totals.set(language.name, (totals.get(language.name) ?? 0) + secondsToMinutes(language.seconds));
    }
  }

  return [...totals.entries()]
    .map(([name, xp]) => {
      const level = getLanguageLevel(xp);
      const currentLevelXp = 50 * (level - 1) ** 2;
      const nextLevelXp = 50 * level ** 2;
      const xpIntoLevel = xp - currentLevelXp;
      const xpForLevel = nextLevelXp - currentLevelXp;

      return {
        name,
        xp,
        level,
        nextLevelXp,
        xpIntoLevel,
        xpForLevel,
        progressPercent: clampPercent((xpIntoLevel / xpForLevel) * 100),
        rankProgress: getLanguageRankProgress(xp),
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);
}
