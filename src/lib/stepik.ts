import { randomUUID } from "node:crypto";
import {
  clampNumber,
  getLocalDateKey,
  isDateKey,
  normalizeText,
  readJsonStore,
  writeJsonStore,
} from "@/lib/local-json-store";

export type StepikEntry = {
  id: string;
  date: string;
  topic: string;
  tasksSolved: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  status: "easy" | "normal" | "hard" | "pain";
  comment?: string;
  createdAt: string;
};

export type StepikStats = {
  todayTasks: number;
  weekTasks: number;
  monthTasks: number;
  adventureXp: number;
};

type StepikFile = {
  version: 1;
  entries: StepikEntry[];
};

const fileName = "codefire-stepik.json";
const statuses = new Set<StepikEntry["status"]>(["easy", "normal", "hard", "pain"]);

function sanitizeStatus(value: unknown): StepikEntry["status"] {
  return typeof value === "string" && statuses.has(value as StepikEntry["status"])
    ? (value as StepikEntry["status"])
    : "normal";
}

function sanitizeEntry(input: Partial<StepikEntry>): StepikEntry {
  const date = isDateKey(input.date) ? input.date : getLocalDateKey();
  const topic = normalizeText(input.topic, 64) || "Algorithms";
  const comment = normalizeText(input.comment, 700);

  return {
    id: normalizeText(input.id, 80) || randomUUID(),
    date,
    topic,
    tasksSolved: clampNumber(input.tasksSolved, 0, 200, 1),
    difficulty: clampNumber(input.difficulty, 1, 5, 2) as StepikEntry["difficulty"],
    status: sanitizeStatus(input.status),
    comment: comment || undefined,
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : new Date().toISOString(),
  };
}

export function stepikAdventureXp(entry: StepikEntry) {
  return entry.tasksSolved * entry.difficulty * 12;
}

async function readStepikFile(): Promise<StepikFile> {
  const data = await readJsonStore<Partial<StepikFile>>(fileName, { version: 1, entries: [] });

  return {
    version: 1,
    entries: Array.isArray(data.entries) ? data.entries.map(sanitizeEntry) : [],
  };
}

async function writeStepikFile(entries: StepikEntry[]) {
  await writeJsonStore<StepikFile>(fileName, {
    version: 1,
    entries: entries.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function getStepikEntries(limit = 200) {
  const data = await readStepikFile();

  return data.entries.slice(0, Math.max(1, Math.min(500, limit)));
}

export async function saveStepikEntry(input: Partial<StepikEntry>) {
  const data = await readStepikFile();
  const entry = sanitizeEntry(input);
  const entries = data.entries.filter((item) => item.id !== entry.id).concat(entry);

  await writeStepikFile(entries);

  return entry;
}

export async function deleteStepikEntry(id: string) {
  const data = await readStepikFile();
  const entries = data.entries.filter((entry) => entry.id !== id);

  await writeStepikFile(entries);

  return { deleted: entries.length !== data.entries.length };
}

export function getStepikStats(entries: StepikEntry[], todayDate: string): StepikStats {
  const today = new Date(`${todayDate}T00:00:00`);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  const weekStartKey = weekStart.toISOString().slice(0, 10);
  const monthKey = todayDate.slice(0, 7);

  return {
    todayTasks: entries.filter((entry) => entry.date === todayDate).reduce((sum, entry) => sum + entry.tasksSolved, 0),
    weekTasks: entries
      .filter((entry) => entry.date >= weekStartKey && entry.date <= todayDate)
      .reduce((sum, entry) => sum + entry.tasksSolved, 0),
    monthTasks: entries
      .filter((entry) => entry.date.startsWith(monthKey))
      .reduce((sum, entry) => sum + entry.tasksSolved, 0),
    adventureXp: entries.reduce((sum, entry) => sum + stepikAdventureXp(entry), 0),
  };
}
