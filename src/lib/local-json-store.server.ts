import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export { clampNumber, getLocalDateKey, isDateKey, normalizeText } from "@/lib/local-json-store";

export function codeFireDataFile(fileName: string) {
  return path.join(process.cwd(), "data", fileName);
}

export async function readJsonStore<T>(fileName: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(codeFireDataFile(fileName), "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      await writeJsonStore(fileName, fallback);
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
