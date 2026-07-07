import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  dailyNoteDifficulties,
  dailyNoteMoods,
  type DailyNote,
  type DailyNoteDifficulty,
  type DailyNoteInput,
  type DailyNoteMood,
} from "@/lib/daily-notes.types";
import { hasDailyNoteContent } from "@/lib/daily-notes";

type NotesFile = {
  version: 3;
  notes: Record<string, DailyNote>;
};

const notesFile = path.join(process.cwd(), "data", "codefire-notes.json");
const moods = new Set<DailyNoteMood>(dailyNoteMoods);
const difficulties = new Set<DailyNoteDifficulty>(dailyNoteDifficulties);

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function sanitizeMood(value: unknown): DailyNoteMood {
  return typeof value === "string" && moods.has(value as DailyNoteMood)
    ? (value as DailyNoteMood)
    : "normal";
}

function sanitizeDifficulty(value: unknown): DailyNoteDifficulty | undefined {
  return typeof value === "string" && difficulties.has(value as DailyNoteDifficulty)
    ? (value as DailyNoteDifficulty)
    : undefined;
}

function normalizeNoteText(value: unknown, maxLength = 1200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function fallbackUpdatedAt(date: string) {
  return `${date}T00:00:00.000Z`;
}

function sanitizeNote(input: Partial<DailyNote>, fallbackDate = new Date().toISOString().slice(0, 10)): DailyNote {
  const date = isDateKey(input.date) ? input.date : fallbackDate;

  return {
    date,
    mood: sanitizeMood(input.mood),
    difficulty: sanitizeDifficulty(input.difficulty),
    beforeText: normalizeNoteText(input.beforeText) || undefined,
    afterText: normalizeNoteText(input.afterText) || undefined,
    text: normalizeNoteText(input.text),
    updatedAt:
      typeof input.updatedAt === "string" && input.updatedAt.trim()
        ? input.updatedAt
        : fallbackUpdatedAt(date),
  };
}

async function readNotesFile(): Promise<NotesFile> {
  try {
    const raw = await readFile(notesFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<NotesFile>;
    const sourceNotes = parsed.notes ?? {};
    const notes = Object.fromEntries(
      Object.entries(sourceNotes).map(([date, note]) => [date, sanitizeNote(note, date)]),
    );

    return { version: 3, notes };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { version: 3, notes: {} };
    }

    throw error;
  }
}

async function writeNotesFile(notes: NotesFile) {
  await mkdir(path.dirname(notesFile), { recursive: true });
  await writeFile(notesFile, `${JSON.stringify(notes, null, 2)}\n`, "utf8");
}

export async function getDailyNoteByDate(date: string): Promise<DailyNote | null> {
  const notes = await readNotesFile();
  return notes.notes[date] ?? null;
}

export async function getDailyNotesHistory(limit = 14): Promise<DailyNote[]> {
  const notes = await readNotesFile();

  return Object.values(notes.notes)
    .filter(hasDailyNoteContent)
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, Math.max(1, Math.min(60, limit)));
}

export async function getDailyNotes(limit = 14): Promise<DailyNote[]> {
  return getDailyNotesHistory(limit);
}

export async function getDailyNote(date: string): Promise<DailyNote | null> {
  return getDailyNoteByDate(date);
}

export async function saveDailyNote(input: Partial<DailyNoteInput>): Promise<DailyNote> {
  const notes = await readNotesFile();
  const date = isDateKey(input.date) ? input.date : new Date().toISOString().slice(0, 10);
  const cleaned: DailyNote = {
    ...sanitizeNote(input, date),
    date,
    updatedAt: new Date().toISOString(),
  };

  notes.notes[date] = cleaned;
  await writeNotesFile(notes);

  return cleaned;
}
