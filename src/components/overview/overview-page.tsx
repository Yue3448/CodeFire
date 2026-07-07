"use client";

import Image from "next/image";
import { useState } from "react";
import { Activity, BarChart3, Flame, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, ProgressBar, useRemoteData } from "@/components/pages/page-kit";
import { isExcludedLanguage } from "@/lib/activity-filters";
import type { CodeFireOverviewData, DayStat, LanguageStat } from "@/lib/types";
import { getRankProgress, type Rank } from "@/lib/ranks";
import { cn } from "@/lib/utils";

const OVERVIEW_HEATMAP_LEGEND_XP_VALUES = [0, 1, 31, 61, 121, 241] as const;
const PYTHON_LOGO_SRC = "/languages/python_logo.png";

type LearningBalanceStatus = "notStarted" | "light" | "steady" | "productive" | "intense" | "overloadRisk" | "recovery";
type LearningBalanceTone = "neutral" | "healthy" | "productive" | "intense" | "warning";

type LearningBalance = {
  score: number;
  status: LearningBalanceStatus;
  title: string;
  description: string;
  nextAction: string;
  meta: string;
  tone: LearningBalanceTone;
};

export function OverviewPage() {
  const state = useRemoteData<CodeFireOverviewData>("/api/overview");

  if (state.status === "loading") return <LoadingState label="Loading overview..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const data = state.data;
  const rpg = data.rpg;
  const rank = data.progression.rank?.currentRank
    ? data.progression.rank
    : data.progression.rankProgress?.currentRank
      ? data.progression.rankProgress
      : getRankProgress(data.progression.totalXP);
  const dailyLanguages = getDailyLanguageBreakdown(data.today.languages);
  const chartDays = data.last30Days.days.slice(-14);
  const histogramDays = data.last30Days.days.slice(-7);
  const heatmapDays = data.last30Days.days.slice(-30);
  const levelXpLeft = Math.max(0, data.progression.nextLevelXP - data.progression.totalXP);
  const learningBalance = calculateLearningBalance({
    today: data.today,
    dailyLanguages,
    streakCurrent: rpg.streak.current,
    quests: rpg.quests,
    pomodoroToday: data.pomodoroToday,
    recentDays: data.last30Days.days,
  });

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="Overview"
        title="CodeFire"
        description="Compact daily progress, rank momentum, languages, and rhythm."
      />

      <section className="grid gap-4 xl:grid-cols-[1.22fr_0.78fr]">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <CardTitle icon={Flame} label="Daily Summary" />
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
              {data.today.status.label}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.2fr]">
            <HeroMetric label="Today XP" value={`${data.today.xp}`} hint="WakaTime coding minutes" accent="orange" />
            <HeroMetric label="Coding Time" value={formatDuration(data.today.totalSeconds)} hint="today" accent="green" />
            <HeroMetric
              label="Main Language"
              value={<LanguageValue language={data.today.mainLanguage} />}
              hint="top signal"
              accent="neutral"
            />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <TinyStat label="Streak" value={`${rpg.streak.current} days`} />
              <TinyStat label="Rank" value={rank.currentRank.name} />
              <TinyStat label="Level" value={`Level ${data.progression.level}`} />
            </div>

            <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                  Languages Today
                </div>
                <div className="text-[11px] font-bold text-zinc-500">top {dailyLanguages.length || 0}</div>
              </div>
              {dailyLanguages.length > 0 ? (
                <div className="grid gap-2">
                  {dailyLanguages.map((language) => (
                    <LanguageRow key={language.name} language={language} />
                  ))}
                </div>
              ) : (
                <div className="text-xs font-semibold text-zinc-500">No coding language data today.</div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <CardTitle icon={Trophy} label="Progression" />
          <div className="flex min-w-0 items-center gap-4">
            <RankBadge rank={rank.currentRank} size="large" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Current Rank</div>
              <div className="mt-1 break-words text-xl font-black leading-tight text-white">{rank.currentRank.name}</div>
              <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-emerald-300/15 bg-emerald-300/10 px-3 py-2">
                <RankBadge rank={rank.nextRank} size="small" />
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Next Rank</div>
                  <div className="break-words text-xs font-black leading-tight text-zinc-300">
                    {rank.nextRank?.name ?? "Max rank reached"}
                  </div>
                  <div className="mt-0.5 text-[11px] font-bold text-emerald-100">
                    {rank.nextRank ? `${rank.xpToNextRank} XP left` : "Peak reached"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-3 rounded-lg border border-emerald-300/15 bg-emerald-300/10 p-3">
            <div className="text-4xl font-black leading-none text-white">{data.progression.level}</div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">Current Level</div>
              <div className="mt-1 text-xs font-semibold text-zinc-400">
                {levelXpLeft} XP to next level
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <ProgressBar
              percent={data.progression.progressPercent}
              label="Next level"
              meta={`${data.progression.xpIntoLevel} / ${data.progression.xpForLevel} XP`}
            />
            <ProgressBar
              percent={rank.progressPercent}
              label={rank.nextRank ? `Next rank: ${rank.nextRank.name}` : "Max rank reached"}
              meta={rank.isMaxRank ? "Max rank" : `${rank.xpToNextRank} XP left`}
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-4 sm:p-5">
          <CardTitle icon={Activity} label="Heatmap Preview" />
          <OverviewHeatmap days={heatmapDays} />
        </Card>

        <Card className="p-4 sm:p-5">
          <CardTitle icon={BarChart3} label="Mini Trends" />
          <div className="grid gap-3 lg:grid-cols-2">
            <MiniHistogram days={histogramDays} />
            <MiniSparkline days={chartDays} />
          </div>
          <LearningBalancePanel balance={learningBalance} />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="p-4 sm:p-5">
          <CardTitle icon={Sparkles} label="Daily Quests" />
          <div className="grid gap-2">
            {rpg.quests.slice(0, 3).map((quest) => (
              <div key={quest.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words text-sm font-black text-white">{quest.title}</div>
                    <div className="mt-1 text-xs text-zinc-500">{quest.rewardLabel}</div>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[11px] font-black text-emerald-100">
                    {quest.completed ? "done" : "open"}
                  </span>
                </div>
                <ProgressBar percent={(quest.progress / quest.target) * 100} label={`${quest.progress} / ${quest.target}`} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <CardTitle icon={ShieldCheck} label="Active Raid" />
          {rpg.todayRaid ? (
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words text-lg font-black text-white">{rpg.todayRaid.title}</div>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{rpg.todayRaid.description}</p>
                </div>
                <span className="rounded-full border border-orange-300/25 bg-orange-300/10 px-2 py-1 text-[11px] font-black text-orange-100">
                  {rpg.todayRaid.completed ? "Cleared" : "In progress"}
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar percent={rpg.todayRaid.progress} label="Raid progress" meta={`${rpg.todayRaid.progress}%`} />
              </div>
            </div>
          ) : (
            <EmptyState>No active raid right now.</EmptyState>
          )}
        </Card>
      </section>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  accent: "orange" | "green" | "neutral";
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border bg-black/25 p-4",
        accent === "orange" ? "border-orange-300/25" : accent === "green" ? "border-emerald-300/25" : "border-white/10",
      )}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-1 min-w-0 break-words text-3xl font-black leading-none text-white">{value}</div>
      <div className="mt-2 break-words text-xs font-semibold text-zinc-500">{hint}</div>
    </div>
  );
}

function LanguageValue({ language }: { language: string }) {
  const isPython = language.trim().toLowerCase() === "python";

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2 align-middle">
      {isPython ? (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-emerald-300/25 bg-black/35 p-1 shadow-[0_0_12px_rgba(89,255,145,0.16)]">
          <Image src={PYTHON_LOGO_SRC} alt="" width={24} height={24} className="h-6 w-6 object-contain" aria-hidden="true" />
        </span>
      ) : null}
      <span className="min-w-0 break-words">{language}</span>
    </span>
  );
}

function TinyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="break-words text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">{label}</div>
      <div className="mt-1 break-words text-sm font-black leading-tight text-white" title={value}>{value}</div>
    </div>
  );
}

