import "server-only";

import { randomUUID } from "node:crypto";
import {
  clampNumber,
  getLocalDateKey,
  isDateKey,
  normalizeText,
  readJsonStore,
  writeJsonStore,
} from "@/lib/local-json-store.server";
import {
  isStudyTaskFinished,
  type StudyTask,
  type StudyTaskDifficulty,
  type StudyTaskPeriod,
  type StudyTaskSource,
  type StudyTaskStatus,
  type StudyTaskType,
  type StudyTaskUnit,
} from "@/lib/study-tasks";

type StudyTasksFile = {
  version: 1;
  tasks: StudyTask[];
};

const fileName = "codefire-study-tasks.json";
const sources = new Set<StudyTaskSource>(["wakatime", "stepik", "manual", "mixed", "Stepik", "Codeforces", "Book", "Custom"]);
const statuses = new Set<StudyTaskStatus>(["active", "completed", "paused", "archived", "solved", "almost", "failed", "reviewed"]);
const taskTypes = new Set<StudyTaskType>(["codingTime", "codingXp", "tasksCount", "stepikTasks", "manualStudy", "topicXp"]);
const units = new Set<StudyTaskUnit>(["minutes", "xp", "tasks", "sessions"]);
const periods = new Set<StudyTaskPeriod>(["today", "week", "custom", "none"]);
const difficultyLabels = new Set<StudyTaskDifficulty>(["easy", "normal", "hard", "veryHard"]);

function sanitizeSource(value: unknown): StudyTaskSource {
  return typeof value === "string" && sources.has(value as StudyTaskSource)
    ? (value as StudyTaskSource)
    : "manual";
}

function sanitizeStatus(value: unknown, fallback: StudyTaskStatus): StudyTaskStatus {
  return typeof value === "string" && statuses.has(value as StudyTaskStatus)
    ? (value as StudyTaskStatus)
    : fallback;
}

function sanitizeTaskType(value: unknown): StudyTaskType {
  return typeof value === "string" && taskTypes.has(value as StudyTaskType)
    ? (value as StudyTaskType)
    : "tasksCount";
}

function defaultUnitForType(type: StudyTaskType): StudyTaskUnit {
  if (type === "codingTime" || type === "manualStudy") return "minutes";
  if (type === "codingXp" || type === "topicXp") return "xp";
  return "tasks";
}

function sanitizeUnit(value: unknown, type: StudyTaskType): StudyTaskUnit {
  return typeof value === "string" && units.has(value as StudyTaskUnit)
    ? (value as StudyTaskUnit)
    : defaultUnitForType(type);
}

function sanitizePeriod(value: unknown): StudyTaskPeriod {
  return typeof value === "string" && periods.has(value as StudyTaskPeriod)
    ? (value as StudyTaskPeriod)
    : "today";
}

function difficultyLabelFromNumber(value: number): StudyTaskDifficulty {
  if (value <= 1) return "easy";
  if (value === 2) return "normal";
  if (value === 3 || value === 4) return "hard";
  return "veryHard";
}

function difficultyNumberFromLabel(value: StudyTaskDifficulty) {
  if (value === "easy") return 1;
  if (value === "normal") return 2;
  if (value === "hard") return 4;
  return 5;
}

function sanitizeDifficulty(input: Partial<StudyTask>) {
  if (typeof input.difficultyLabel === "string" && difficultyLabels.has(input.difficultyLabel)) {
    return {
      difficulty: difficultyNumberFromLabel(input.difficultyLabel) as StudyTask["difficulty"],
      difficultyLabel: input.difficultyLabel,
    };
  }

  const difficulty = clampNumber(input.difficulty, 1, 5, 2) as StudyTask["difficulty"];

  return {
    difficulty,
    difficultyLabel: difficultyLabelFromNumber(difficulty),
  };
}

