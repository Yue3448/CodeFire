import { secondsToMinutes } from "@/lib/codefire-config";
import type { DailyCodingActivity } from "@/lib/types";

export type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  totalXp: number;
  totalHours: number;
  activeDays: number;
  bestDay: DailyCodingActivity | null;
  topLanguage: string | null;
  topProject?: string | null;
  summary: string;
};

export type WeekComparison = {
  hasPreviousWeek: boolean;
  currentXp: number;
  previousXp: number;
  diffXp: number;
  diffPercent: number | null;
  currentActiveDays: number;
  previousActiveDays: number;
  activeDaysDiff: number;
  topLanguage: string | null;
  summary: string;
};

function languageTotals(days: DailyCodingActivity[]) {
  const totals = new Map<string, number>();

  for (const day of days) {
    for (const language of day.languages) {
      totals.set(language.name, (totals.get(language.name) ?? 0) + language.seconds);
    }
  }

  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function projectTotals(days: DailyCodingActivity[]) {
  const totals = new Map<string, number>();

  for (const day of days) {
    for (const project of day.projects ?? []) {
      totals.set(project.name, (totals.get(project.name) ?? 0) + project.seconds);
    }
  }

  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function getCurrentWeekDays(days: DailyCodingActivity[], todayDate: string) {
  const today = new Date(`${todayDate}T00:00:00`);
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  const weekStartKey = weekStart.toISOString().slice(0, 10);

  return days.filter((day) => day.date >= weekStartKey && day.date <= todayDate);
}

export function getPreviousWeekDays(days: DailyCodingActivity[], todayDate: string) {
  const today = new Date(`${todayDate}T00:00:00`);
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - dayOfWeek);
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(currentWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setDate(currentWeekStart.getDate() - 1);

  return days.filter(
    (day) =>
      day.date >= previousWeekStart.toISOString().slice(0, 10) &&
      day.date <= previousWeekEnd.toISOString().slice(0, 10),
  );
}

export function getWeeklyReport(weekDays: DailyCodingActivity[]): WeeklyReport {
  const totalXp = weekDays.reduce((sum, day) => sum + day.xp, 0);
  const totalSeconds = weekDays.reduce((sum, day) => sum + day.codingSeconds, 0);
  const activeDays = weekDays.filter((day) => day.xp > 0).length;
  const bestDay = weekDays.filter((day) => day.xp > 0).toSorted((a, b) => b.xp - a.xp)[0] ?? null;
  const topLanguage = languageTotals(weekDays);
  const topProject = projectTotals(weekDays);
  const weekStart = weekDays[0]?.date ?? "";
  const weekEnd = weekDays.at(-1)?.date ?? "";

  return {
    weekStart,
    weekEnd,
    totalXp,
    totalHours: Math.round((secondsToMinutes(totalSeconds) / 60) * 10) / 10,
    activeDays,
    bestDay,
    topLanguage,
    topProject,
    summary:
      activeDays === 0
        ? "Неделя пока ждёт первой практики."
        : `Неделя ${activeDays >= 5 ? "стабильная" : "набирает темп"}: ${activeDays} активных дней, главный язык — ${topLanguage ?? "нет данных"}.`,
  };
}

export function getWeekComparison(currentWeek: DailyCodingActivity[], previousWeek: DailyCodingActivity[]): WeekComparison {
  const currentXp = currentWeek.reduce((sum, day) => sum + day.xp, 0);
  const previousXp = previousWeek.reduce((sum, day) => sum + day.xp, 0);
  const currentActiveDays = currentWeek.filter((day) => day.xp > 0).length;
  const previousActiveDays = previousWeek.filter((day) => day.xp > 0).length;
  const diffXp = currentXp - previousXp;
  const diffPercent = previousXp > 0 ? Math.round((diffXp / previousXp) * 100) : null;
  const topLanguage = languageTotals(currentWeek);

  return {
    hasPreviousWeek: previousWeek.some((day) => day.xp > 0),
    currentXp,
    previousXp,
    diffXp,
    diffPercent,
    currentActiveDays,
    previousActiveDays,
    activeDaysDiff: currentActiveDays - previousActiveDays,
    topLanguage,
    summary:
      previousXp > 0
        ? `${diffXp >= 0 ? "Рост" : "Спад"}: ${diffXp >= 0 ? "+" : ""}${diffXp} XP${diffPercent === null ? "" : ` (${diffPercent >= 0 ? "+" : ""}${diffPercent}%)`}.`
        : "Недостаточно данных для сравнения с прошлой неделей.",
  };
}
