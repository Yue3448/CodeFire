import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  defaultPomodoroSettings,
  getPomodoroModeMinutes,
  sanitizePomodoroSettings,
  type PomodoroMode,
  type PomodoroSettings,
} from "@/lib/pomodoro-settings";

export type { PomodoroMode, PomodoroSettings } from "@/lib/pomodoro-settings";

export type PomodoroSession = {
  id: string;
  date: string;
  mode: PomodoroMode;
  plannedMinutes: number;
  completedMinutes: number;
  completed: boolean;
  interrupted: boolean;
  startedAt: string;
  endedAt?: string;
};

export type PomodoroBestDay = {
  date: string;
  focusMinutes: number;
  completedSessions: number;
};

export type PomodoroStats = {
  todayFocusMinutes: number;
  todayStartedFocusSessions: number;
  todayCompletedFocusSessions: number;
  todayStartedBreakSessions: number;
  todayCompletedBreakSessions: number;
  todayInterruptedSessions: number;
  weekFocusMinutes: number;
  weekCompletedFocusSessions: number;
  last30DaysFocusMinutes: number;
  last30DaysCompletedFocusSessions: number;
  totalCompletedFocusSessions: number;
  totalStartedFocusSessions: number;
  totalCompletedSessions: number;
  bestDay: PomodoroBestDay | null;
  currentPomodoroStreak: number;
  averageFocusMinutes: number;
  completionRate: number;
};

export type PomodoroData = {
  settings: PomodoroSettings;
  sessions: PomodoroSession[];
  stats: PomodoroStats;
};

type PomodoroFile = {
  version: 2;
  sessions: PomodoroSession[];
};

type PomodoroSettingsFile = {
  version: 1;
  settings: PomodoroSettings;
};

const pomodoroFile = path.join(process.cwd(), "data", "codefire-pomodoro.json");
const pomodoroSettingsFile = path.join(process.cwd(), "data", "codefire-pomodoro-settings.json");
const modes = new Set<PomodoroMode>(["focus", "shortBreak", "longBreak"]);
const dayInMs = 24 * 60 * 60 * 1000;

