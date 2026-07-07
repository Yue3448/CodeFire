export const userGoals = {
  dailyGoalMinutes: 90,
  weeklyGoalMinutes: 600,
  mainLanguageGoal: "Python",
  mainLanguageDailyGoalMinutes: 60,
};

export function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function secondsToMinutes(seconds: number) {
  return Math.floor(Math.max(0, seconds) / 60);
}

export function getStableIndex(seed: string, size: number) {
  if (size <= 0) {
    return 0;
  }

  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash % size;
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
