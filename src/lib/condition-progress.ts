import type { CodeFireCondition, CodeFirePeriod } from "@/content/conditions";
import type { BossFight } from "@/lib/boss-fights";
import { hasDailyNoteContent, type DailyNote } from "@/lib/daily-notes";
import type { PomodoroStats } from "@/lib/pomodoro";
import { getAllRanks } from "@/lib/ranks";
import type { StepikEntry } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";

export type ConditionProgress = {
  current: number;
  target: number;
  percent: number;
  completed: boolean;
  label: string;
  unlockedAt?: string;
};

export type ConditionProgressContext = {
  scope?: "live" | "history";
  date?: string;
  today?: DailyCodingActivity;
  days?: DailyCodingActivity[];
  weekDays?: DailyCodingActivity[];
  mainLanguage?: string;
  yesterday?: DailyCodingActivity;
  pomodoroStats?: PomodoroStats;
  todayNote?: DailyNote | null;
  notes?: DailyNote[];
  studyTasks?: StudyTask[];
  stepikEntries?: StepikEntry[];
  topics?: TopicProgress[];
  bosses?: BossFight[];
  quests?: Array<{ completed?: boolean }>;
  weeklyQuests?: Array<{ completed?: boolean }>;
  inventoryItems?: Array<{ id: string; rarity?: string; unlocked?: boolean; equipped?: boolean; unlockedAt?: string }>;
  achievements?: Array<{ id: string; rarity?: string; unlocked?: boolean; unlockedAt?: string }>;
  seasonLevel?: number;
  seasonXp?: number;
  lightDays?: number;
  recoveryDays?: number;
  totalCodingXp?: number;
};

const dayInMs = 24 * 60 * 60 * 1000;

function clamp(current: number, target: number, unlockedAt?: string): ConditionProgress {
  const safeTarget = Math.max(1, target);
  const safeCurrent = Math.max(0, Math.round(current));

  return {
    current: Math.min(safeCurrent, safeTarget),
    target: safeTarget,
    percent: Math.min(100, Math.round((safeCurrent / safeTarget) * 100)),
    completed: safeCurrent >= safeTarget,
    label: `${Math.min(safeCurrent, safeTarget)} / ${safeTarget}`,
    unlockedAt: safeCurrent >= safeTarget ? unlockedAt : undefined,
  };
}