function LanguageRow({ language }: { language: LanguageStat }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex min-w-0 items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate font-black text-zinc-100" title={language.name}>{language.name}</span>
        <span className="shrink-0 font-bold text-zinc-400">{formatDuration(language.totalSeconds)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-orange-300"
          style={{ width: `${Math.min(100, Math.max(0, language.percent))}%` }}
        />
      </div>
    </div>
  );
}

function RankBadge({ rank, size }: { rank: Rank | null; size: "small" | "large" }) {
  const imageSize = size === "large" ? 96 : 28;
  const sizeClass = size === "large" ? "h-24 w-24" : "h-7 w-7";

  if (rank?.badgeImage) {
    return (
      <span
        className={cn("relative block shrink-0 overflow-hidden rounded-md", sizeClass)}
        style={{ filter: `drop-shadow(0 0 ${size === "large" ? "16px" : "7px"} ${rank.glowColor})` }}
        title={rank.name}
      >
        <Image
          src={rank.badgeImage}
          alt=""
          width={imageSize}
          height={imageSize}
          sizes={`${imageSize}px`}
          className={cn("h-full w-full object-contain", size === "large" ? "scale-125" : "scale-110")}
          draggable={false}
          aria-hidden="true"
          priority={size === "large"}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-md border border-white/10 bg-black/25 font-black text-orange-100",
        sizeClass,
        size === "large" ? "text-2xl" : "text-[10px]",
      )}
      aria-hidden="true"
    >
      {rank?.medalIcon ?? (size === "small" ? "MAX" : "XP")}
    </span>
  );
}