function isPomodoroMode(value: unknown): value is PomodoroMode {
  return typeof value === "string" && modes.has(value as PomodoroMode);
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateKeyToUtcMs(dateKey: string) {
  const [year = 0, month = 1, day = 1] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDaysToDateKey(dateKey: string, days: number) {
  return new Date(dateKeyToUtcMs(dateKey) + days * dayInMs).toISOString().slice(0, 10);
}

function getWeekStart(dateKey: string) {
  const date = new Date(dateKeyToUtcMs(dateKey));
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  return addDaysToDateKey(dateKey, diff);
}

function fallbackPlannedMinutes(mode: PomodoroMode) {
  return getPomodoroModeMinutes(mode, defaultPomodoroSettings);
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      await writeJsonFile(filePath, fallback);
      return fallback;
    }

    throw error;
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function sanitizeSession(input: Partial<PomodoroSession>): PomodoroSession {
  const mode = isPomodoroMode(input.mode) ? input.mode : "focus";
  const plannedMinutes = clampInteger(input.plannedMinutes, 1, 240, fallbackPlannedMinutes(mode));
  const completed = Boolean(input.completed);
  const completedMinutes = completed
    ? plannedMinutes
    : clampInteger(input.completedMinutes, 0, plannedMinutes, 0);
  const endedAt = typeof input.endedAt === "string" ? input.endedAt : undefined;
  const startedAt =
    typeof input.startedAt === "string" && input.startedAt.trim()
      ? input.startedAt
      : new Date(Date.now() - plannedMinutes * 60 * 1000).toISOString();

  return {
    id: typeof input.id === "string" && input.id.trim() ? input.id : randomUUID(),
    date: isDateKey(input.date) ? input.date : getLocalDateKey(endedAt ? new Date(endedAt) : new Date()),
    mode,
    plannedMinutes,
    completedMinutes,
    completed,
    interrupted: !completed && Boolean(input.interrupted),
    startedAt,
    endedAt,
  };
}

async function readPomodoroFile(): Promise<PomodoroFile> {
  const parsed = await readJsonFile<Partial<PomodoroFile>>(pomodoroFile, {
    version: 2,
    sessions: [],
  });

  return {
    version: 2,
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions.map(sanitizeSession) : [],
  };
}

async function writePomodoroFile(data: PomodoroFile) {
  await writeJsonFile(pomodoroFile, data);
}

export async function getPomodoroSettings() {
  const parsed = await readJsonFile<Partial<PomodoroSettingsFile>>(pomodoroSettingsFile, {
    version: 1,
    settings: defaultPomodoroSettings,
  });

  return sanitizePomodoroSettings(parsed.settings ?? defaultPomodoroSettings);
}

export async function savePomodoroSettings(input: Partial<PomodoroSettings>) {
  const settings = sanitizePomodoroSettings(input);

  await writeJsonFile<PomodoroSettingsFile>(pomodoroSettingsFile, {
    version: 1,
    settings,
  });

  return settings;
}

export async function getPomodoroSessions() {
  const data = await readPomodoroFile();

  return data.sessions;
}

export async function savePomodoroSession(input: Partial<PomodoroSession>) {
  const data = await readPomodoroFile();
  const session = sanitizeSession(input);
  const sessions = data.sessions
    .filter((item) => item.id !== session.id)
    .concat(session)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .slice(-1000);

  await writePomodoroFile({ version: 2, sessions });

  return session;
}

export function getPomodoroStats(sessions: PomodoroSession[], todayDate = getLocalDateKey()): PomodoroStats {
  const weekStart = getWeekStart(todayDate);
  const weekEnd = addDaysToDateKey(weekStart, 6);
  const last30Start = addDaysToDateKey(todayDate, -29);
  const focusSessions = sessions.filter((session) => session.mode === "focus");
  const breakSessions = sessions.filter((session) => session.mode !== "focus");
  const completedFocusSessions = focusSessions.filter((session) => session.completed);
  const completedBreakSessions = breakSessions.filter((session) => session.completed);
  const todayFocusSessions = focusSessions.filter((session) => session.date === todayDate);
  const todayBreakSessions = breakSessions.filter((session) => session.date === todayDate);
  const todayCompletedFocusSessions = completedFocusSessions.filter((session) => session.date === todayDate);
  const todayCompletedBreakSessions = completedBreakSessions.filter((session) => session.date === todayDate);
  const weekCompletedFocusSessions = completedFocusSessions.filter(
    (session) => session.date >= weekStart && session.date <= weekEnd,
  );
  const last30CompletedFocusSessions = completedFocusSessions.filter(
    (session) => session.date >= last30Start && session.date <= todayDate,
  );
  const byDay = new Map<string, PomodoroBestDay>();

  for (const session of completedFocusSessions) {
    const day = byDay.get(session.date) ?? {
      date: session.date,
      focusMinutes: 0,
      completedSessions: 0,
    };

    day.focusMinutes += session.completedMinutes;
    day.completedSessions += 1;
    byDay.set(session.date, day);
  }

  const bestDay =
    [...byDay.values()].sort(
      (a, b) => b.focusMinutes - a.focusMinutes || b.completedSessions - a.completedSessions,
    )[0] ?? null;
  const activeDates = new Set([...byDay.values()].filter((day) => day.focusMinutes > 0).map((day) => day.date));
  const streakStart = activeDates.has(todayDate) ? todayDate : addDaysToDateKey(todayDate, -1);
  let currentPomodoroStreak = 0;

  for (let cursor = streakStart; activeDates.has(cursor); cursor = addDaysToDateKey(cursor, -1)) {
    currentPomodoroStreak += 1;
  }

  const totalFocusMinutes = completedFocusSessions.reduce((sum, session) => sum + session.completedMinutes, 0);
  const completionRate = focusSessions.length
    ? Math.round((completedFocusSessions.length / focusSessions.length) * 100)
    : 0;

  return {
    todayFocusMinutes: todayCompletedFocusSessions.reduce((sum, session) => sum + session.completedMinutes, 0),
    todayStartedFocusSessions: todayFocusSessions.length,
    todayCompletedFocusSessions: todayCompletedFocusSessions.length,
    todayStartedBreakSessions: todayBreakSessions.length,
    todayCompletedBreakSessions: todayCompletedBreakSessions.length,
    todayInterruptedSessions: sessions.filter((session) => session.date === todayDate && session.interrupted).length,
    weekFocusMinutes: weekCompletedFocusSessions.reduce((sum, session) => sum + session.completedMinutes, 0),
    weekCompletedFocusSessions: weekCompletedFocusSessions.length,
    last30DaysFocusMinutes: last30CompletedFocusSessions.reduce(
      (sum, session) => sum + session.completedMinutes,
      0,
    ),
    last30DaysCompletedFocusSessions: last30CompletedFocusSessions.length,
    totalCompletedFocusSessions: completedFocusSessions.length,
    totalStartedFocusSessions: focusSessions.length,
    totalCompletedSessions: sessions.filter((session) => session.completed).length,
    bestDay,
    currentPomodoroStreak,
    averageFocusMinutes: completedFocusSessions.length
      ? Math.round(totalFocusMinutes / completedFocusSessions.length)
      : 0,
    completionRate,
  };
}

export async function getPomodoroData(): Promise<PomodoroData> {
  const [sessions, settings] = await Promise.all([getPomodoroSessions(), getPomodoroSettings()]);
  const stats = getPomodoroStats(sessions);

  return {
    settings,
    sessions: sessions
      .slice()
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, 100),
    stats,
  };
}
