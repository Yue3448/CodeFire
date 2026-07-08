import {
  clampNumber,
  getLocalDateKey,
  isDateKey,
  normalizeText,
  readJsonStore,
  writeJsonStore,
} from "@/lib/local-json-store.server";

export type LightDay = {
  date: string;
  enabled: boolean;
  reason?: string;
  minimumGoalMinutes: number;
  noteRequired?: boolean;
};

type LightDayFile = {
  version: 1;
  days: Record<string, LightDay>;
};

const fileName = "codefire-light-days.json";

function sanitizeLightDay(input: Partial<LightDay>): LightDay {
  const date = isDateKey(input.date) ? input.date : getLocalDateKey();
  const reason = normalizeText(input.reason, 300);

  return {
    date,
    enabled: Boolean(input.enabled),
    reason: reason || undefined,
    minimumGoalMinutes: clampNumber(input.minimumGoalMinutes, 15, 90, 25),
    noteRequired: Boolean(input.noteRequired),
  };
}

async function readLightDayFile(): Promise<LightDayFile> {
  const data = await readJsonStore<Partial<LightDayFile>>(fileName, { version: 1, days: {} });
  const sourceDays = data.days ?? {};

  return {
    version: 1,
    days: Object.fromEntries(Object.entries(sourceDays).map(([date, day]) => [date, sanitizeLightDay(day)])),
  };
}

export async function getLightDays() {
  const data = await readLightDayFile();

  return data.days;
}

export async function getLightDay(date: string) {
  const data = await readLightDayFile();

  return data.days[date] ?? { date, enabled: false, minimumGoalMinutes: 25, noteRequired: false };
}

export async function saveLightDay(input: Partial<LightDay>) {
  const data = await readLightDayFile();
  const lightDay = sanitizeLightDay(input);

  data.days[lightDay.date] = lightDay;
  await writeJsonStore<LightDayFile>(fileName, data);

  return lightDay;
}
