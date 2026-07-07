import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function codeFireDataFile(fileName: string) {
  return path.join(process.cwd(), "data", fileName);
}

export async function readJsonStore<T>(fileName: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(codeFireDataFile(fileName), "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

export async function writeJsonStore<T>(fileName: string, data: T) {
  const filePath = codeFireDataFile(fileName);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

export function normalizeText(value: unknown, maxLength = 240) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
