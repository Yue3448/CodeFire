import { randomUUID } from "node:crypto";
import {
  clampNumber,
  getLocalDateKey,
  isDateKey,
  normalizeText,
  readJsonStore,
  writeJsonStore,
} from "@/lib/local-json-store";

export type ManualStudyEntry = {
  id: string;
  date: string;
  minutes: number;
  type: "theory" | "paper" | "video" | "reading" | "debugThinking" | "other";
  topic?: string;
  description?: string;
  createdAt: string;
};

export type ManualStudyStats = {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  adventureXp: number;
};

type ManualStudyFile = {
  version: 1;
  entries: ManualStudyEntry[];
};

const fileName = "codefire-manual-study.json";
const types = new Set<ManualStudyEntry["type"]>([
  "theory",
  "paper",
  "video",
  "reading",
  "debugThinking",
  "other",
]);

function sanitizeType(value: unknown): ManualStudyEntry["type"] {
  return typeof value === "string" && types.has(value as ManualStudyEntry["type"])
    ? (value as ManualStudyEntry["type"])
    : "theory";
}

function sanitizeEntry(input: Partial<ManualStudyEntry>): ManualStudyEntry {
  const date = isDateKey(input.date) ? input.date : getLocalDateKey();
  const topic = normalizeText(input.topic, 64);
  const description = normalizeText(input.description, 700);

  return {
    id: normalizeText(input.id, 80) || randomUUID(),
    date,
    minutes: clampNumber(input.minutes, 1, 600, 30),
    type: sanitizeType(input.type),
    topic: topic || undefined,
    description: description || undefined,
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : new Date().toISOString(),
  };
}

export function manualStudyAdventureXp(entry: ManualStudyEntry) {
  return Math.max(5, Math.round(entry.minutes * 0.8));
}

async function readManualStudyFile(): Promise<ManualStudyFile> {
  const data = await readJsonStore<Partial<ManualStudyFile>>(fileName, { version: 1, entries: [] });

  return {
    version: 1,
    entries: Array.isArray(data.entries) ? data.entries.map(sanitizeEntry) : [],
  };
}

async function writeManualStudyFile(entries: ManualStudyEntry[]) {
  await writeJsonStore<ManualStudyFile>(fileName, {
    version: 1,
    entries: entries.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function getManualStudyEntries(limit = 200) {
  const data = await readManualStudyFile();

  return data.entries.slice(0, Math.max(1, Math.min(500, limit)));
}

export async function saveManualStudyEntry(input: Partial<ManualStudyEntry>) {
  const data = await readManualStudyFile();
  const entry = sanitizeEntry(input);
  const entries = data.entries.filter((item) => item.id !== entry.id).concat(entry);

  await writeManualStudyFile(entries);

  return entry;
}

export async function deleteManualStudyEntry(id: string) {
  const data = await readManualStudyFile();
  const entries = data.entries.filter((entry) => entry.id !== id);

  await writeManualStudyFile(entries);

  return { deleted: entries.length !== data.entries.length };
}

export function getManualStudyStats(entries: ManualStudyEntry[], todayDate: string): ManualStudyStats {
  const today = new Date(`${todayDate}T00:00:00`);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  const weekStartKey = weekStart.toISOString().slice(0, 10);
  const monthKey = todayDate.slice(0, 7);

  return {
    todayMinutes: entries.filter((entry) => entry.date === todayDate).reduce((sum, entry) => sum + entry.minutes, 0),
    weekMinutes: entries
      .filter((entry) => entry.date >= weekStartKey && entry.date <= todayDate)
      .reduce((sum, entry) => sum + entry.minutes, 0),
    monthMinutes: entries
      .filter((entry) => entry.date.startsWith(monthKey))
      .reduce((sum, entry) => sum + entry.minutes, 0),
    adventureXp: entries.reduce((sum, entry) => sum + manualStudyAdventureXp(entry), 0),
  };
}
