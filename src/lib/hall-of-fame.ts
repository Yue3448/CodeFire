import type { Achievement } from "@/lib/achievements";
import type { BossFight } from "@/lib/boss-fights";
import type { InventoryItem, InventoryState } from "@/lib/inventory";
import type { LanguageLevel } from "@/lib/language-levels";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { Season } from "@/lib/seasons";
import type { StepikEntry } from "@/lib/stepik";
import type { DailyCodingActivity, Progression } from "@/lib/types";

export type HallOfFameEntry = {
  id: string;
  type:
    | "bestDay"
    | "bestWeek"
    | "bestStreak"
    | "bestLanguage"
    | "bestPomodoroDay"
    | "rarestItem"
    | "hardestBoss"
    | "highestRank"
    | "bestSeason"
    | "stepikRecord"
    | "achievement";
  title: string;
  value: string;
  description?: string;
  date?: string;
  icon?: string;
  rarity?: "common" | "rare" | "epic" | "legendary" | "mythic";
  sourceId?: string;
};

export type HallOfFameItem = HallOfFameEntry;

export type HallOfFame = {
  items: HallOfFameEntry[];
  podium: HallOfFameEntry[];
};

function rarityScore(rarity?: string) {
  return { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 }[rarity ?? "common"] ?? 1;
}

function difficultyScore(difficulty: BossFight["difficulty"]) {
  return { easy: 1, normal: 2, hard: 3, epic: 4, legendary: 5 }[difficulty];
}

function entryScore(entry: HallOfFameEntry) {
  const typeScore =
    {
      highestRank: 100,
      achievement: 90,
      hardestBoss: 85,
      rarestItem: 80,
      bestSeason: 72,
      bestStreak: 68,
      bestDay: 64,
      bestLanguage: 60,
      bestWeek: 55,
      bestPomodoroDay: 48,
      stepikRecord: 45,
    }[entry.type] ?? 0;

  return typeScore + rarityScore(entry.rarity) * 10;
}

function bestWeek(days: DailyCodingActivity[]) {
  const weeks = new Map<string, { start: string; xp: number }>();

  for (const day of days) {
    const date = new Date(`${day.date}T00:00:00`);
    const weekStart = new Date(date);
    const offset = date.getDay() === 0 ? 6 : date.getDay() - 1;
    weekStart.setDate(date.getDate() - offset);
    const key = weekStart.toISOString().slice(0, 10);
    const current = weeks.get(key) ?? { start: key, xp: 0 };
    current.xp += day.xp;
    weeks.set(key, current);
  }

  return [...weeks.values()].toSorted((a, b) => b.xp - a.xp)[0];
}

function bestLanguage(levels: LanguageLevel[], days: DailyCodingActivity[]) {
  const strongest = [...levels].toSorted((a, b) => b.xp - a.xp)[0];

  if (strongest) {
    return { name: strongest.name, xp: strongest.xp };
  }

  const totals = new Map<string, number>();
  for (const day of days) {
    for (const language of day.languages) {
      totals.set(language.name, (totals.get(language.name) ?? 0) + language.xp);
    }
  }

  const [name, xp] = [...totals.entries()].toSorted((a, b) => b[1] - a[1])[0] ?? [];
  return name ? { name, xp } : null;
}

function rarestUnlockedItem(inventory: InventoryState) {
  return inventory.items
    .filter((item) => item.unlocked)
    .toSorted((a, b) => rarityScore(b.rarity) - rarityScore(a.rarity) || a.name.localeCompare(b.name))[0];
}

function itemRarity(item?: InventoryItem): HallOfFameEntry["rarity"] {
  return item?.rarity;
}

