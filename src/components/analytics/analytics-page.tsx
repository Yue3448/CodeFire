"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Flame,
  Gauge,
  Layers3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table2,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { YearlyHeatmap } from "@/components/heatmap/yearly-heatmap";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, useRemoteData } from "@/components/pages/page-kit";
import {
  calculateActivityDistribution,
  calculateAnalyticsSummary,
  calculateLanguageBreakdown,
  calculateProjectBreakdown,
  calculateRecords,
  calculateWeekdayStats,
  calculateWeeklyComparison,
  calculateYearSummary,
  filterAnalyticsDays,
  formatAnalyticsDuration,
  generateAnalyticsInsights,
  type ActivityDistributionItem,
  type AnalyticsMetric,
  type AnalyticsPeriod,
  type LanguageStat,
  type ProjectStat,
  type WeekdayStat,
} from "@/lib/analytics";
import type { CodeFireData, DailyCodingActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

type AnalyticsPayload = {
  generatedAt: string;
  last365Days: CodeFireData["last365Days"];
  today: CodeFireData["today"];
};

type DailyChartPoint = {
  date: string;
  label: string;
  seconds: number;
  hours: number;
  xp: number;
  value: number;
  language: string;
  active: boolean;
};

type TooltipContentProps<T> = {
  active?: boolean;
  payload?: Array<{
    color?: string;
    name?: string;
    payload: T;
    value?: number | string;
  }>;
  label?: string | number;
};

const periodOptions: Array<{ label: string; value: AnalyticsPeriod }> = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
  { label: "365 days", value: 365 },
  { label: "All time", value: "all" },
];

const metricOptions: Array<{ label: string; value: AnalyticsMetric }> = [
  { label: "Coding time", value: "time" },
  { label: "XP", value: "xp" },
];

const chartColors = ["#59ff91", "#ffb347", "#38bdf8", "#f472b6", "#a78bfa", "#f87171", "#84cc16", "#facc15"];
type BreakdownTooltipDatum = Partial<LanguageStat & ProjectStat & WeekdayStat & ActivityDistributionItem> & {
  label?: string;
  seconds?: number;
  xp?: number;
  share?: number;
  days?: number;
  activeDays?: number;
  averageSeconds?: number;
  language?: string;
  project?: string;
  weekday?: string;
};

const distributionColors: Record<ActivityDistributionItem["key"], string> = {
  zero: "#27272a",
  light: "#86efac",
  steady: "#59ff91",
  productive: "#ffb347",
  intense: "#fb7185",
};