function dateKeyToUtcMs(dateKey: string) {
  const [year = 0, month = 1, day = 1] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDays(dateKey: string, days: number) {
  return new Date(dateKeyToUtcMs(dateKey) + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function weekStart(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();

  return addDays(dateKey, day === 0 ? -6 : 1 - day);
}

function sanitizeTask(input: Partial<StudyTask>): StudyTask {
  const date = isDateKey(input.date) ? input.date : getLocalDateKey();
  const type = sanitizeTaskType(input.type);
  const topic = normalizeText(input.topic, 64) || "Other";
  const customTopic = normalizeText(input.customTopic, 64);
  const title = normalizeText(input.title, 120);
  const description = normalizeText(input.description ?? input.notes, 700);
  const notes = normalizeText(input.notes, 700);
  const language = normalizeText(input.language, 40);
  const createdAt = typeof input.createdAt === "string" && input.createdAt ? input.createdAt : new Date().toISOString();
  const target = clampNumber(input.target, 1, 100000, type === "tasksCount" || type === "stepikTasks" ? 1 : 30);
  const difficulty = sanitizeDifficulty(input);
  const hasModernShape = Boolean(input.type || input.target || input.period || input.unit || input.language || input.description);
  const fallbackStatus: StudyTaskStatus = hasModernShape ? "active" : "solved";
  const status = sanitizeStatus(input.status, fallbackStatus);
  const completedAt =
    typeof input.completedAt === "string" && input.completedAt
      ? input.completedAt
      : isStudyTaskFinished({ status })
        ? createdAt
        : undefined;

  return {
    id: normalizeText(input.id, 80) || randomUUID(),
    date,
    source: sanitizeSource(input.source),
    topic,
    title: title || undefined,
    description: description || undefined,
    language: language || undefined,
    customTopic: customTopic || undefined,
    type,
    target,
    unit: sanitizeUnit(input.unit, type),
    period: sanitizePeriod(input.period),
    deadline: isDateKey(input.deadline) ? input.deadline : undefined,
    difficulty: difficulty.difficulty,
    difficultyLabel: difficulty.difficultyLabel,
    status,
    manualProgress: input.manualProgress ? clampNumber(input.manualProgress, 0, 100000, 0) : undefined,
    notes: notes || undefined,
    createdAt,
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : undefined,
    completedAt,
  };
}

async function readStudyTasksFile(): Promise<StudyTasksFile> {
  const data = await readJsonStore<Partial<StudyTasksFile>>(fileName, { version: 1, tasks: [] });

  return {
    version: 1,
    tasks: Array.isArray(data.tasks) ? data.tasks.map(sanitizeTask) : [],
  };
}

async function writeStudyTasksFile(tasks: StudyTask[]) {
  await writeJsonStore<StudyTasksFile>(fileName, {
    version: 1,
    tasks: tasks.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function getStudyTasks(limit = 200) {
  const data = await readStudyTasksFile();

  return data.tasks.slice(0, Math.max(1, Math.min(500, limit)));
}

export async function addStudyTask(input: Partial<StudyTask>) {
  const data = await readStudyTasksFile();
  const task = sanitizeTask({ ...input, id: undefined, createdAt: new Date().toISOString() });

  await writeStudyTasksFile(data.tasks.concat(task));

  return task;
}

export async function updateStudyTask(id: string, input: Partial<StudyTask>) {
  const data = await readStudyTasksFile();
  const current = data.tasks.find((task) => task.id === id);

  if (!current) {
    return addStudyTask({ ...input, id });
  }

  const nextStatus = sanitizeStatus(input.status, current.status);
  const completedAt =
    input.completedAt ??
    (isStudyTaskFinished({ status: nextStatus }) && !current.completedAt ? new Date().toISOString() : current.completedAt);
  const task = sanitizeTask({
    ...current,
    ...input,
    id: current.id,
    createdAt: current.createdAt,
    completedAt,
    updatedAt: new Date().toISOString(),
  });
  const tasks = data.tasks.filter((item) => item.id !== task.id).concat(task);

  await writeStudyTasksFile(tasks);

  return task;
}

export async function addStudyTaskProgress(id: string, amount: number) {
  const data = await readStudyTasksFile();
  const current = data.tasks.find((task) => task.id === id);

  if (!current) {
    return null;
  }

  const nextProgress = Math.max(0, (current.manualProgress ?? 0) + clampNumber(amount, -100000, 100000, 1));
  const shouldComplete = nextProgress >= current.target && current.status !== "archived";

  return updateStudyTask(id, {
    manualProgress: nextProgress,
    status: shouldComplete ? "completed" : current.status,
    completedAt: shouldComplete ? current.completedAt ?? new Date().toISOString() : current.completedAt,
  });
}

export async function saveStudyTask(input: Partial<StudyTask>) {
  const id = normalizeText(input.id, 80);

  return id ? updateStudyTask(id, input) : addStudyTask(input);
}

export async function deleteStudyTask(id: string) {
  const data = await readStudyTasksFile();
  const tasks = data.tasks.filter((task) => task.id !== id);

  await writeStudyTasksFile(tasks);

  return { deleted: tasks.length !== data.tasks.length };
}

export async function getStudyTasksByDate(date: string) {
  const tasks = await getStudyTasks(500);

  return tasks.filter((task) => task.date === date);
}

export async function getStudyTasksForPeriod(
  period: "day" | "week" | "month",
  todayDate = getLocalDateKey(),
) {
  const tasks = await getStudyTasks(500);
  const start = period === "day" ? todayDate : period === "week" ? weekStart(todayDate) : `${todayDate.slice(0, 7)}-01`;

  return tasks.filter((task) => task.date >= start && task.date <= todayDate);
}
