import type { Achievement } from "@/lib/achievements";
import type { XpBreakdown } from "@/lib/adventure-xp";
import type { InventoryState } from "@/lib/inventory";
import type { LanguageLevel } from "@/lib/language-levels";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity, Progression } from "@/lib/types";

export type DeveloperProfile = {
  name: string;
  title: string;
  globalRank: string;
  level: number;
  codingXp: number;
  adventureXp: number;
  seasonXp?: number;
  mainLanguage?: string;
  strongestLanguage?: string;
  strongestTopic?: string;
  streak: number;
  bestDay?: string;
  achievementsUnlocked: number;
  achievementsTotal: number;
  itemsUnlocked: number;
  itemsTotal: number;
  currentSeason?: string;
  equippedItems: string[];
};

function strongestLanguage(levels: LanguageLevel[]) {
  return [...levels].sort((a, b) => b.xp - a.xp)[0]?.name;
}

function strongestTopic(topics: TopicProgress[] = []) {
  return [...topics].sort((a, b) => b.xp - a.xp)[0]?.name;
}

export function getDeveloperProfile({
  progression,
  xp,
  mainLanguage,
  languageLevels,
  topics = [],
  days,
  streak,
  achievements,
  inventory,
  currentSeason,
  title,
}: {
  progression: Progression;
  xp: XpBreakdown;
  mainLanguage?: string;
  languageLevels: LanguageLevel[];
  topics?: TopicProgress[];
  days: DailyCodingActivity[];
  streak: number;
  achievements: Achievement[];
  inventory: InventoryState;
  currentSeason?: string;
  title: string;
}): DeveloperProfile {
  const bestDay = days.filter((day) => day.xp > 0).toSorted((a, b) => b.xp - a.xp)[0];
  const rank = progression.rank?.currentRank ?? progression.rankProgress?.currentRank;
  const equippedItems = Object.values(inventory.equipped)
    .filter(Boolean)
    .map((id) => inventory.items.find((item) => item.id === id)?.name ?? id);

  return {
    name: "CodeFire Developer",
    title,
    globalRank: rank?.name ?? "Spark",
    level: progression.level,
    codingXp: xp.codingXp,
    adventureXp: xp.adventureXp,
    seasonXp: xp.seasonXp,
    mainLanguage,
    strongestLanguage: strongestLanguage(languageLevels),
    strongestTopic: strongestTopic(topics),
    streak,
    bestDay: bestDay?.date,
    achievementsUnlocked: achievements.filter((achievement) => achievement.unlocked).length,
    achievementsTotal: achievements.length,
    itemsUnlocked: inventory.unlockedCount,
    itemsTotal: inventory.items.length,
    currentSeason,
    equippedItems,
  };
}