function dateKeyToUtcMs(dateKey: string) {
  const [year = 0, month = 1, day = 1] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDays(dateKey: string, days: number) {
  return new Date(dateKeyToUtcMs(dateKey) + days * dayInMs).toISOString().slice(0, 10);
}

function weekStart(dateKey: string) {
  const date = new Date(dateKeyToUtcMs(dateKey));
  const day = date.getUTCDay();
  return addDays(dateKey, day === 0 ? -6 : 1 - day);
}

function getContextDate(context: ConditionProgressContext) {
  return context.date ?? context.today?.date ?? context.days?.at(-1)?.date ?? new Date().toISOString().slice(0, 10);
}

function daysForPeriod(context: ConditionProgressContext, period: CodeFirePeriod = "all") {
  if (period === "week") {
    if (context.weekDays?.length) return context.weekDays;
    const start = weekStart(getContextDate(context));
    return (context.days ?? []).filter((day) => day.date >= start && day.date <= getContextDate(context));
  }

  if (period === "day") {
    if (context.scope === "live" && context.today) return [context.today];
    return context.days?.length ? context.days : context.today ? [context.today] : [];
  }

  return context.days?.length ? context.days : context.today ? [context.today] : [];
}

function firstDayMatching(days: DailyCodingActivity[], predicate: (day: DailyCodingActivity) => boolean) {
  return [...days].sort((a, b) => a.date.localeCompare(b.date)).find(predicate)?.date;
}

function codingMinutes(day: DailyCodingActivity) {
  return Math.floor(day.codingSeconds / 60);
}

function languageSeconds(day: DailyCodingActivity, language: string) {
  return day.languages.find((item) => item.name.toLowerCase() === language.toLowerCase())?.seconds ?? 0;
}

function languageXp(day: DailyCodingActivity, language: string) {
  return day.languages.find((item) => item.name.toLowerCase() === language.toLowerCase())?.xp ?? 0;
}

function languageCountForPeriod(context: ConditionProgressContext, condition: Extract<CodeFireCondition, { kind: "languageCount" }>) {
  const totals = new Map<string, { xp: number; minutes: number }>();

  for (const day of daysForPeriod(context, condition.period ?? "all")) {
    for (const language of day.languages) {
      const current = totals.get(language.name) ?? { xp: 0, minutes: 0 };
      current.xp += language.xp;
      current.minutes += Math.floor(language.seconds / 60);
      totals.set(language.name, current);
    }
  }

  return [...totals.values()].filter((entry) => {
    if (condition.minXp !== undefined && entry.xp < condition.minXp) return false;
    if (condition.minMinutes !== undefined && entry.minutes < condition.minMinutes) return false;
    return entry.xp > 0 || entry.minutes > 0;
  }).length;
}

function focusPercent(day: DailyCodingActivity) {
  if (day.codingSeconds <= 0) return 0;
  return Math.round(((day.languages[0]?.seconds ?? 0) / day.codingSeconds) * 100);
}

function bestStreak(days: DailyCodingActivity[]) {
  const active = [...days].filter((day) => day.xp > 0).sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let current = 0;
  let previous: string | null = null;

  for (const day of active) {
    current = previous && addDays(previous, 1) === day.date ? current + 1 : 1;
    best = Math.max(best, current);
    previous = day.date;
  }

  return best;
}

function firstStreakDate(days: DailyCodingActivity[], target: number) {
  const active = [...days].filter((day) => day.xp > 0).sort((a, b) => a.date.localeCompare(b.date));
  let current = 0;
  let previous: string | null = null;

  for (const day of active) {
    current = previous && addDays(previous, 1) === day.date ? current + 1 : 1;
    previous = day.date;
    if (current >= target) return day.date;
  }

  return undefined;
}

function entriesForPeriod<T extends { date: string }>(items: T[] | undefined, context: ConditionProgressContext, period: CodeFirePeriod = "all") {
  const entries = items ?? [];
  if (period === "day") return entries.filter((item) => item.date === getContextDate(context));
  if (period === "week") {
    const start = weekStart(getContextDate(context));
    return entries.filter((item) => item.date >= start && item.date <= getContextDate(context));
  }
  return entries;
}

function noteHasField(note: DailyNote, field: "any" | "before" | "after" | "text" = "any") {
  if (field === "before") return Boolean(note.beforeText?.trim());
  if (field === "after") return Boolean(note.afterText?.trim());
  if (field === "text") return Boolean(note.text?.trim());
  return hasDailyNoteContent(note);
}

function getNoteEntries(context: ConditionProgressContext, condition: Extract<CodeFireCondition, { kind: "journalNotes" }>) {
  if (condition.period === "day") {
    return context.todayNote ? [context.todayNote] : (context.notes ?? []).filter((note) => note.date === getContextDate(context));
  }

  return entriesForPeriod(context.notes, context, condition.period).filter((note) => noteHasField(note, condition.field));
}

function topicMatches(value: string | undefined, expected: string | undefined) {
  if (!expected) return true;
  return value?.toLowerCase().includes(expected.toLowerCase()) ?? false;
}

function getStepikStreak(entries: StepikEntry[]) {
  const activeDates = new Set(entries.filter((entry) => entry.tasksSolved > 0).map((entry) => entry.date));
  let best = 0;
  let current = 0;
  let previous: string | null = null;

  for (const date of [...activeDates].sort()) {
    current = previous && addDays(previous, 1) === date ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  }

  return best;
}

function recoveryDayCount(days: DailyCodingActivity[]) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.filter((day, index) => {
    const previous = sorted[index - 1];
    return Boolean(previous && previous.xp >= 240 && day.xp > 0 && day.xp <= 120);
  }).length;
}

function lightDayCount(days: DailyCodingActivity[]) {
  return days.filter((day) => day.xp > 0 && day.xp <= 60).length;
}

function progressFromDays(
  context: ConditionProgressContext,
  period: CodeFirePeriod | undefined,
  target: number,
  valueForDay: (day: DailyCodingActivity) => number,
  sumForPeriod = true,
) {
  const days = daysForPeriod(context, period);
  const values = days.map(valueForDay);
  const current =
    period === "day" && context.scope !== "live"
      ? Math.max(0, ...values)
      : sumForPeriod
        ? values.reduce((sum, value) => sum + value, 0)
        : Math.max(0, ...values);
  const unlockedAt = firstDayMatching(days, (day) => valueForDay(day) >= target);
  return clamp(current, target, unlockedAt);
}