export function getHallOfFame({
  days,
  progression,
  inventory,
  bosses,
  season,
  pomodoroStats,
  stepikEntries,
  achievements = [],
  languageLevels = [],
  bestStreak = 0,
}: {
  days: DailyCodingActivity[];
  progression: Progression;
  inventory: InventoryState;
  bosses: BossFight[];
  season?: Season;
  pomodoroStats?: PomodoroStats;
  stepikEntries: StepikEntry[];
  achievements?: Achievement[];
  languageLevels?: LanguageLevel[];
  bestStreak?: number;
}): HallOfFame {
  const bestDay = days.filter((day) => day.xp > 0).toSorted((a, b) => b.xp - a.xp)[0];
  const week = bestWeek(days);
  const language = bestLanguage(languageLevels, days);
  const rarestItem = rarestUnlockedItem(inventory);
  const hardestBoss = bosses
    .filter((boss) => boss.completed)
    .toSorted((a, b) => difficultyScore(b.difficulty) - difficultyScore(a.difficulty))[0];
  const bestStepik = stepikEntries.toSorted((a, b) => b.tasksSolved - a.tasksSolved)[0];
  const rank = progression.rank?.currentRank ?? progression.rankProgress?.currentRank;
  const rareAchievement = achievements
    .filter((achievement) => achievement.unlocked)
    .toSorted((a, b) => rarityScore(b.rarity) - rarityScore(a.rarity))[0];

  const items: HallOfFameEntry[] = [
    {
      id: "best-day",
      type: "bestDay",
      title: "Best coding day",
      value: bestDay ? `${bestDay.xp} XP` : "No data yet",
      description: bestDay ? "Highest real WakaTime day" : "Code a little to unlock this trophy.",
      date: bestDay?.date,
      icon: "DAY",
      rarity: bestDay && bestDay.xp >= 300 ? "epic" : bestDay && bestDay.xp >= 120 ? "rare" : "common",
    },
    {
      id: "best-week",
      type: "bestWeek",
      title: "Best coding week",
      value: week && week.xp > 0 ? `${week.xp} XP` : "No data yet",
      description: week?.start,
      date: week?.start,
      icon: "WK",
      rarity: week && week.xp >= 1200 ? "legendary" : week && week.xp >= 600 ? "epic" : "rare",
    },
    {
      id: "best-streak",
      type: "bestStreak",
      title: "Best streak",
      value: bestStreak > 0 ? `${bestStreak} days` : "No streak yet",
      description: "Longest coding rhythm",
      icon: "STR",
      rarity: bestStreak >= 30 ? "legendary" : bestStreak >= 14 ? "epic" : bestStreak >= 7 ? "rare" : "common",
    },
    {
      id: "best-language",
      type: "bestLanguage",
      title: "Strongest language",
      value: language?.name ?? "No data yet",
      description: language ? `${language.xp} XP` : undefined,
      icon: "LAN",
      rarity: "rare",
    },
    {
      id: "rarest-item",
      type: "rarestItem",
      title: "Rarest item",
      value: rarestItem?.name ?? "No item unlocked",
      description: rarestItem?.rarity,
      icon: rarestItem?.icon ?? "ITM",
      rarity: itemRarity(rarestItem),
      sourceId: rarestItem?.id,
    },
    {
      id: "hardest-boss",
      type: "hardestBoss",
      title: "Hardest boss",
      value: hardestBoss?.title ?? "No boss defeated",
      description: hardestBoss?.difficulty,
      date: hardestBoss?.completedAt?.slice(0, 10),
      icon: "BOS",
      rarity: hardestBoss?.difficulty === "legendary" ? "legendary" : hardestBoss ? "epic" : "common",
      sourceId: hardestBoss?.id,
    },
    {
      id: "highest-rank",
      type: "highestRank",
      title: "Highest rank",
      value: rank?.name ?? "Spark",
      description: `${progression.totalXP} real Coding XP`,
      icon: "RNK",
      rarity: rank && rank.minXp >= 22000 ? "legendary" : rank && rank.minXp >= 7500 ? "epic" : "rare",
      sourceId: rank?.id,
    },
    {
      id: "best-season",
      type: "bestSeason",
      title: "Current season",
      value: season?.title ?? "No season",
      description: season?.active ? "Active learning season" : undefined,
      date: season?.startDate,
      icon: "SEA",
      rarity: season ? "rare" : "common",
      sourceId: season?.id,
    },
    {
      id: "best-pomodoro-day",
      type: "bestPomodoroDay",
      title: "Best Pomodoro day",
      value: pomodoroStats?.bestDay ? `${pomodoroStats.bestDay.completedSessions} sessions` : "No data yet",
      description: pomodoroStats?.bestDay?.date,
      date: pomodoroStats?.bestDay?.date,
      icon: "POM",
      rarity: pomodoroStats?.bestDay && pomodoroStats.bestDay.completedSessions >= 6 ? "epic" : "rare",
    },
    {
      id: "stepik-record",
      type: "stepikRecord",
      title: "Best Stepik day",
      value: bestStepik ? `${bestStepik.tasksSolved} tasks` : "No Stepik data",
      description: bestStepik?.topic,
      date: bestStepik?.date,
      icon: "STP",
      rarity: bestStepik && bestStepik.tasksSolved >= 8 ? "epic" : "rare",
      sourceId: bestStepik?.id,
    },
  ];

  if (rareAchievement) {
    items.push({
      id: `achievement-${rareAchievement.id}`,
      type: "achievement",
      title: "Rare achievement",
      value: rareAchievement.title,
      description: rareAchievement.description,
      date: rareAchievement.unlockedAt,
      icon: rareAchievement.icon,
      rarity: rareAchievement.rarity,
      sourceId: rareAchievement.id,
    });
  }

  const sorted = items.toSorted((a, b) => entryScore(b) - entryScore(a));

  return {
    items: sorted,
    podium: sorted.slice(0, 3),
  };
}
