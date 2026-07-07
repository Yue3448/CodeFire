import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DailyCodingActivity } from "@/lib/types";

type HistoryDay = {
  date: string;
  xp: number;
  totalSeconds: number;
  codingSeconds: number;
  languages: DailyCodingActivity["languages"];
  projects?: DailyCodingActivity["projects"];
  updatedAt: string;
};

type CodeFireHistory = {
  version: 3;
  schema: "coding-v3-current-day-snapshots";
  days: Record<string, HistoryDay>;
};

export type CodeFireHistoryResult = {
  totalXP: number;
  days: DailyCodingActivity[];
};

const historyFile = path.join(process.cwd(), "data", "codefire-history.json");

async function readHistory(): Promise<CodeFireHistory> {
  try {
    const raw = await readFile(historyFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<CodeFireHistory>;

    if (parsed.version !== 3 || parsed.schema !== "coding-v3-current-day-snapshots") {
      return { version: 3, schema: "coding-v3-current-day-snapshots", days: {} };
    }

    return {
      version: 3,
      schema: "coding-v3-current-day-snapshots",
      days: parsed.days ?? {},
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { version: 3, schema: "coding-v3-current-day-snapshots", days: {} };
    }

    throw error;
  }
}

async function writeHistory(history: CodeFireHistory) {
  await mkdir(path.dirname(historyFile), { recursive: true });
  await writeFile(historyFile, `${JSON.stringify(history, null, 2)}\n`, "utf8");
}

export async function updateCodeFireHistory(
  days: DailyCodingActivity[],
  todayDate: string,
): Promise<CodeFireHistoryResult> {
  const history = await readHistory();
  const updatedAt = new Date().toISOString();

  for (const day of days) {
    if (day.xp > 0 && day.codingSeconds > 0) {
      history.days[day.date] = {
        date: day.date,
        xp: day.xp,
        totalSeconds: day.totalSeconds,
        codingSeconds: day.codingSeconds,
        languages: day.languages,
        projects: day.projects,
        updatedAt,
      };
    } else {
      delete history.days[day.date];
    }
  }

  if (!days.some((day) => day.date === todayDate && day.xp > 0 && day.codingSeconds > 0)) {
    delete history.days[todayDate];
  }

  for (const [date, day] of Object.entries(history.days)) {
    if (day.xp <= 0 || !day.codingSeconds || day.codingSeconds <= 0) {
      delete history.days[date];
    }
  }

  await writeHistory(history);

  const historyDays = Object.values(history.days)
    .filter((day) => day.xp > 0 && day.codingSeconds > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map<DailyCodingActivity>((day) => ({
      date: day.date,
      label: `${day.date.slice(8, 10)}.${day.date.slice(5, 7)}`,
      totalSeconds: day.totalSeconds,
      codingSeconds: day.codingSeconds,
      xp: day.xp,
      languages: day.languages ?? [],
      projects: day.projects,
      source: "history",
    }));

  return {
    totalXP: historyDays.reduce((sum, day) => sum + Math.max(0, day.xp), 0),
    days: historyDays,
  };
}
