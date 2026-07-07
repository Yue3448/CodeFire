import { randomUUID } from "node:crypto";
import {
  clampNumber,
  getLocalDateKey,
  isDateKey,
  normalizeText,
  readJsonStore,
  writeJsonStore,
} from "@/lib/local-json-store";

export type StudyTask = {
  id: string;
  date: string;
  source: "Stepik" | "Codeforces" | "Book" | "Custom";
  topic: string;
  title?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  status: "solved" | "almost" | "failed" | "reviewed";
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

export type StudyTaskStats = {
  todaySolved: number;
  weekSolved: number;
  monthSolved: number;
  todayTasks: number;
  weekTasks: number;
  monthTasks: number;
  averageDifficulty: number;
  topTopic?: string;
  solved: number;
  almost: number;
  failed: number;
  reviewed: number;
  studyXp: number;
  adventureXp: number;
};

type StudyTasksFile = {
  version: 1;
  tasks: StudyTask[];
};

const fileName = "codefire-study-tasks.json";
const sources = new Set<StudyTask["source"]>(["Stepik", "Codeforces", "Book", "Custom"]);
const statuses = new Set<StudyTask["status"]>(["solved", "almost", "failed", "reviewed"]);

function sanitizeSource(value: unknown): StudyTask["source"] {
  return typeof value === "string" && sources.has(value as StudyTask["source"])
    ? (value as StudyTask["source"])
    : "Custom";
}

function sanitizeStatus(value: unknown): StudyTask["status"] {
  return typeof value === "string" && statuses.has(value as StudyTask["status"])
    ? (value as StudyTask["status"])
    : "solved";
}

function sanitizeDifficulty(value: unknown): StudyTask["difficulty"] {
  return clampNumber(value, 1, 5, 2) as StudyTask["difficulty"];
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

export function studyTaskStudyXp(task: Pick<StudyTask, "status">) {
  if (task.status === "failed") return 5;
  if (task.status === "reviewed") return 10;
  if (task.status === "almost") return 15;
  return 30;
}

export function studyTaskAdventureXp(task: Pick<StudyTask, "status">) {
  return studyTaskStudyXp(task);
}

function sanitizeTask(input: Partial<StudyTask>): StudyTask {
  const date = isDateKey(input.date) ? input.date : getLocalDateKey();
  const topic = normalizeText(input.topic, 64) || "Other";
  const title = normalizeText(input.title, 120);
  const notes = normalizeText(input.notes, 700);

  return {
    id: normalizeText(input.id, 80) || randomUUID(),
    date,
    source: sanitizeSource(input.source),
    topic,
    title: title || undefined,
    difficulty: sanitizeDifficulty(input.difficulty),
    status: sanitizeStatus(input.status),
    notes: notes || undefined,
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : new Date().toISOString(),
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : undefined,
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

  const task = sanitizeTask({
    ...current,
    ...input,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  });
  const tasks = data.tasks.filter((item) => item.id !== task.id).concat(task);

  await writeStudyTasksFile(tasks);

  return task;
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

export function calculateStudyTaskStats(tasks: StudyTask[], todayDate = getLocalDateKey()): StudyTaskStats {
  const monthStart = todayDate.slice(0, 7);
  const weekStartKey = weekStart(todayDate);
  const todayTasks = tasks.filter((task) => task.date === todayDate);
  const weekTasks = tasks.filter((task) => task.date >= weekStartKey && task.date <= todayDate);
  const monthTasks = tasks.filter((task) => task.date.startsWith(monthStart));
  const solved = tasks.filter((task) => task.status === "solved");
  const topicCounts = tasks.reduce<Record<string, number>>((counts, task) => {
    counts[task.topic] = (counts[task.topic] ?? 0) + 1;
    return counts;
  }, {});
  const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const studyXp = tasks.reduce((sum, task) => sum + studyTaskStudyXp(task), 0);

  return {
    todaySolved: solved.filter((task) => task.date === todayDate).length,
    weekSolved: solved.filter((task) => task.date >= weekStartKey && task.date <= todayDate).length,
    monthSolved: solved.filter((task) => task.date.startsWith(monthStart)).length,
    todayTasks: todayTasks.length,
    weekTasks: weekTasks.length,
    monthTasks: monthTasks.length,
    averageDifficulty: tasks.length
      ? Math.round((tasks.reduce((sum, task) => sum + task.difficulty, 0) / tasks.length) * 10) / 10
      : 0,
    topTopic,
    solved: solved.length,
    almost: tasks.filter((task) => task.status === "almost").length,
    failed: tasks.filter((task) => task.status === "failed").length,
    reviewed: tasks.filter((task) => task.status === "reviewed").length,
    studyXp,
    adventureXp: studyXp,
  };
}

export const getStudyTaskStats = calculateStudyTaskStats;
