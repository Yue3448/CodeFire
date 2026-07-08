import {
  getLocalDateKey,
  isDateKey,
  normalizeText,
  readJsonStore,
  writeJsonStore,
} from "@/lib/local-json-store.server";

export type DailyDifficulty = {
  date: string;
  difficulty: "easy" | "normal" | "hard" | "veryHard";
  reason?: string;
  updatedAt: string;
};

type DifficultyFile = {
  version: 1;
  days: Record<string, DailyDifficulty>;
};

const fileName = "codefire-difficulty.json";
const difficulties = new Set<DailyDifficulty["difficulty"]>(["easy", "normal", "hard", "veryHard"]);

function sanitizeDifficulty(value: unknown): DailyDifficulty["difficulty"] {
  return typeof value === "string" && difficulties.has(value as DailyDifficulty["difficulty"])
    ? (value as DailyDifficulty["difficulty"])
    : "normal";
}

function sanitizeEntry(input: Partial<DailyDifficulty>): DailyDifficulty {
  const date = isDateKey(input.date) ? input.date : getLocalDateKey();
  const reason = normalizeText(input.reason, 400);

  return {
    date,
    difficulty: sanitizeDifficulty(input.difficulty),
    reason: reason || undefined,
    updatedAt:
      typeof input.updatedAt === "string" && input.updatedAt
        ? input.updatedAt
        : new Date().toISOString(),
  };
}

async function readDifficultyFile(): Promise<DifficultyFile> {
  const data = await readJsonStore<Partial<DifficultyFile>>(fileName, { version: 1, days: {} });
  const sourceDays = data.days ?? {};

  return {
    version: 1,
    days: Object.fromEntries(Object.entries(sourceDays).map(([date, day]) => [date, sanitizeEntry(day)])),
  };
}

export async function getDailyDifficulties() {
  const data = await readDifficultyFile();

  return data.days;
}

export async function getDailyDifficulty(date: string) {
  const data = await readDifficultyFile();

  return data.days[date] ?? null;
}

export async function saveDailyDifficulty(input: Partial<DailyDifficulty>) {
  const data = await readDifficultyFile();
  const entry = sanitizeEntry(input);
  entry.updatedAt = new Date().toISOString();

  data.days[entry.date] = entry;
  await writeJsonStore<DifficultyFile>(fileName, data);

  return entry;
}
