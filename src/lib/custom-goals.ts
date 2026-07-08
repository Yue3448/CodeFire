import { randomUUID } from "node:crypto";
import {
  clampNumber,
  normalizeText,
  readJsonStore,
  writeJsonStore,
} from "@/lib/local-json-store.server";
import type { DailyNote } from "@/lib/daily-notes";
import type { ManualStudyEntry } from "@/lib/manual-study";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { StepikEntry } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";

export type UserGoal = {
  id: string;
  title: string;
  type: "time" | "language" | "tasks" | "pomodoro" | "journal" | "focus" | "topic" | "manualStudy";
  target: number;
  unit: "minutes" | "xp" | "tasks" | "sessions" | "percent" | "notes";
  period: "day" | "week" | "month";
  language?: string;
  topic?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type UserGoalProgress = UserGoal & {
  progress: number;
  percent: number;
  completed: boolean;
};

type GoalsFile = {
  version: 1;
  goals: UserGoal[];
};

const fileName = "codefire-goals.json";
const types = new Set<UserGoal["type"]>([
  "time",
  "language",
  "tasks",
  "pomodoro",
  "journal",
  "focus",
  "topic",
  "manualStudy",
]);
const units = new Set<UserGoal["unit"]>(["minutes", "xp", "tasks", "sessions", "percent", "notes"]);
const periods = new Set<UserGoal["period"]>(["day", "week", "month"]);

function sanitizeType(value: unknown): UserGoal["type"] {
  return typeof value === "string" && types.has(value as UserGoal["type"])
    ? (value as UserGoal["type"])
    : "time";
}

function sanitizeUnit(value: unknown): UserGoal["unit"] {
  return typeof value === "string" && units.has(value as UserGoal["unit"])
    ? (value as UserGoal["unit"])
    : "minutes";
}

function sanitizePeriod(value: unknown): UserGoal["period"] {
  return typeof value === "string" && periods.has(value as UserGoal["period"])
    ? (value as UserGoal["period"])
    : "day";
}

function sanitizeGoal(input: Partial<UserGoal>): UserGoal {
  return {
    id: normalizeText(input.id, 80) || randomUUID(),
    title: normalizeText(input.title, 120) || "Custom goal",
    type: sanitizeType(input.type),
    target: clampNumber(input.target, 1, 100000, 60),
    unit: sanitizeUnit(input.unit),
    period: sanitizePeriod(input.period),
    language: normalizeText(input.language, 40) || undefined,
    topic: normalizeText(input.topic, 64) || undefined,
    active: input.active ?? true,
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : new Date().toISOString(),
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : undefined,
  };
}

async function readGoalsFile(): Promise<GoalsFile> {
  const data = await readJsonStore<Partial<GoalsFile>>(fileName, { version: 1, goals: [] });

  return {
    version: 1,
    goals: Array.isArray(data.goals) ? data.goals.map(sanitizeGoal) : [],
  };
}

async function writeGoalsFile(goals: UserGoal[]) {
  await writeJsonStore<GoalsFile>(fileName, {
    version: 1,
    goals: goals.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function getUserGoals() {
  const data = await readGoalsFile();

  return data.goals;
}

export async function createGoal(input: Partial<UserGoal>) {
  const data = await readGoalsFile();
  const goal = sanitizeGoal({ ...input, id: undefined, createdAt: new Date().toISOString() });

  await writeGoalsFile(data.goals.concat(goal));

  return goal;
}

export async function updateGoal(id: string, input: Partial<UserGoal>) {
  const data = await readGoalsFile();
  const current = data.goals.find((goal) => goal.id === id);

  if (!current) {
    return createGoal({ ...input, id });
  }

  const goal = sanitizeGoal({
    ...current,
    ...input,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  });
  const goals = data.goals.filter((item) => item.id !== id).concat(goal);

  await writeGoalsFile(goals);

  return goal;
}

export async function saveUserGoal(input: Partial<UserGoal>) {
  const id = normalizeText(input.id, 80);

  return id ? updateGoal(id, input) : createGoal(input);
}

export async function deleteGoal(id: string) {
  const data = await readGoalsFile();
  const goals = data.goals.filter((goal) => goal.id !== id);

  await writeGoalsFile(goals);

  return { deleted: goals.length !== data.goals.length };
}

export async function deleteUserGoal(id: string) {
  return deleteGoal(id);
}

export async function toggleGoal(id: string) {
  const data = await readGoalsFile();
  const goal = data.goals.find((item) => item.id === id);

  if (!goal) return { toggled: false };

  await updateGoal(id, { active: !goal.active });

  return { toggled: true };
}

function periodDays(days: DailyCodingActivity[], goal: UserGoal, todayDate: string) {
  if (goal.period === "day") return days.filter((day) => day.date === todayDate);

  const today = new Date(`${todayDate}T00:00:00`);
  const start = new Date(today);

  if (goal.period === "week") {
    start.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  } else {
    start.setDate(1);
  }

  const startKey = start.toISOString().slice(0, 10);
  return days.filter((day) => day.date >= startKey && day.date <= todayDate);
}

function noteHasContent(note: DailyNote) {
  return Boolean(note.text?.trim() || note.beforeText?.trim() || note.afterText?.trim());
}

function pomodoroProgress(goal: UserGoal, pomodoroStats?: PomodoroStats) {
  if (!pomodoroStats) return 0;
  if (goal.period === "week") return pomodoroStats.weekCompletedFocusSessions;
  if (goal.period === "month") return pomodoroStats.last30DaysCompletedFocusSessions;
  return pomodoroStats.todayCompletedFocusSessions;
}

export function calculateGoalProgress(
  goal: UserGoal,
  dataContext: {
    days: DailyCodingActivity[];
    todayDate: string;
    tasks: StudyTask[];
    stepikEntries: StepikEntry[];
    notes: DailyNote[];
    topics: TopicProgress[];
    manualStudy?: ManualStudyEntry[];
    pomodoroStats?: PomodoroStats;
  },
): UserGoalProgress {
  const scopedDays = periodDays(dataContext.days, goal, dataContext.todayDate);
  const scopedDateSet = new Set(scopedDays.map((day) => day.date));
  let progress = 0;

  if (goal.type === "time") {
    progress = Math.floor(scopedDays.reduce((sum, day) => sum + day.codingSeconds, 0) / 60);
  }

  if (goal.type === "language") {
    progress = Math.floor(
      scopedDays.reduce(
        (sum, day) =>
          sum +
          (day.languages.find(
            (language) => language.name.toLowerCase() === (goal.language ?? "").toLowerCase(),
          )?.seconds ?? 0),
        0,
      ) / 60,
    );
  }

  if (goal.type === "tasks") {
    progress =
      dataContext.tasks.filter((task) => scopedDateSet.has(task.date) && task.status === "solved").length +
      dataContext.stepikEntries
        .filter((entry) => scopedDateSet.has(entry.date))
        .reduce((sum, entry) => sum + entry.tasksSolved, 0);
  }

  if (goal.type === "pomodoro") {
    progress = pomodoroProgress(goal, dataContext.pomodoroStats);
  }

  if (goal.type === "journal") {
    progress = dataContext.notes.filter((note) => scopedDateSet.has(note.date) && noteHasContent(note)).length;
  }

  if (goal.type === "focus") {
    const today = scopedDays.at(-1);
    progress =
      today && today.codingSeconds > 0
        ? Math.round(((today.languages[0]?.seconds ?? 0) / today.codingSeconds) * 100)
        : 0;
  }

  if (goal.type === "topic") {
    progress =
      dataContext.topics.find((topic) => topic.name.toLowerCase() === (goal.topic ?? "").toLowerCase())?.xp ?? 0;
  }

  if (goal.type === "manualStudy") {
    progress = (dataContext.manualStudy ?? [])
      .filter((entry) => scopedDateSet.has(entry.date))
      .reduce((sum, entry) => sum + entry.minutes, 0);
  }

  return {
    ...goal,
    progress,
    percent: Math.min(100, Math.max(0, (progress / goal.target) * 100)),
    completed: progress >= goal.target,
  };
}

export function getCustomGoalProgress({
  goals,
  days,
  todayDate,
  tasks,
  stepikEntries,
  notes,
  topics,
  manualStudy = [],
  pomodoroStats,
}: {
  goals: UserGoal[];
  days: DailyCodingActivity[];
  todayDate: string;
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  notes: DailyNote[];
  topics: TopicProgress[];
  manualStudy?: ManualStudyEntry[];
  pomodoroStats?: PomodoroStats;
}): UserGoalProgress[] {
  return goals
    .filter((goal) => goal.active)
    .map((goal) =>
      calculateGoalProgress(goal, {
        days,
        todayDate,
        tasks,
        stepikEntries,
        notes,
        topics,
        manualStudy,
        pomodoroStats,
      }),
    );
}
