import { clampPercent, secondsToMinutes, userGoals } from "@/lib/codefire-config";
import type { DailyCodingActivity } from "@/lib/types";

export type GoalItem = {
  label: string;
  target: number;
  progress: number;
  remaining: number;
  unit: "XP" | "мин";
  completed: boolean;
  percent: number;
};

export type GoalProgress = {
  daily: GoalItem;
  weekly: GoalItem;
  mainLanguage: GoalItem;
};

function languageMinutes(day: DailyCodingActivity, language: string) {
  return secondsToMinutes(
    day.languages.find((item) => item.name.toLowerCase() === language.toLowerCase())?.seconds ?? 0,
  );
}

function makeGoal(label: string, progress: number, target: number, unit: GoalItem["unit"]): GoalItem {
  return {
    label,
    target,
    progress,
    remaining: Math.max(0, target - progress),
    unit,
    completed: progress >= target,
    percent: clampPercent((progress / target) * 100),
  };
}

export function getGoalProgress(today: DailyCodingActivity, weekDays: DailyCodingActivity[]): GoalProgress {
  const weekXp = weekDays.reduce((sum, day) => sum + day.xp, 0);
  const languageProgress = languageMinutes(today, userGoals.mainLanguageGoal);

  return {
    daily: makeGoal("Сегодня", today.xp, userGoals.dailyGoalMinutes, "XP"),
    weekly: makeGoal("Неделя", weekXp, userGoals.weeklyGoalMinutes, "XP"),
    mainLanguage: makeGoal(userGoals.mainLanguageGoal, languageProgress, userGoals.mainLanguageDailyGoalMinutes, "мин"),
  };
}
