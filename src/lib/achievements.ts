import { achievementCatalog, type AchievementCategory, type AchievementRarity } from "@/content/achievements";
import { getConditionProgress, type ConditionProgressContext } from "@/lib/condition-progress";
import type { DailyNote } from "@/lib/daily-notes";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { StepikEntry } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
  rarity?: AchievementRarity;
  progressLabel?: string;
};

export function getAchievements(
  days: DailyCodingActivity[],
  totalXP: number,
  options: {
    pomodoroStats?: PomodoroStats;
    notes?: DailyNote[];
    studyTasks?: StudyTask[];
    stepikEntries?: StepikEntry[];
    topics?: TopicProgress[];
    achievements?: Achievement[];
    inventoryItems?: ConditionProgressContext["inventoryItems"];
    seasonLevel?: number;
    seasonXp?: number;
    recoveryDays?: number;
    lightDays?: number;
  } = {},
): Achievement[] {
  const today = days.at(-1);
  const context: ConditionProgressContext = {
    scope: "history",
    date: today?.date,
    today,
    days,
    weekDays: days.slice(-7),
    totalCodingXp: totalXP,
    pomodoroStats: options.pomodoroStats,
    notes: options.notes,
    studyTasks: options.studyTasks,
    stepikEntries: options.stepikEntries,
    topics: options.topics,
    achievements: options.achievements,
    inventoryItems: options.inventoryItems,
    seasonLevel: options.seasonLevel,
    seasonXp: options.seasonXp,
    recoveryDays: options.recoveryDays,
    lightDays: options.lightDays,
  };

  return achievementCatalog.map((definition) => {
    const progress = getConditionProgress(definition.condition, context);

    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      category: definition.category,
      icon: definition.icon,
      unlocked: progress.completed,
      unlockedAt: progress.unlockedAt,
      progress: progress.current,
      target: progress.target,
      rarity: definition.rarity,
      progressLabel: progress.label,
    };
  });
}

export function getFeaturedAchievements(achievements: Achievement[]) {
  const unlocked = achievements
    .filter((achievement) => achievement.unlocked)
    .sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""));
  const locked = achievements
    .filter((achievement) => !achievement.unlocked)
    .sort((a, b) => {
      const aPercent = a.target ? (a.progress ?? 0) / a.target : 0;
      const bPercent = b.target ? (b.progress ?? 0) / b.target : 0;
      return bPercent - aPercent;
    });

  return [...unlocked.slice(0, 5), ...locked.slice(0, 7)].slice(0, 12);
}
