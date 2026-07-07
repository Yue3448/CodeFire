import type { DailyCodingActivity } from "@/lib/types";

export type ProjectZone = {
  name: string;
  zoneName: string;
  seconds: number;
  xp: number;
  percent: number;
  status: string;
};

function getZoneName(project: string) {
  const key = project.toLowerCase();

  if (key.includes("codefire")) return "Кузница интерфейса";
  if (key.includes("python")) return "Тренировочная арена";
  if (key.includes("stepik")) return "Башня задач";
  if (key.includes("unknown")) return "Неизвестная зона";

  return "Рабочая зона";
}

export function getProjectZones(days: DailyCodingActivity[]): ProjectZone[] {
  const totals = new Map<string, number>();

  for (const day of days) {
    for (const project of day.projects ?? []) {
      totals.set(project.name, (totals.get(project.name) ?? 0) + project.seconds);
    }
  }

  const totalSeconds = [...totals.values()].reduce((sum, seconds) => sum + seconds, 0);

  return [...totals.entries()]
    .map(([name, seconds]) => ({
      name,
      zoneName: getZoneName(name),
      seconds,
      xp: Math.floor(seconds / 60),
      percent: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
      status: seconds >= 3600 ? "Основная зона недели" : "Активная зона",
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 5);
}