export function getConditionProgress(
  condition: CodeFireCondition,
  context: ConditionProgressContext,
): ConditionProgress {
  if (condition.kind === "codingMinutes") {
    return progressFromDays(context, condition.period, condition.target, codingMinutes);
  }

  if (condition.kind === "codingXp") {
    if (condition.period === "all") {
      const days = daysForPeriod(context, "all");
      let total = 0;
      let unlockedAt: string | undefined;
      for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
        total += day.xp;
        if (!unlockedAt && total >= condition.target) unlockedAt = day.date;
      }
      return clamp(context.totalCodingXp ?? total, condition.target, unlockedAt);
    }
    return progressFromDays(context, condition.period, condition.target, (day) => day.xp);
  }

  if (condition.kind === "activeDays") {
    const days = daysForPeriod(context, condition.period ?? "all");
    const current = condition.period === "week" ? days.filter((day) => day.xp > 0).length : bestStreak(days);
    return clamp(current, condition.target, condition.period === "week" ? days.find((day) => day.xp > 0)?.date : firstStreakDate(days, condition.target));
  }

  if (condition.kind === "languageMinutes") {
    return progressFromDays(context, condition.period, condition.target, (day) => Math.floor(languageSeconds(day, condition.language) / 60));
  }

  if (condition.kind === "languageXp") {
    return progressFromDays(context, condition.period, condition.target, (day) => languageXp(day, condition.language));
  }

  if (condition.kind === "languageCount") {
    return clamp(languageCountForPeriod(context, condition), condition.target);
  }

  if (condition.kind === "mainLanguageMinutes") {
    const language = context.mainLanguage;
    if (!language || language === "Нет кода") return clamp(0, condition.target);
    return progressFromDays(context, condition.period, condition.target, (day) => Math.floor(languageSeconds(day, language) / 60));
  }

  if (condition.kind === "focusPercent") {
    return progressFromDays(context, condition.period, condition.target, focusPercent, false);
  }

  if (condition.kind === "focusDays") {
    const days = daysForPeriod(context, condition.period ?? "all");
    return clamp(days.filter((day) => focusPercent(day) >= condition.minPercent).length, condition.target);
  }

  if (condition.kind === "pomodoroFocus") {
    const stats = context.pomodoroStats;
    const current = condition.period === "day"
      ? stats?.todayCompletedFocusSessions ?? 0
      : condition.period === "week"
        ? stats?.weekCompletedFocusSessions ?? 0
        : stats?.totalCompletedFocusSessions ?? 0;
    return clamp(current, condition.target, stats?.bestDay?.date);
  }

  if (condition.kind === "pomodoroBreak") {
    const stats = context.pomodoroStats;
    const current = condition.period === "day"
      ? stats?.todayCompletedBreakSessions ?? 0
      : stats?.totalCompletedSessions ?? 0;
    return clamp(current, condition.target);
  }

  if (condition.kind === "pomodoroFocusBreakPairs") {
    const stats = context.pomodoroStats;
    const current = condition.period === "day"
      ? Math.min(stats?.todayCompletedFocusSessions ?? 0, stats?.todayCompletedBreakSessions ?? 0)
      : Math.min(stats?.totalCompletedFocusSessions ?? 0, stats?.totalCompletedSessions ?? 0);
    return clamp(current, condition.target);
  }

  if (condition.kind === "pomodoroFocusMinutes") {
    const stats = context.pomodoroStats;
    const current = condition.period === "day"
      ? stats?.todayFocusMinutes ?? 0
      : condition.period === "week"
        ? stats?.weekFocusMinutes ?? 0
        : stats?.last30DaysFocusMinutes ?? 0;
    return clamp(current, condition.target, stats?.bestDay?.date);
  }

  if (condition.kind === "journalNotes") {
    const notes = getNoteEntries(context, condition);
    return clamp(notes.length, condition.target, notes.find((note) => noteHasField(note, condition.field))?.date);
  }

  if (condition.kind === "studyTasks") {
    const tasks = entriesForPeriod(context.studyTasks, context, condition.period).filter((task) => {
      const statusMatch = condition.status
        ? task.status === condition.status
        : task.status !== "active" && task.status !== "paused" && task.status !== "archived";
      const sourceMatch = condition.source ? task.source.toLowerCase() === condition.source.toLowerCase() : true;
      const topicMatch = topicMatches(task.topic, condition.topic);
      const difficultyMatch = condition.minDifficulty ? task.difficulty >= condition.minDifficulty : true;
      return statusMatch && sourceMatch && topicMatch && difficultyMatch;
    });
    return clamp(tasks.length, condition.target, tasks.at(-1)?.date ?? tasks[0]?.date);
  }

  if (condition.kind === "stepikTasks") {
    const entries = entriesForPeriod(context.stepikEntries, context, condition.period).filter((entry) => {
      const topicMatch = topicMatches(entry.topic, condition.topic);
      const difficultyMatch = condition.minDifficulty ? entry.difficulty >= condition.minDifficulty : true;
      return topicMatch && difficultyMatch;
    });
    return clamp(entries.reduce((sum, entry) => sum + entry.tasksSolved, 0), condition.target, entries[0]?.date);
  }

  if (condition.kind === "stepikStreak") {
    return clamp(getStepikStreak(context.stepikEntries ?? []), condition.target);
  }

  if (condition.kind === "topicLevel") {
    const topic = context.topics?.find((entry) => topicMatches(entry.id, condition.topic) || topicMatches(entry.name, condition.topic));
    return clamp(topic?.level ?? 0, condition.target, topic?.lastPracticedAt);
  }

  if (condition.kind === "topicXp") {
    const topic = context.topics?.find((entry) => topicMatches(entry.id, condition.topic) || topicMatches(entry.name, condition.topic));
    return clamp(topic?.xp ?? 0, condition.target, topic?.lastPracticedAt);
  }

  if (condition.kind === "bossActive") {
    const current = context.bosses?.some((boss) => !boss.completed) ? 1 : 0;
    return clamp(current, condition.target ?? 1);
  }

  if (condition.kind === "bossProgress") {
    const current = (context.bosses ?? []).reduce(
      (sum, boss) => sum + boss.requirements.filter((requirement) => requirement.progress > 0 || requirement.completed).length,
      0,
    );
    return clamp(current, condition.target);
  }

  if (condition.kind === "bossDefeated") {
    const bosses = (context.bosses ?? []).filter((boss) => {
      if (!boss.completed) return false;
      if (condition.difficulty && boss.difficulty !== condition.difficulty) return false;
      if (condition.bossId && boss.id !== condition.bossId && boss.presetId !== condition.bossId) return false;
      return true;
    });
    return clamp(bosses.length, condition.target, bosses[0]?.completedAt?.slice(0, 10));
  }

  if (condition.kind === "questsCompleted") {
    const quests = condition.period === "week" || condition.includeWeekly
      ? [...(context.quests ?? []), ...(context.weeklyQuests ?? [])]
      : context.quests ?? [];
    return clamp(quests.filter((quest) => quest.completed).length, condition.target);
  }

  if (condition.kind === "allQuestsCompleted") {
    const quests = condition.period === "week" ? context.weeklyQuests ?? [] : context.quests ?? [];
    return clamp(quests.length > 0 && quests.every((quest) => quest.completed) ? 1 : 0, 1);
  }

  if (condition.kind === "inventoryItems") {
    const items = (context.inventoryItems ?? []).filter((item) => {
      const unlocked = item.unlocked ?? Boolean(item.unlockedAt);
      const rarityMatch = condition.rarity ? item.rarity === condition.rarity : true;
      const equippedMatch = condition.equipped ? Boolean(item.equipped) : true;
      return unlocked && rarityMatch && equippedMatch;
    });
    return clamp(items.length, condition.target, items[0]?.unlockedAt?.slice(0, 10));
  }

  if (condition.kind === "achievementsUnlocked") {
    const achievements = (context.achievements ?? []).filter((achievement) => {
      const unlocked = achievement.unlocked ?? Boolean(achievement.unlockedAt);
      const rarityMatch = condition.rarity ? achievement.rarity === condition.rarity : true;
      return unlocked && rarityMatch;
    });
    return clamp(achievements.length, condition.target, achievements[0]?.unlockedAt?.slice(0, 10));
  }

  if (condition.kind === "seasonLevel") {
    return clamp(context.seasonLevel ?? 0, condition.target);
  }

  if (condition.kind === "seasonXp") {
    return clamp(context.seasonXp ?? 0, condition.target);
  }

  if (condition.kind === "rankReached") {
    const ranks = getAllRanks();
    const targetRank = ranks.find((rank) => rank.id === condition.rankId || rank.name === condition.rankName);
    return clamp(context.totalCodingXp ?? 0, targetRank?.minXp ?? Number.MAX_SAFE_INTEGER);
  }

  if (condition.kind === "recoveryDays") {
    return clamp(context.recoveryDays ?? recoveryDayCount(context.days ?? []), condition.target);
  }

  if (condition.kind === "lightDays") {
    return clamp(context.lightDays ?? lightDayCount(context.days ?? []), condition.target);
  }

  if (condition.kind === "all") {
    const children = condition.conditions.map((child) => getConditionProgress(child, context));
    const current = children.filter((child) => child.completed).length;
    return clamp(current, children.length, children.every((child) => child.unlockedAt) ? children.map((child) => child.unlockedAt).sort().at(-1) : undefined);
  }

  if (condition.kind === "any") {
    const children = condition.conditions.map((child) => getConditionProgress(child, context));
    const best = children.sort((a, b) => b.percent - a.percent)[0];
    return clamp(best?.current ?? 0, condition.target ?? best?.target ?? 1, best?.unlockedAt);
  }

  return clamp(0, 1);
}