function MiniHistogram({ days }: { days: DayStat[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxSeconds = Math.max(1, ...days.map((day) => getCodingSeconds(day)));
  const totalSeconds = days.reduce((sum, day) => sum + getCodingSeconds(day), 0);
  const hoveredDay = hoveredIndex === null ? null : days[hoveredIndex];

  return (
    <div className="relative min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">7 Day Coding Time</div>
        <div className="text-xs font-black text-orange-100">{formatDuration(totalSeconds)}</div>
      </div>
      <div className="flex h-28 items-end gap-2">
        {days.map((day) => {
          const seconds = getCodingSeconds(day);

          return (
            <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-20 w-full items-end rounded-md bg-black/30 px-1">
                <button
                  type="button"
                  onMouseEnter={() => setHoveredIndex(days.indexOf(day))}
                  onFocus={() => setHoveredIndex(days.indexOf(day))}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onBlur={() => setHoveredIndex(null)}
                  className={cn(
                    "w-full cursor-pointer rounded-t-md bg-gradient-to-t from-orange-500 to-emerald-300 shadow-[0_0_12px_rgba(89,255,145,0.18)] transition-all hover:from-orange-300 hover:to-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200/70",
                    hoveredDay?.date === day.date ? "brightness-125 shadow-[0_0_16px_rgba(89,255,145,0.38)]" : "",
                  )}
                  style={{ height: `${Math.max(seconds > 0 ? 10 : 3, (seconds / maxSeconds) * 100)}%` }}
                  aria-label={`${day.date}: ${formatDuration(seconds)}`}
                />
              </div>
              <div className="truncate text-[10px] font-bold text-zinc-500">{day.label}</div>
            </div>
          );
        })}
      </div>
      {hoveredDay ? <MiniTrendTooltip day={hoveredDay} className="left-3 top-12" /> : null}
    </div>
  );
}

function MiniSparkline({ days }: { days: DayStat[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 320;
  const height = 96;
  const maxSeconds = Math.max(1, ...days.map((day) => getCodingSeconds(day)));
  const pointItems = days.map((day, index) => {
    const x = days.length <= 1 ? 0 : (index / (days.length - 1)) * width;
    const y = height - (getCodingSeconds(day) / maxSeconds) * (height - 16) - 8;

    return { day, x, y };
  });
  const points = pointItems.map((point) => `${point.x},${point.y}`);
  const hoveredPoint = hoveredIndex === null ? null : pointItems[hoveredIndex];

  return (
    <div className="relative min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">14 Day Time Trend</div>
        <div className="text-xs font-black text-emerald-100">coding time</div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full cursor-crosshair overflow-visible" role="img" aria-label="14 day coding time trend">
        <defs>
          <linearGradient id="overview-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(89,255,145,0.28)" />
            <stop offset="100%" stopColor="rgba(89,255,145,0)" />
          </linearGradient>
        </defs>
        <polyline
          points={["0,96", ...points, "320,96"].join(" ")}
          fill="url(#overview-trend-fill)"
          stroke="none"
        />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#59ff91"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {hoveredPoint ? (
          <line
            x1={hoveredPoint.x}
            x2={hoveredPoint.x}
            y1="4"
            y2={height}
            stroke="rgba(255,255,255,0.18)"
            strokeDasharray="4 4"
          />
        ) : null}
        {pointItems.map((point, index) => (
          <g key={point.day.date}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 6 : 3.5}
              fill={hoveredIndex === index ? "#fbbf24" : "#59ff91"}
              stroke="#06110d"
              strokeWidth="2"
              className="transition-all"
            />
            <rect
              x={Math.max(0, point.x - width / Math.max(1, days.length - 1) / 2)}
              y="0"
              width={width / Math.max(1, days.length - 1)}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onBlur={() => setHoveredIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`${point.day.date}: ${formatDuration(getCodingSeconds(point.day))}`}
            />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-bold text-zinc-500">
        <span>{days[0]?.label ?? "--"}</span>
        <span>{days.at(-1)?.label ?? "--"}</span>
      </div>
      {hoveredPoint ? <MiniTrendTooltip day={hoveredPoint.day} className="right-3 top-12" /> : null}
    </div>
  );
}

function MiniTrendTooltip({ day, className }: { day: DayStat; className?: string }) {
  const codingSeconds = getCodingSeconds(day);
  const mainLanguage = getDayMainLanguage(day);

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 min-w-40 rounded-lg border border-emerald-300/25 bg-[#07110d]/95 p-3 text-xs shadow-[0_12px_32px_rgba(0,0,0,0.38),0_0_18px_rgba(89,255,145,0.12)]",
        className,
      )}
    >
      <div className="font-black text-white">{day.date}</div>
      <div className="mt-1 font-bold text-emerald-100">{formatDuration(codingSeconds)}</div>
      <div className="mt-1 text-zinc-400">{day.xp} XP</div>
      <div className="mt-1 break-words text-zinc-400">
        {mainLanguage ? `Main: ${mainLanguage}` : "Main: none"}
      </div>
      <div className={cn("mt-1 font-bold", codingSeconds > 0 ? "text-orange-100" : "text-zinc-500")}>
        {codingSeconds > 0 ? "Active day" : "Inactive day"}
      </div>
    </div>
  );
}

function LearningBalancePanel({ balance }: { balance: LearningBalance }) {
  return (
    <div className="mt-3 min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-3 flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Learning Balance</div>
          <div className="mt-1 break-words text-sm font-black text-white">Баланс обучения</div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-black",
            getLearningBalanceToneClass(balance.tone, "badge"),
          )}
        >
          {balance.title}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-4xl font-black leading-none text-white">{balance.score}%</div>
        <div className="min-w-0">
          <div className="break-words text-xs font-bold text-emerald-100">{balance.meta}</div>
          <div className="mt-1 break-words text-xs leading-5 text-zinc-400">{balance.description}</div>
          <div className="mt-1 break-words text-xs leading-5 text-orange-100">{balance.nextAction}</div>
        </div>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-emerald-300/15 bg-black/40">
        <div
          className={cn("h-full rounded-full shadow-[0_0_14px_rgba(89,255,145,0.22)]", getLearningBalanceToneClass(balance.tone, "bar"))}
          style={{ width: `${balance.score}%` }}
        />
      </div>
    </div>
  );
}

