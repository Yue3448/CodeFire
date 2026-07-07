"use client";

import type { ReactNode } from "react";
import type { DayStat } from "@/lib/types";
import { formatHours } from "@/lib/format";
import { HEATMAP_LEGEND_XP_VALUES, getHeatmapIntensityClass } from "@/lib/heatmap-scale";
import { cn } from "@/lib/utils";

const weekDayLabels = ["Пн", "", "Ср", "", "Пт", "", ""];
const monthLabels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

type HeatmapCell = {
  key: string;
  day: DayStat | null;
};

function parseLocalDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function mondayFirstDayIndex(dateKey: string) {
  const day = parseLocalDate(dateKey).getDay();
  return day === 0 ? 6 : day - 1;
}

function getMainLanguage(day: DayStat) {
  return day.languages[0]?.name ?? null;
}

function buildWeeks(days: DayStat[]) {
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const leadingEmptyCells = sortedDays[0] ? mondayFirstDayIndex(sortedDays[0].date) : 0;
  const cells: HeatmapCell[] = [
    ...Array.from({ length: leadingEmptyCells }, (_, index) => ({
      key: `empty-start-${index}`,
      day: null,
    })),
    ...sortedDays.map((day) => ({ key: day.date, day })),
  ];
  const trailingEmptyCells = (7 - (cells.length % 7)) % 7;

  for (let index = 0; index < trailingEmptyCells; index += 1) {
    cells.push({ key: `empty-end-${index}`, day: null });
  }

  return Array.from({ length: Math.ceil(cells.length / 7) }, (_, weekIndex) =>
    cells.slice(weekIndex * 7, weekIndex * 7 + 7),
  );
}

function getMonthMarkers(days: DayStat[]) {
  const seenMonths = new Set<string>();
  const firstOffset = days[0] ? mondayFirstDayIndex(days[0].date) : 0;

  return days.flatMap((day, index) => {
    const monthKey = day.date.slice(0, 7);

    if (seenMonths.has(monthKey)) {
      return [];
    }

    seenMonths.add(monthKey);

    const date = parseLocalDate(day.date);
    const column = Math.floor((firstOffset + index) / 7) + 1;

    return [{ key: monthKey, label: monthLabels[date.getMonth()] ?? monthKey, column }];
  });
}

export function YearlyHeatmap({
  days,
  footer,
  onSelectDay,
}: {
  days: DayStat[];
  footer?: ReactNode;
  onSelectDay?: (date: string) => void;
}) {
  const weeks = buildWeeks(days);
  const activeDays = days.filter((day) => day.xp > 0).length;
  const bestDay = days.filter((day) => day.xp > 0).toSorted((a, b) => b.xp - a.xp)[0] ?? null;
  const monthMarkers = getMonthMarkers([...days].sort((a, b) => a.date.localeCompare(b.date)));

  return (
    <article className="glow-card overflow-hidden rounded-lg p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-100">
            <span className="text-orange-300">▦</span>
            Heatmap 365 дней
          </div>
          <div className="mt-1 text-xs font-semibold text-zinc-500">
            GitHub-style ритм CodeFire
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-bold text-zinc-300">
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1">
            {activeDays} активных
          </span>
          <span className="rounded-full border border-orange-300/25 bg-orange-300/10 px-3 py-1 text-orange-100">
            best {bestDay?.xp ?? 0} XP
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-max">
          <div
            className="ml-8 grid gap-[3px] text-[10px] font-semibold text-zinc-500"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, 10px)` }}
          >
            {monthMarkers.map((marker) => (
              <span
                key={marker.key}
                className="h-4 whitespace-nowrap"
                style={{ gridColumnStart: marker.column }}
              >
                {marker.label}
              </span>
            ))}
          </div>

          <div className="mt-1 flex gap-2">
            <div className="grid h-[88px] grid-rows-7 gap-[3px] pt-[1px] text-[10px] font-semibold text-zinc-500">
              {weekDayLabels.map((label, index) => (
                <span key={`${label}-${index}`} className="h-[10px] leading-[10px]">
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
              {weeks.flatMap((week) =>
                week.map((cell) => {
                  if (!cell.day) {
                    return <span key={cell.key} className="h-[10px] w-[10px]" aria-hidden="true" />;
                  }

                  const language = getMainLanguage(cell.day);
                  const title = [
                    cell.day.date,
                    `${cell.day.xp} XP`,
                    formatHours(cell.day.totalSeconds),
                    language ? `главный язык: ${language}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      title={title}
                      onClick={() => onSelectDay?.(cell.day?.date ?? "")}
                      className={cn(
                        "h-[10px] w-[10px] rounded-[2px] border transition-transform hover:scale-125 hover:ring-1 hover:ring-emerald-200/70",
                        getHeatmapIntensityClass(cell.day.xp),
                      )}
                    />
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2 text-xs text-zinc-400">
        <span>Тише</span>
        <div className="flex gap-1">
          {HEATMAP_LEGEND_XP_VALUES.map((level) => (
            <span
              key={level}
              className={cn("h-3 w-3 rounded-[2px] border", getHeatmapIntensityClass(level))}
            />
          ))}
        </div>
        <span>Жарче</span>
      </div>

      {footer ? <div className="mt-5 border-t border-white/10 pt-4">{footer}</div> : null}
    </article>
  );
}
