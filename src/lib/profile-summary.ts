import type { Achievement } from "@/lib/achievements";
import type { InventoryItem, InventoryState } from "@/lib/inventory";
import type { LanguageLevel } from "@/lib/language-levels";
import type { LearningRpg } from "@/lib/learning-rpg";
import type { StreakStats } from "@/lib/streaks";
import type { DailyCodingActivity, Progression } from "@/lib/types";

export type ProfileSummary = {
  name: string;
  title: string;
  rank: string;
  level: number;
  codingXp: number;
  adventureXp: number;
  seasonXp: number;
  mainLanguage?: string;
  strongestLanguage?: string;
  strongestTopic?: string;
  currentStreak: number;
  bestStreak?: number;
  bestDay?: string;
  activeDays?: number;
  totalCodingTimeMinutes?: number;
  averageActiveDayMinutes?: number;
  topProject?: string;
  achievementsUnlocked: number;
  achievementsTotal: number;
  itemsUnlocked: number;
  itemsTotal: number;
};

export type ProfileEquipmentSlot = "artifact" | "amulet" | "ring" | "book" | "weapon" | "cloak";

export type ProfileEquipmentSlotSummary = {
  slot: ProfileEquipmentSlot;
  label: string;
  item: InventoryItem | null;
};

export type ProfileAchievementsSummary = {
  unlocked: number;
  total: number;
  progressPercent: number;
  recent: Achievement[];
  rarest: Achievement | null;
  next: Achievement | null;
  nextProgressPercent: number;
};

const equipmentSlots = [
  { slot: "artifact", label: "Artifact" },
  { slot: "amulet", label: "Amulet" },
  { slot: "ring", label: "Ring" },
  { slot: "book", label: "Book" },
  { slot: "weapon", label: "Weapon" },
  { slot: "cloak", label: "Cloak" },
] satisfies Array<{ slot: ProfileEquipmentSlot; label: string }>;

const rarityWeight: Record<NonNullable<Achievement["rarity"]>, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

function strongestLanguage(levels: LanguageLevel[]) {
  return [...levels].sort((a, b) => b.xp - a.xp)[0]?.name;
}

function totalCodingMinutes(days: DailyCodingActivity[]) {
  return Math.round(days.reduce((sum, day) => sum + day.codingSeconds, 0) / 60);
}

function topProject(days: DailyCodingActivity[]) {
  const totals = new Map<string, number>();

  for (const day of days) {
    for (const project of day.projects ?? []) {
      totals.set(project.name, (totals.get(project.name) ?? 0) + project.seconds);
    }
  }

  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function achievementProgress(achievement: Achievement) {
  if (!achievement.target || achievement.target <= 0) return 0;
  return Math.min(100, Math.max(0, ((achievement.progress ?? 0) / achievement.target) * 100));
}

export function calculateProfileSummary({
  learning,
  progression,
  today,
  days,
  achievements,
  languageLevels,
  streak,
}: {
  learning: LearningRpg;
  progression: Progression;
  today?: { mainLanguage?: string };
  days: DailyCodingActivity[];
  achievements: Achievement[];
  languageLevels: LanguageLevel[];
  streak?: StreakStats | null;
}): ProfileSummary {
  const profile = learning.profile;
  const activeDays = days.filter((day) => day.xp > 0).length;
  const codingMinutes = totalCodingMinutes(days);

  return {
    name: profile.name,
    title: profile.title,
    rank: profile.globalRank,
    level: profile.level,
    codingXp: progression.totalXP,
    adventureXp: profile.adventureXp,
    seasonXp: profile.seasonXp ?? 0,
    mainLanguage: today?.mainLanguage ?? profile.mainLanguage,
    strongestLanguage: profile.strongestLanguage ?? strongestLanguage(languageLevels),
    strongestTopic: profile.strongestTopic,
    currentStreak: streak?.current ?? profile.streak,
    bestStreak: streak?.best,
    bestDay: profile.bestDay,
    activeDays,
    totalCodingTimeMinutes: codingMinutes,
    averageActiveDayMinutes: activeDays > 0 ? Math.round(codingMinutes / activeDays) : 0,
    topProject: topProject(days),
    achievementsUnlocked: achievements.filter((achievement) => achievement.unlocked).length,
    achievementsTotal: achievements.length,
    itemsUnlocked: learning.inventory.unlockedCount,
    itemsTotal: learning.inventory.items.length,
  };
}

export function getEquippedItemsSummary(inventory: InventoryState): ProfileEquipmentSlotSummary[] {
  const equippedBySlot = new Map<ProfileEquipmentSlot, InventoryItem>();

  for (const slot of equipmentSlots) {
    const equippedId = inventory.equipped[slot.slot as keyof InventoryState["equipped"]];
    const item = equippedId ? inventory.items.find((entry) => entry.id === equippedId && entry.unlocked) : null;
    if (item) equippedBySlot.set(slot.slot, item);
  }

  for (const item of inventory.items) {
    if (!item.equipped || !item.unlocked) continue;
    if (equipmentSlots.some((slot) => slot.slot === item.type) && !equippedBySlot.has(item.type as ProfileEquipmentSlot)) {
      equippedBySlot.set(item.type as ProfileEquipmentSlot, item);
    }
  }

  return equipmentSlots.map((slot) => ({
    ...slot,
    item: equippedBySlot.get(slot.slot) ?? null,
  }));
}

export function getProfileAchievementsSummary(achievements: Achievement[]): ProfileAchievementsSummary {
  const unlockedAchievements = achievements
    .filter((achievement) => achievement.unlocked)
    .sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""));
  const lockedAchievements = achievements
    .filter((achievement) => !achievement.unlocked)
    .sort((a, b) => achievementProgress(b) - achievementProgress(a));
  const rarest =
    [...unlockedAchievements].sort((a, b) => {
      const rarityDelta = rarityWeight[b.rarity ?? "common"] - rarityWeight[a.rarity ?? "common"];
      if (rarityDelta !== 0) return rarityDelta;
      return (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? "");
    })[0] ?? null;
  const next = lockedAchievements[0] ?? null;

  return {
    unlocked: unlockedAchievements.length,
    total: achievements.length,
    progressPercent: achievements.length > 0 ? (unlockedAchievements.length / achievements.length) * 100 : 0,
    recent: unlockedAchievements.slice(0, 5),
    rarest,
    next,
    nextProgressPercent: next ? achievementProgress(next) : 0,
  };
}
