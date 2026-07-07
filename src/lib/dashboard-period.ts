import type { DailyCodingActivity } from "@/lib/types";

export type DashboardPeriod = "today" | "7d" | "30d" | "365d" | "all";

export const dashboardPeriods: Array<{ id: DashboardPeriod; label: string }> = [
  { id: "today", label: "Сегодня" },
  { id: "7d", label: "7 дней" },
  { id: "30d", label: "30 дней" },
  { id: "365d", label: "Год" },
  { id: "all", label: "Всё время" },
];

export function getPeriodDays(days: DailyCodingActivity[], period: DashboardPeriod, todayDate: string) {
  if (period === "all" || period === "365d") {
    return days;
  }

  if (period === "today") {
    return days.filter((day) => day.date === todayDate);
  }

  const count = period === "7d" ? 7 : 30;
  const today = new Date(`${todayDate}T00:00:00`);
  const start = new Date(today);
  start.setDate(today.getDate() - count + 1);
  const startKey = start.toISOString().slice(0, 10);

  return days.filter((day) => day.date >= startKey && day.date <= todayDate);
}