function OverviewHeatmap({ days }: { days: DayStat[] }) {
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const cells = buildMonthlyHeatmapCells(sortedDays);
  const activeDays = sortedDays.filter((day) => day.xp > 0).length;
  const bestDay = sortedDays.filter((day) => day.xp > 0).toSorted((a, b) => b.xp - a.xp)[0] ?? null;

  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-zinc-400">Last {sortedDays.length} days</div>
        <div className="flex flex-wrap gap-2 text-[11px] font-black">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-emerald-100">
            {activeDays} active
          </span>
          <span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-2 py-1 text-orange-100">
            best {bestDay?.xp ?? 0} XP
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-300/10 bg-black/25 p-2.5">
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black uppercase text-zinc-500">
          {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>

        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {cells.map((cell) => {
            if (!cell.day) {
              return (
                <span
                  key={cell.key}
                  className="aspect-square rounded-[3px] border border-emerald-300/10 bg-[#050b08]"
                  aria-hidden="true"
                />
              );
            }

            return (
              <span
                key={cell.key}
                title={`${cell.day.date} - ${cell.day.xp} XP - ${formatDuration(cell.day.totalSeconds)}`}
                className={cn(
                  "aspect-square rounded-[3px] border shadow-[0_0_0_1px_rgba(255,255,255,0.035)_inset]",
                  getOverviewHeatmapIntensityClass(cell.day.xp),
                )}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-zinc-400">
        <span>Quiet</span>
        <div className="flex gap-1">
          {OVERVIEW_HEATMAP_LEGEND_XP_VALUES.map((level) => (
            <span
              key={level}
              className={cn("h-3 w-3 rounded-[2px] border", getOverviewHeatmapIntensityClass(level))}
            />
          ))}
        </div>
        <span>Hot</span>
      </div>
    </div>
  );
}

function getDailyLanguageBreakdown(languages: LanguageStat[]) {
  const codingLanguages = languages.filter((language) => !isExcludedLanguage(language.name));
  const preferredLanguages = codingLanguages.length > 0 ? codingLanguages : languages;

  return preferredLanguages.slice(0, 4);
}

function calculateLearningBalance({
  today,
  dailyLanguages,
  streakCurrent,
  quests,
  pomodoroToday,
  recentDays,
}: {
  today: CodeFireOverviewData["today"];
  dailyLanguages: LanguageStat[];
  streakCurrent: number;
  quests: CodeFireOverviewData["rpg"]["quests"];
  pomodoroToday: CodeFireOverviewData["pomodoroToday"];
  recentDays: DayStat[];
}): LearningBalance {
  const codingMinutes = Math.round(today.totalSeconds / 60);
  const yesterday = recentDays.at(-2);
  const yesterdayMinutes = yesterday ? Math.round(getCodingSeconds(yesterday) / 60) : 0;
  const mainLanguage = dailyLanguages[0]?.name ?? (today.mainLanguage === "Нет кода" ? null : today.mainLanguage);
  const focusPercent = dailyLanguages[0]?.percent ?? 0;
  const completedQuests = quests.filter((quest) => quest.completed).length;
  const openQuests = quests.length - completedQuests;
  const questRatio = quests.length > 0 ? completedQuests / quests.length : 0;
  const bestDaySeconds = Math.max(0, ...recentDays.map((day) => getCodingSeconds(day)));
  const closeToRecord = codingMinutes > 0 && bestDaySeconds > 0 && bestDaySeconds - today.totalSeconds > 0 && bestDaySeconds - today.totalSeconds <= 30 * 60;
  const status = getLearningBalanceStatus(codingMinutes, yesterdayMinutes);
  let score = getBaseLearningBalanceScore(status, codingMinutes);

  if (today.xp >= codingMinutes - 2) score += 2;
  if (focusPercent >= 85) score += 7;
  else if (focusPercent >= 70) score += 5;
  else if (focusPercent < 40 && codingMinutes >= 60) score -= 4;

  if (streakCurrent >= 3) score += 4;
  else if (streakCurrent >= 1) score += 2;
  if (streakCurrent >= 7 && codingMinutes >= 300) score -= 6;

  score += Math.round(questRatio * 6);

  if (pomodoroToday.completedFocusSessions > 0) score += Math.min(5, pomodoroToday.completedFocusSessions * 2);
  if (pomodoroToday.completedBreakSessions > 0) score += 2;
  if (pomodoroToday.completedFocusSessions >= 3 && pomodoroToday.completedBreakSessions === 0) score -= 4;

  if (status === "overloadRisk") score = Math.min(score, 74);
  if (status === "notStarted") score = Math.min(score, 24);

  const title = getLearningBalanceTitle(status);
  const tone = getLearningBalanceTone(status);

  return {
    score: clampScore(score),
    status,
    title,
    tone,
    meta: `${formatDuration(today.totalSeconds)} coding · ${mainLanguage ? `${mainLanguage} focus` : "no main focus"}`,
    description: getLearningBalanceDescription(status, codingMinutes, mainLanguage, focusPercent),
    nextAction: getLearningBalanceNextAction({
      status,
      codingMinutes,
      closeToRecord,
      openQuests,
      completedFocusSessions: pomodoroToday.completedFocusSessions,
    }),
  };
}

function getLearningBalanceStatus(codingMinutes: number, yesterdayMinutes: number): LearningBalanceStatus {
  if (yesterdayMinutes >= 240 && codingMinutes > 0 && codingMinutes <= 60) return "recovery";
  if (codingMinutes === 0) return "notStarted";
  if (codingMinutes <= 30) return "light";
  if (codingMinutes <= 90) return "steady";
  if (codingMinutes <= 180) return "productive";
  if (codingMinutes < 300) return "intense";

  return "overloadRisk";
}

function getBaseLearningBalanceScore(status: LearningBalanceStatus, codingMinutes: number) {
  switch (status) {
    case "notStarted":
      return 18;
    case "light":
      return 44 + Math.min(10, Math.round(codingMinutes / 3));
    case "steady":
      return 58 + Math.min(14, Math.round((codingMinutes - 30) / 4));
    case "productive":
      return 74 + Math.min(10, Math.round((codingMinutes - 90) / 9));
    case "intense":
      return 82;
    case "overloadRisk":
      return 68;
    case "recovery":
      return 70;
  }
}

function getLearningBalanceTitle(status: LearningBalanceStatus) {
  switch (status) {
    case "notStarted":
      return "День ещё не начался";
    case "light":
      return "Лёгкий день";
    case "steady":
      return "Стабильная практика";
    case "productive":
      return "Продуктивный день";
    case "intense":
      return "Интенсивный день";
    case "overloadRisk":
      return "Риск перегруза";
    case "recovery":
      return "День восстановления";
  }
}

function getLearningBalanceDescription(
  status: LearningBalanceStatus,
  codingMinutes: number,
  mainLanguage: string | null,
  focusPercent: number,
) {
  if (status === "notStarted") return "Пока нет кодинг-активности. Можно начать с маленькой сессии на 15 минут.";
  if (status === "recovery") return "После сильного дня короткая практика — нормальный и полезный ритм.";
  if (status === "overloadRisk") return "Сегодня очень высокая нагрузка. Лучше завершить день мягко и восстановиться.";
  if (codingMinutes <= 60) return "День начат. Небольшая практика помогает сохранить ритм.";
  if (codingMinutes <= 120) return "Хорошая учебная сессия: достаточно практики для реального прогресса.";
  if (codingMinutes <= 240) {
    return mainLanguage && focusPercent >= 70
      ? `Сильный день: основной фокус сегодня — ${mainLanguage}.`
      : "Сильный день: объём уже заметный, прогресс хорошо закрепляется.";
  }

  return "Очень мощный день. Лучше не забыть про перерыв и короткий итог в дневнике.";
}

function getLearningBalanceNextAction({
  status,
  codingMinutes,
  closeToRecord,
  openQuests,
  completedFocusSessions,
}: {
  status: LearningBalanceStatus;
  codingMinutes: number;
  closeToRecord: boolean;
  openQuests: number;
  completedFocusSessions: number;
}) {
  if (status === "notStarted") return "Следующий шаг: короткая 15-минутная сессия или спокойный отдых.";
  if (status === "overloadRisk") return "Следующий шаг: остановиться мягко, сделать перерыв и восстановиться.";
  if (closeToRecord) return "Следующий шаг: ты близко к личному рекорду дня — можно добрать несколько минут без рывка.";
  if (codingMinutes >= 240) return "Следующий шаг: запиши короткий итог дня и сделай паузу.";
  if (completedFocusSessions === 0 && codingMinutes >= 90) return "Следующий шаг: добавь структурированный перерыв, чтобы не смазать фокус.";
  if (openQuests > 0 && codingMinutes >= 30) return "Следующий шаг: можно закрыть один открытый daily quest.";
  if (status === "light" || status === "recovery") return "Следующий шаг: если устал, light day тоже считается.";

  return "Следующий шаг: хороший день для спокойного завершения без перегруза.";
}

function getLearningBalanceTone(status: LearningBalanceStatus): LearningBalanceTone {
  switch (status) {
    case "notStarted":
      return "neutral";
    case "light":
    case "recovery":
      return "healthy";
    case "steady":
    case "productive":
      return "productive";
    case "intense":
      return "intense";
    case "overloadRisk":
      return "warning";
  }
}

function getLearningBalanceToneClass(tone: LearningBalanceTone, target: "badge" | "bar") {
  if (target === "bar") {
    switch (tone) {
      case "neutral":
        return "bg-zinc-500";
      case "healthy":
        return "bg-gradient-to-r from-emerald-500 to-emerald-300";
      case "productive":
        return "bg-gradient-to-r from-emerald-500 to-orange-300";
      case "intense":
        return "bg-gradient-to-r from-orange-500 to-amber-300";
      case "warning":
        return "bg-gradient-to-r from-orange-600 to-red-400";
    }
  }

  switch (tone) {
    case "neutral":
      return "border-zinc-400/20 bg-zinc-400/10 text-zinc-200";
    case "healthy":
      return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
    case "productive":
      return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
    case "intense":
      return "border-orange-300/25 bg-orange-300/10 text-orange-100";
    case "warning":
      return "border-red-300/25 bg-red-400/10 text-red-100";
  }
}

function clampScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function buildMonthlyHeatmapCells(days: DayStat[]) {
  const leadingEmptyCells = days[0] ? mondayFirstDayIndex(days[0].date) : 0;
  const cells = [
    ...Array.from({ length: leadingEmptyCells }, (_, index) => ({
      key: `empty-start-${index}`,
      day: null as DayStat | null,
    })),
    ...days.map((day) => ({ key: day.date, day })),
  ];
  const trailingEmptyCells = (7 - (cells.length % 7)) % 7;

  for (let index = 0; index < trailingEmptyCells; index += 1) {
    cells.push({ key: `empty-end-${index}`, day: null });
  }

  return cells;
}

function getOverviewHeatmapIntensityClass(xp: number) {
  if (xp <= 0) {
    return "border-emerald-500/22 bg-[#07130d]";
  }

  if (xp <= 30) {
    return "border-emerald-400/34 bg-[#0b3b25]";
  }

  if (xp <= 60) {
    return "border-emerald-300/42 bg-[#11683a]";
  }

  if (xp <= 120) {
    return "border-emerald-200/52 bg-[#16a34a]";
  }

  if (xp <= 240) {
    return "border-emerald-100/70 bg-[#34d399] shadow-[0_0_10px_rgba(52,211,153,0.34)]";
  }

  return "border-emerald-50/85 bg-[#86efac] shadow-[0_0_14px_rgba(134,239,172,0.52)]";
}

function getCodingSeconds(day: DayStat) {
  return day.codingSeconds || day.totalSeconds;
}

function getDayMainLanguage(day: DayStat) {
  return day.languages[0]?.name ?? null;
}

function mondayFirstDayIndex(dateKey: string) {
  const day = new Date(`${dateKey}T00:00:00`).getDay();

  return day === 0 ? 6 : day - 1;
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(seconds, 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes}м`;
  }

  return `${hours}ч ${minutes}м`;
}