function getDaySeconds(day: DailyCodingActivity) {
  return day.codingSeconds || day.totalSeconds || 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatAxisValue(value: number, metric: AnalyticsMetric) {
  if (metric === "xp") return `${Math.round(value)}`;
  if (value === 0) return "0";
  if (value < 1) return `${Math.round(value * 60)}m`;

  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}h`;
}

function getMetricValue(day: DailyCodingActivity, metric: AnalyticsMetric) {
  return metric === "xp" ? day.xp : Number((getDaySeconds(day) / 3600).toFixed(2));
}

function getBestLanguageName(day: DailyCodingActivity) {
  return day.languages[0]?.name ?? "No language";
}

function buildChartData(days: DailyCodingActivity[], metric: AnalyticsMetric): DailyChartPoint[] {
  return days.map((day) => ({
    date: day.date,
    label: day.label,
    seconds: getDaySeconds(day),
    hours: Number((getDaySeconds(day) / 3600).toFixed(2)),
    xp: day.xp,
    value: getMetricValue(day, metric),
    language: getBestLanguageName(day),
    active: getDaySeconds(day) > 0,
  }));
}

function CompactStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 px-3 py-2.5">
      <div className="break-words text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-1 break-words text-lg font-black leading-tight text-white">{value}</div>
      {hint ? <div className="mt-1 break-words text-[11px] leading-4 text-zinc-500">{hint}</div> : null}
    </div>
  );
}

function DailyTooltip({ active, payload, metric }: TooltipContentProps<DailyChartPoint> & { metric: AnalyticsMetric }) {
  const point = payload?.[0]?.payload;

  if (!active || !point) return null;

  return (
    <div className="rounded-lg border border-emerald-300/25 bg-[#08100d]/95 p-3 text-xs shadow-2xl">
      <div className="font-black text-white">{point.date}</div>
      <div className="mt-2 grid gap-1 text-zinc-300">
        <span>Coding time: {formatAnalyticsDuration(point.seconds)}</span>
        <span>XP: {formatNumber(point.xp)}</span>
        <span>Main language: {point.language}</span>
        <span>Status: {point.active ? "active day" : "inactive day"}</span>
        <span className="text-orange-200">Chart value: {formatAxisValue(point.value, metric)}</span>
      </div>
    </div>
  );
}

function NameValueTooltip({
  active,
  payload,
}: TooltipContentProps<BreakdownTooltipDatum>) {
  const item = payload?.[0]?.payload;

  if (!active || !item) return null;

  const title = item.language ?? item.project ?? item.weekday ?? item.label ?? "Metric";

  return (
    <div className="rounded-lg border border-orange-300/25 bg-[#08100d]/95 p-3 text-xs shadow-2xl">
      <div className="font-black text-white">{title}</div>
      <div className="mt-2 grid gap-1 text-zinc-300">
        {typeof item.seconds === "number" ? <span>Time: {formatAnalyticsDuration(item.seconds)}</span> : null}
        {typeof item.xp === "number" ? <span>XP: {formatNumber(item.xp)}</span> : null}
        {typeof item.share === "number" ? <span>Share: {formatPercent(item.share)}</span> : null}
        {typeof item.days === "number" ? <span>Days: {item.days}</span> : null}
        {typeof item.activeDays === "number" ? <span>Active days: {item.activeDays}</span> : null}
        {typeof item.averageSeconds === "number" ? <span>Average: {formatAnalyticsDuration(item.averageSeconds)}</span> : null}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, meta }: { icon: LucideIcon; title: string; meta?: string }) {
  return (
    <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
      <CardTitle icon={Icon} label={title} />
      {meta ? <span className="text-xs font-bold text-zinc-500">{meta}</span> : null}
    </div>
  );
}

function YearSummaryPanel({ days }: { days: DailyCodingActivity[] }) {
  const summary = useMemo(() => calculateYearSummary(days), [days]);
  const rows = [
    ["Total time", formatAnalyticsDuration(summary.totalSeconds)],
    ["Active days", `${summary.activeDays} / ${summary.totalDays}`],
    ["Best day", summary.bestDay ? `${summary.bestDay.date.slice(5)} - ${formatAnalyticsDuration(getDaySeconds(summary.bestDay))}` : "No data"],
    ["Avg active day", formatAnalyticsDuration(summary.averageSecondsPerActiveDay)],
    ["Current streak", `${summary.currentStreak} days`],
    ["Best streak", `${summary.bestStreak} days`],
    ["Top language", summary.mainLanguage ?? "No data"],
    ["Best month", summary.bestMonth ? summary.bestMonth.label.replace(/\s\d{4}$/, "") : "No data"],
  ];

  return (
    <aside className="glow-card min-w-0 rounded-lg p-4 sm:p-5">
      <CardTitle icon={Gauge} label="Year Summary" />
      <div className="grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <span className="min-w-0 break-words text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</span>
            <span className="max-w-[58%] break-words text-right text-sm font-black text-zinc-100">{value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function LanguageBreakdown({
  stats,
  selectedLanguage,
  onSelectLanguage,
}: {
  stats: LanguageStat[];
  selectedLanguage: string | null;
  onSelectLanguage: (language: string | null) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? stats : stats.slice(0, 10);

  if (stats.length === 0) {
    return (
      <Card className="xl:col-span-2">
        <SectionHeader icon={PieChartIcon} title="Language Breakdown" />
        <EmptyState>Language data is not available yet.</EmptyState>
      </Card>
    );
  }

  return (
    <Card className="xl:col-span-2">
      <SectionHeader icon={PieChartIcon} title="Language Breakdown" meta={selectedLanguage ? `Selected: ${selectedLanguage}` : undefined} />
      <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<NameValueTooltip />} />
                <Pie data={stats.slice(0, 8)} dataKey="seconds" nameKey="language" innerRadius="58%" outerRadius="84%" paddingAngle={2}>
                  {stats.slice(0, 8).map((item, index) => (
                    <Cell
                      key={item.language}
                      fill={chartColors[index % chartColors.length]}
                      opacity={!selectedLanguage || selectedLanguage === item.language ? 1 : 0.35}
                      onClick={() => onSelectLanguage(selectedLanguage === item.language ? null : item.language)}
                      className="cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.slice(0, 8)} layout="vertical" margin={{ left: 18, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="language" width={82} axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip content={<NameValueTooltip />} />
                <Bar dataKey="seconds" radius={[0, 6, 6, 0]}>
                  {stats.slice(0, 8).map((item, index) => (
                    <Cell key={item.language} fill={chartColors[index % chartColors.length]} opacity={!selectedLanguage || selectedLanguage === item.language ? 1 : 0.35} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              <tr className="border-b border-white/10">
                <th className="py-2 pr-3">Language</th>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">XP</th>
                <th className="py-2 pr-3">Share</th>
                <th className="py-2 pr-3">Active days</th>
                <th className="py-2">Best day</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((item) => (
                <tr
                  key={item.language}
                  className={cn(
                    "cursor-pointer border-b border-white/5 text-zinc-300 transition-colors hover:bg-white/5",
                    selectedLanguage === item.language && "bg-emerald-300/10 text-white",
                  )}
                  onClick={() => onSelectLanguage(selectedLanguage === item.language ? null : item.language)}
                >
                  <td className="py-2 pr-3 font-bold">{item.language}</td>
                  <td className="py-2 pr-3">{formatAnalyticsDuration(item.seconds)}</td>
                  <td className="py-2 pr-3">{formatNumber(item.xp)}</td>
                  <td className="py-2 pr-3">{formatPercent(item.share)}</td>
                  <td className="py-2 pr-3">{item.activeDays}</td>
                  <td className="py-2">{item.bestDay ? `${item.bestDay.date} - ${formatAnalyticsDuration(item.bestDay.languages.find((language) => language.name === item.language)?.seconds ?? 0)}` : "No data"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.length > 10 ? (
            <button type="button" className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-300 hover:border-emerald-300/35" onClick={() => setShowAll((value) => !value)}>
              {showAll ? "Show top 10" : `Show all ${stats.length}`}
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function ProjectsBreakdown({ stats }: { stats: ProjectStat[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? stats : stats.slice(0, 10);

  return (
    <Card>
      <SectionHeader icon={Layers3} title="Projects" />
      {stats.length === 0 ? (
        <EmptyState>Project data is not available yet.</EmptyState>
      ) : (
        <div className="grid gap-4">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.slice(0, 8)} layout="vertical" margin={{ left: 12, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="project" width={96} axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip content={<NameValueTooltip />} />
                <Bar dataKey="seconds" fill="#ffb347" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-3">Project</th>
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">XP</th>
                  <th className="py-2 pr-3">Share</th>
                  <th className="py-2 pr-3">Active days</th>
                  <th className="py-2">Last active</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((item) => (
                  <tr key={item.project} className="border-b border-white/5 text-zinc-300">
                    <td className="py-2 pr-3 font-bold">{item.project}</td>
                    <td className="py-2 pr-3">{formatAnalyticsDuration(item.seconds)}</td>
                    <td className="py-2 pr-3">{formatNumber(item.xp)}</td>
                    <td className="py-2 pr-3">{formatPercent(item.share)}</td>
                    <td className="py-2 pr-3">{item.activeDays}</td>
                    <td className="py-2">{item.lastActive ?? "No data"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stats.length > 10 ? (
            <button type="button" className="w-fit rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-300 hover:border-orange-300/35" onClick={() => setShowAll((value) => !value)}>
              {showAll ? "Show top 10" : `Show all ${stats.length}`}
            </button>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function WeekdayAnalysis({ stats }: { stats: WeekdayStat[] }) {
  const best = stats.toSorted((a, b) => b.seconds - a.seconds)[0];
  const weakest = stats.toSorted((a, b) => a.seconds - b.seconds)[0];

  return (
    <Card>
      <SectionHeader icon={CalendarDays} title="Weekday Analysis" />
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis dataKey="weekday" axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 11 }} tickFormatter={(value: number) => formatAxisValue(value / 3600, "time")} />
            <Tooltip content={<NameValueTooltip />} />
            <Bar dataKey="seconds" fill="#59ff91" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <CompactStat label="Best weekday" value={best ? best.weekday : "No data"} hint={best ? formatAnalyticsDuration(best.seconds) : undefined} />
        <CompactStat label="Weakest weekday" value={weakest ? weakest.weekday : "No data"} hint={weakest ? formatAnalyticsDuration(weakest.seconds) : undefined} />
      </div>
    </Card>
  );
}

function ActivityDistribution({ stats }: { stats: ActivityDistributionItem[] }) {
  return (
    <Card>
      <SectionHeader icon={PieChartIcon} title="Activity Distribution" />
      <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<NameValueTooltip />} />
              <Pie data={stats} dataKey="days" nameKey="label" innerRadius="56%" outerRadius="82%" paddingAngle={2}>
                {stats.map((item) => (
                  <Cell key={item.key} fill={distributionColors[item.key]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid content-center gap-2">
          {stats.map((item) => (
            <CompactStat key={item.key} label={item.label} value={`${item.days} days`} hint={formatPercent(item.share)} />
          ))}
        </div>
      </div>
    </Card>
  );
}

export function AnalyticsPage() {
  const state = useRemoteData<AnalyticsPayload>("/api/analytics");

  if (state.status === "loading") return <LoadingState label="Loading analytics..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  return <AnalyticsContent data={state.data} />;
}

function AnalyticsContent({ data }: { data: AnalyticsPayload }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(30);
  const [metric, setMetric] = useState<AnalyticsMetric>("time");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const allDays = data.last365Days.days;
  const allTimeAvailable = allDays.length > 365;
  const filteredDays = useMemo(() => filterAnalyticsDays(allDays, period), [allDays, period]);
  const chartData = useMemo(() => buildChartData(filteredDays, metric), [filteredDays, metric]);
  const summary = useMemo(() => calculateAnalyticsSummary(filteredDays), [filteredDays]);
  const languageStats = useMemo(() => calculateLanguageBreakdown(filteredDays), [filteredDays]);
  const projectStats = useMemo(() => calculateProjectBreakdown(filteredDays), [filteredDays]);
  const weekdayStats = useMemo(() => calculateWeekdayStats(filteredDays), [filteredDays]);
  const distribution = useMemo(() => calculateActivityDistribution(filteredDays), [filteredDays]);
  const records = useMemo(() => calculateRecords(filteredDays), [filteredDays]);
  const weeklyComparison = useMemo(() => calculateWeeklyComparison(allDays), [allDays]);
  const insights = useMemo(
    () => generateAnalyticsInsights({ days: filteredDays, summary, languageStats, weekdayStats, weeklyComparison }),
    [filteredDays, languageStats, summary, weekdayStats, weeklyComparison],
  );
  const selectedPeriodLabel = periodOptions.find((item) => item.value === period)?.label ?? "Period";
  const metricLabel = metric === "time" ? "Coding time" : "XP";
  const hasActivity = summary.totalSeconds > 0;

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Analytics" title="Signals And Charts" description="Deep coding analytics from WakaTime activity and local CodeFire history." />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <YearlyHeatmap days={allDays} />
        <YearSummaryPanel days={allDays} />
      </section>

      <section className="grid gap-4">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-orange-100">
              <BarChart3 className="h-4 w-4 text-orange-300" />
              Analytics Dashboard
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
              Period-aware charts, breakdowns, records, and week-over-week signals based on real tracked coding activity.
            </p>
          </div>

          <div className="flex max-w-full flex-wrap gap-2">
            <div className="flex max-w-full flex-wrap rounded-lg border border-white/10 bg-black/25 p-1">
              {periodOptions.map((option) => {
                const disabled = option.value === "all" && !allTimeAvailable;

                return (
                  <button
                    key={option.label}
                    type="button"
                    disabled={disabled}
                    onClick={() => setPeriod(option.value)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-black transition-colors",
                      period === option.value ? "bg-emerald-300 text-zinc-950" : "text-zinc-400 hover:bg-white/10 hover:text-white",
                      disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-zinc-400",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex rounded-lg border border-white/10 bg-black/25 p-1">
              {metricOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMetric(option.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-black transition-colors",
                    metric === option.value ? "bg-orange-300 text-zinc-950" : "text-zinc-400 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactStat label="Total time" value={formatAnalyticsDuration(summary.totalSeconds)} hint={selectedPeriodLabel} />
          <CompactStat label="Total XP" value={formatNumber(summary.totalXp)} hint="Coding XP only" />
          <CompactStat label="Active days" value={`${summary.activeDays} / ${summary.totalDays}`} hint={`${summary.consistencyScore}% consistency`} />
          <CompactStat label="Average per day" value={formatAnalyticsDuration(summary.averageSecondsPerDay)} hint="Including zero days" />
          <CompactStat label="Average active day" value={formatAnalyticsDuration(summary.averageSecondsPerActiveDay)} hint="Active days only" />
          <CompactStat label="Best day" value={summary.bestDay ? formatAnalyticsDuration(getDaySeconds(summary.bestDay)) : "No data"} hint={summary.bestDay?.date} />
          <CompactStat label="Main language" value={summary.mainLanguage ?? "No data"} hint="Coding languages prioritized" />
          <CompactStat label="Consistency score" value={`${summary.consistencyScore}%`} hint="Active days / period" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <SectionHeader icon={LineChartIcon} title="Coding Time Trend" meta={`${metricLabel} - ${selectedPeriodLabel}`} />
            {hasActivity ? (
              <div className="h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ left: -18, right: 12, top: 14, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} minTickGap={18} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} tickFormatter={(value: number) => formatAxisValue(value, metric)} />
                    <Tooltip content={<DailyTooltip metric={metric} />} />
                    <Line type="monotone" dataKey="value" stroke="#59ff91" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "#ffb347", stroke: "#f6fff7", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState>No coding activity found for this period.</EmptyState>
            )}
          </Card>

          <Card>
            <SectionHeader icon={Activity} title="Daily Activity" meta={`${metricLabel} bars`} />
            {hasActivity ? (
              <div className="h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -18, right: 8, top: 14, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} tickFormatter={(value: number) => formatAxisValue(value, metric)} />
                    <Tooltip content={<DailyTooltip metric={metric} />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((point) => (
                        <Cell key={point.date} fill={point.active ? (metric === "xp" ? "#ffb347" : "#59ff91") : "#27272a"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState>No daily activity to chart yet.</EmptyState>
            )}
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <LanguageBreakdown stats={languageStats} selectedLanguage={selectedLanguage} onSelectLanguage={setSelectedLanguage} />
          <ProjectsBreakdown stats={projectStats} />
          <WeekdayAnalysis stats={weekdayStats} />
          <ActivityDistribution stats={distribution} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr_1.05fr]">
          <Card>
            <SectionHeader icon={Trophy} title="Records" />
            {records.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {records.slice(0, 9).map((record) => (
                  <Metric key={record.label} label={record.label} value={record.value} hint={record.detail} />
                ))}
              </div>
            ) : (
              <EmptyState>No records yet.</EmptyState>
            )}
          </Card>

          <Card>
            <SectionHeader icon={Flame} title="Weekly Report" />
            {weeklyComparison.hasEnoughData ? (
              <div className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <Metric label="Current week" value={formatAnalyticsDuration(weeklyComparison.currentWeekSeconds)} />
                  <Metric label="Previous week" value={formatAnalyticsDuration(weeklyComparison.previousWeekSeconds)} />
                  <Metric label="Difference" value={`${weeklyComparison.diffSeconds >= 0 ? "+" : "-"}${formatAnalyticsDuration(Math.abs(weeklyComparison.diffSeconds))}`} hint={weeklyComparison.diffPercent === null ? undefined : `${weeklyComparison.diffPercent}%`} />
                  <Metric label="Active days" value={`${weeklyComparison.activeDaysThisWeek}/7`} />
                  <Metric label="Best day this week" value={weeklyComparison.bestDayThisWeek ? formatAnalyticsDuration(getDaySeconds(weeklyComparison.bestDayThisWeek)) : "No data"} hint={weeklyComparison.bestDayThisWeek?.date} />
                  <Metric label="Main language" value={weeklyComparison.mainLanguageThisWeek ?? "No data"} />
                </div>
                <p className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-zinc-300">{weeklyComparison.insight}</p>
              </div>
            ) : (
              <EmptyState>Not enough data for comparison.</EmptyState>
            )}
          </Card>

          <Card>
            <SectionHeader icon={Table2} title="Insights" />
            {insights.length > 0 ? (
              <div className="grid gap-2">
                {insights.map((insight) => (
                  <div key={insight.title} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-orange-200">{insight.title}</div>
                    <p className="mt-1 text-sm leading-6 text-zinc-300">{insight.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No insights yet. More tracked coding days will unlock better signals.</EmptyState>
            )}
          </Card>
        </section>
      </section>
    </div>
  );
}
