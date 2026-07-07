import type { DailyCodingActivity } from "@/lib/types";

export type StreakMilestone = {
  days: number;
  title: string;
};

export type StreakStats = {
  current: number;
  best: number;
  nextMilestone: StreakMilestone | null;
  daysToNextMilestone: number;
  title: string;
  status: string;
};

const milestones: StreakMilestone[] = [
  { days: 1, title: "Искра привычки" },
  { days: 3, title: "Малый костёр" },
  { days: 7, title: "Пламя недели" },
  { days: 14, title: "Железная привычка" },
  { days: 30, title: "Вечный огонь" },
  { days: 60, title: "Легендарная серия" },
  { days: 100, title: "Неугасаемый кодер" },
];

const dayInMs = 24 * 60 * 60 * 1000;

function dateKeyToUtcMs(dateKey: string) {
  const [year = 0, month = 1, day = 1] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDaysToDateKey(dateKey: string, days: number) {
  return new Date(dateKeyToUtcMs(dateKey) + days * dayInMs).toISOString().slice(0, 10);
}

function activeDateSet(dailyActivity: DailyCodingActivity[]) {
  return new Set(dailyActivity.filter((day) => day.xp > 0).map((day) => day.date));
}

export function calculateCurrentStreak(dailyActivity: DailyCodingActivity[], todayDate: string) {
  const activeDates = activeDateSet(dailyActivity);
  const startDate = activeDates.has(todayDate) ? todayDate : addDaysToDateKey(todayDate, -1);
  let streak = 0;

  for (let cursor = startDate; activeDates.has(cursor); cursor = addDaysToDateKey(cursor, -1)) {
    streak += 1;
  }

  return streak;
}

export function calculateBestStreak(dailyActivity: DailyCodingActivity[]) {
  const activeDays = dailyActivity.filter((day) => day.xp > 0).sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let current = 0;
  let previous: string | null = null;

  for (const day of activeDays) {
    const isConsecutive = previous ? addDaysToDateKey(previous, 1) === day.date : false;

    current = isConsecutive ? current + 1 : 1;
    best = Math.max(best, current);
    previous = day.date;
  }

  return best;
}

export function getNextStreakMilestone(currentStreak: number) {
  return milestones.find((milestone) => milestone.days > currentStreak) ?? null;
}

export function getStreakTitle(currentStreak: number) {
  return [...milestones].reverse().find((milestone) => currentStreak >= milestone.days)?.title ?? "Серия не начата";
}

export function getStreakStats(dailyActivity: DailyCodingActivity[], todayDate: string): StreakStats {
  const current = calculateCurrentStreak(dailyActivity, todayDate);
  const best = calculateBestStreak(dailyActivity);
  const nextMilestone = getNextStreakMilestone(current);
  const todayActive = dailyActivity.find((day) => day.date === todayDate)?.xp ?? 0;

  return {
    current,
    best,
    nextMilestone,
    daysToNextMilestone: nextMilestone ? nextMilestone.days - current : 0,
    title: getStreakTitle(current),
    status:
      todayActive > 0
        ? "Серия поддержана сегодня."
        : current > 0
          ? "Сегодня можно сделать короткую сессию, чтобы поддержать огонь."
          : "Серия начнётся с первого активного дня.",
  };
}
