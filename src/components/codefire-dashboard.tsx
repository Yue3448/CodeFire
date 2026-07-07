"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Code2,
  Flame,
  Gauge,
  HeartPulse,
  Info,
  Loader2,
  Map,
  RefreshCw,
  ShieldCheck,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CodeFireApiResponse, CodeFireData, CodeFireOverviewApiResponse, CodeFireOverviewData } from "@/lib/types";
import { formatCompactHours, formatHours, formatNumber } from "@/lib/format";
import { getLanguageIcon, type LanguageIcon } from "@/lib/language-icons";
import { questPercent } from "@/lib/quests";
import { getRankProgress, type Rank } from "@/lib/ranks";
import { raidPercent } from "@/lib/raids";
import { cn } from "@/lib/utils";
import { PomodoroPanel } from "@/components/pomodoro-panel";
import { NotesPanel } from "@/components/notes-panel";
import { BadgePill, DashboardGrid } from "@/components/codefire-ui";
import { YearlyHeatmap } from "@/components/heatmap/yearly-heatmap";
import { LearningRpgPanel } from "@/components/learning-rpg-panel";
import { DayDetailsDrawer } from "@/components/day-details-drawer";
import { dashboardPeriods, getPeriodDays, type DashboardPeriod } from "@/lib/dashboard-period";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: CodeFireOverviewData }
  | { status: "fallback"; message: string }
  | { status: "error"; message: string };

const statusTone = {
  rest: "border-white/10 bg-white/5 text-zinc-300",
  warmup: "border-orange-400/30 bg-orange-400/10 text-orange-100",
  good: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  strong:
    "border-emerald-300/40 bg-gradient-to-br from-emerald-400/15 to-orange-400/10 text-emerald-50",
  fire: "border-orange-300/40 bg-orange-400/15 text-orange-100",
  legendary:
    "border-yellow-300/50 bg-gradient-to-br from-yellow-300/15 to-violet-400/15 text-yellow-50 shadow-[0_0_24px_rgba(250,204,21,0.18)]",
};

type RpgData = NonNullable<CodeFireData["rpg"]>;
type DashboardData = CodeFireData | CodeFireOverviewData;

export function CodeFireDashboard() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/overview", { cache: "no-store" });
        const payload = (await response.json()) as CodeFireOverviewApiResponse;

        if (!isMounted) {
          return;
        }

        if (!payload.configured) {
          setState({ status: "fallback", message: payload.message });
          return;
        }

        if ("error" in payload) {
          setState({ status: "error", message: payload.error });
          return;
        }

        setState({ status: "ready", data: payload });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Не удалось загрузить dashboard.",
        });
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (state.status === "loading") {
    return <LoadingScreen />;
  }

  if (state.status === "fallback") {
    return <SetupState message={state.message} />;
  }

  if (state.status === "error") {
    return <ErrorState message={state.message} />;
  }

  return <Dashboard data={state.data} />;
}

function Dashboard({ data }: { data: CodeFireOverviewData }) {
  const [fullData, setFullData] = useState<CodeFireData | null>(null);
  const [fullStatus, setFullStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const rpg = fullData?.rpg ?? data.rpg;
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  async function refreshOverview() {
    await fetch("/api/overview?refresh=1", { cache: "no-store" });
    window.location.reload();
  }

  async function loadFullDashboard() {
    if (fullStatus === "loading" || fullStatus === "ready") {
      return;
    }

    setFullStatus("loading");
    try {
      const response = await fetch("/api/wakatime", { cache: "no-store" });
      const payload = (await response.json()) as CodeFireApiResponse;

      if (!payload.configured || "error" in payload) {
        setFullStatus("error");
        return;
      }

      setFullData(payload);
      setFullStatus("ready");
    } catch {
      setFullStatus("error");
    }
  }

  const periodDays = useMemo(
    () => getPeriodDays(fullData?.last365Days.days ?? data.last30Days.days, period, data.today.date),
    [data.last30Days.days, data.today.date, fullData?.last365Days.days, period],
  );
  const chartData = useMemo(
    () =>
      periodDays.map((day) => ({
        ...day,
        hours: Number((day.totalSeconds / 3600).toFixed(2)),
      })),
    [periodDays],
  );
  const selectedDetails =
    selectedDate && fullData?.rpg?.learning
      ? fullData.rpg.learning.dayDetails.find((day) => day.date === selectedDate) ?? null
      : null;
  const periodLabel = dashboardPeriods.find((item) => item.id === period)?.label ?? "30 дней";
  const headerRankProgress = data.progression.rank?.currentRank
    ? data.progression.rank
    : data.progression.rankProgress?.currentRank
      ? data.progression.rankProgress
      : getRankProgress(data.progression.totalXP);
  const headerRank = headerRankProgress.currentRank;

  return (
    <>
    <main className="min-h-screen px-5 py-6 text-zinc-50 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <BadgePill tone="orange" className="mb-3 uppercase tracking-[0.2em]">
              <Flame className="h-3.5 w-3.5 text-orange-300" />
              private progression system
            </BadgePill>
            <h1 className="text-4xl font-black tracking-normal text-white sm:text-5xl lg:text-6xl">
              Code<span className="text-orange-300">Fire</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              Личный центр прогресса: WakaTime превращает минуты кодинга в XP,
              уровни и ежедневные квесты.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {dashboardPeriods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPeriod(item.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-black transition-colors",
                    period === item.id
                      ? "border-orange-300/50 bg-orange-300/15 text-orange-100"
                      : "border-white/10 bg-black/20 text-zinc-500 hover:text-zinc-200",
                  )}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void refreshOverview()}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-100 transition-colors hover:border-emerald-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh data
              </button>
            </div>
            <div className="mt-2 text-xs font-bold text-zinc-500">
              Updated: {new Date(data.lastUpdatedAt).toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <MiniBadge
              icon={<CalendarDays className="h-4 w-4" />}
              label="Активных дней"
              value={`${data.last30Days.activeDays}/30`}
            />
            <MiniBadge
              icon={<Trophy className="h-4 w-4" />}
              label="Лучший день"
              value={`${data.last30Days.bestDay.xp} XP`}
            />
            {rpg ? (
              <MiniBadge
                icon={<Flame className="h-4 w-4" />}
                label="Серия"
                value={`${rpg.streak.current} дн.`}
              />
            ) : null}
            <MiniBadge
              icon={<RankBadgeImage rank={headerRank} size="tiny" />}
              label="Ранг"
              value={headerRank.name}
            />
          </div>
        </header>

        <DashboardSection eyebrow="Overview" title="Today">
          <DashboardGrid className={rpg ? "xl:grid-cols-[1.12fr_0.88fr]" : ""}>
            <TodayCard data={data} />
            {rpg ? <FocusCard focus={rpg.focusDay} title={rpg.dailyTitle} /> : null}
          </DashboardGrid>
        </DashboardSection>

        <DashboardSection eyebrow="RPG Core" title="Progression">
          <DashboardGrid className="xl:grid-cols-[1.15fr_0.85fr]">
            <ProgressionCard data={data} />
            {rpg ? <EventsCard raid={rpg.todayRaid} events={rpg.events} /> : null}
          </DashboardGrid>
        </DashboardSection>

        <DashboardSection eyebrow="Focus Center" title="Pomodoro">
          <PomodoroPanel />
        </DashboardSection>

        {rpg ? (
          <DashboardSection eyebrow="Daily RPG" title="Quests And Milestones">
            <DashboardGrid className="xl:grid-cols-[0.72fr_1fr_1fr]">
              <StreakCard data={rpg.streak} />
              <DailyQuestsCard quests={rpg.quests} />
              <WeeklyQuestsCard quests={rpg.weeklyQuests} />
            </DashboardGrid>
            <DashboardGrid className="mt-5 xl:grid-cols-[0.72fr_1.28fr]">
              <GoalsCard goals={rpg.goals} />
              {fullData?.rpg ? (
                <AchievementsCard achievements={fullData.rpg.achievements} />
              ) : (
                <LazySectionLoading label="Загружаю achievements..." status={fullStatus} onLoad={loadFullDashboard} />
              )}
            </DashboardGrid>
          </DashboardSection>
        ) : null}

        {fullData?.rpg?.learning ? (
          <DashboardSection eyebrow="Learning RPG" title="Study Systems">
            <LearningRpgPanel learning={fullData.rpg.learning} todayDate={data.today.date} />
          </DashboardSection>
        ) : (
          <DashboardSection eyebrow="Learning RPG" title="Study Systems">
            <LazySectionLoading label={fullStatus === "error" ? "Learning RPG пока недоступен." : "Загружаю inventory, seasons и timeline..."} status={fullStatus} onLoad={loadFullDashboard} />
          </DashboardSection>
        )}

        {fullData?.rpg ? (
          <DashboardSection eyebrow="Analytics" title="Weekly Snapshot">
            <DashboardGrid>
              <WeeklyReportCard report={fullData.rpg.weeklyReport} comparison={fullData.rpg.weekComparison} />
            </DashboardGrid>
          </DashboardSection>
        ) : null}

        <DashboardSection eyebrow="Analytics" title="Activity">
          <DashboardGrid className="xl:grid-cols-[1.35fr_0.65fr]">
          <ChartCard title={`XP · ${periodLabel}`} icon={<Zap className="h-5 w-5" />}>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -18, right: 12, top: 14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="xpFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#59ff91" stopOpacity={0.42} />
                      <stop offset="65%" stopColor="#ff8a2a" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#ff8a2a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    minTickGap={18}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ stroke: "#59ff91", strokeOpacity: 0.28 }}
                    contentStyle={{
                      background: "#0c1411",
                      border: "1px solid rgba(89,255,145,0.24)",
                      borderRadius: 8,
                      color: "#f6fff7",
                    }}
                    formatter={(value) => [`${value} XP`, "Опыт"]}
                    labelFormatter={(label) => `День ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="#59ff91"
                    strokeWidth={3}
                    fill="url(#xpFill)"
                    activeDot={{ r: 5, fill: "#ff8a2a", stroke: "#fff7ed" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Боевой ритм" icon={<Activity className="h-5 w-5" />}>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -18, right: 8, top: 14, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,138,42,0.08)" }}
                    contentStyle={{
                      background: "#0c1411",
                      border: "1px solid rgba(255,138,42,0.28)",
                      borderRadius: 8,
                      color: "#f6fff7",
                    }}
                    formatter={(value) => [`${value} ч`, "Время"]}
                    labelFormatter={(label) => `День ${label}`}
                  />
                  <Bar dataKey="hours" fill="#ff8a2a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          </DashboardGrid>
        </DashboardSection>

        <DashboardSection eyebrow="Analytics" title="Signals">
          <DashboardGrid className="lg:grid-cols-[1.35fr_0.65fr]">
            {fullData?.last365Days.days ? (
              <YearlyHeatmap days={fullData.last365Days.days} onSelectDay={setSelectedDate} />
            ) : (
              <LazySectionLoading label="Загружаю yearly heatmap..." status={fullStatus} onLoad={loadFullDashboard} />
            )}
            <LanguageCard data={data} />
          </DashboardGrid>
        </DashboardSection>

        {fullData?.rpg ? (
          <DashboardSection eyebrow="Skills" title="Languages And Projects">
            <DashboardGrid className="xl:grid-cols-[1.1fr_0.9fr]">
              <LanguageLevelsCard levels={fullData.rpg.languageLevels} />
              <ProjectZonesCard zones={fullData.rpg.projectZones} />
            </DashboardGrid>
          </DashboardSection>
        ) : null}

        <DashboardSection eyebrow="Journal" title="Notes And Balance">
          <DashboardGrid className={rpg ? "xl:grid-cols-[1.35fr_0.65fr]" : ""}>
            <NotesPanel
              date={data.today.date}
              summary={{
                codingXp: data.today.xp,
                mainLanguage: data.today.mainLanguage,
              }}
            />
            {rpg ? (
              <div className="grid gap-5">
                <BalanceCard balance={rpg.balance} />
                {fullData?.rpg ? (
                  <RecordsCard records={fullData.rpg.records} />
                ) : (
                  <LazySectionLoading label="Загружаю records..." status={fullStatus} onLoad={loadFullDashboard} />
                )}
              </div>
            ) : null}
          </DashboardGrid>
        </DashboardSection>
      </div>
    </main>
    <DayDetailsDrawer details={selectedDetails} onClose={() => setSelectedDate(null)} />
    </>
  );
}

function DashboardSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200/80">
            {eyebrow}
          </div>
          <h2 className="mt-1 text-xl font-black leading-tight text-white sm:text-2xl">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function LazySectionLoading({
  label,
  status,
  onLoad,
}: {
  label: string;
  status?: "idle" | "loading" | "ready" | "error";
  onLoad?: () => void;
}) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <div className="flex items-center gap-3 text-sm font-bold text-zinc-300">
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin text-orange-300" />
        ) : (
          <Info className="h-4 w-4 text-orange-300" />
        )}
        {label}
      </div>
      <div className="mt-4 grid gap-2">
        <div className="h-3 w-2/3 rounded-full bg-white/10" />
        <div className="h-3 w-1/2 rounded-full bg-white/10" />
        <div className="h-3 w-5/6 rounded-full bg-white/10" />
      </div>
      {onLoad ? (
        <button
          type="button"
          onClick={onLoad}
          disabled={status === "loading"}
          className="mt-4 rounded-lg border border-orange-300/30 bg-orange-300/10 px-3 py-2 text-xs font-black text-orange-100 transition-colors hover:border-orange-200 disabled:cursor-wait disabled:opacity-60"
        >
          {status === "loading" ? "Загружаю..." : "Загрузить full data"}
        </button>
      ) : null}
    </article>
  );
}

function TodayCard({ data }: { data: DashboardData }) {
  const mainLanguageIcon = getLanguageIcon(data.today.mainLanguage);

  return (
    <article className="glow-card overflow-hidden rounded-lg p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardEyebrow icon={<Flame className="h-4 w-4" />} label="Сегодня" />
          <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="break-words text-5xl font-black leading-none text-white sm:text-6xl">
              {formatCompactHours(data.today.totalSeconds)}
            </span>
            <span className="pb-2 text-lg font-bold text-orange-200">часов</span>
          </div>
        </div>
        <div
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-left text-xs font-semibold sm:w-auto sm:max-w-56 sm:text-right",
            statusTone[data.today.status.tone],
          )}
        >
          <div>{data.today.status.label}</div>
          <div className="mt-1 text-[11px] font-medium leading-4 opacity-75">
            {data.today.status.description}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[0.85fr_minmax(13rem,1.35fr)_0.85fr]">
        <MetricTile icon={<Zap className="h-4 w-4" />} label="XP сегодня" value={`${data.today.xp}`} />
        <MetricTile
          icon={<Code2 className="h-4 w-4" />}
          label="Главный язык"
          value={data.today.mainLanguage}
          valueNode={<LanguageValue icon={mainLanguageIcon} label={data.today.mainLanguage} />}
          hint="Markdown и конфиги не считаются главным языком кодинга"
        />
        <MetricTile
          icon={<Gauge className="h-4 w-4" />}
          label="Время"
          value={formatHours(data.today.totalSeconds)}
        />
      </div>
    </article>
  );
}

function ProgressionCard({ data }: { data: DashboardData }) {
  const progression = data.progression;
  const fallbackRankProgress = getRankProgress(progression.totalXP);
  const rankProgress = progression.rank?.currentRank
    ? progression.rank
    : progression.rankProgress?.currentRank
      ? progression.rankProgress
      : fallbackRankProgress;
  const currentRank = rankProgress.currentRank;
  const nextRank = rankProgress.nextRank;

  return (
    <article className="glow-card scanline overflow-hidden rounded-lg p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <CardEyebrow icon={<Swords className="h-4 w-4" />} label="Progression" />
        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
          {formatNumber(progression.todayXP)} XP сегодня
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <RankMedal rank={currentRank} />

        <div className="min-w-0">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Уровень и ранг
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span className="text-6xl font-black leading-none text-emerald-200 sm:text-7xl">
              {progression.level}
            </span>
            <span
              className="mb-2 max-w-full rounded-full border px-3 py-1 text-left text-sm font-black leading-tight text-white"
              style={{
                borderColor: currentRank.accentColor,
                boxShadow: `0 0 22px ${currentRank.glowColor}`,
              }}
            >
              {currentRank.name}
            </span>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
            {currentRank.shortDescription}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Общий опыт
          </div>
          <div className="mt-1 text-2xl font-black text-white">
            {formatNumber(progression.totalXP)} XP
          </div>
        </div>
        <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Следующий ранг
          </div>
          <div className="mt-1 break-words text-xl font-black leading-tight text-white sm:text-2xl">
            {nextRank ? nextRank.name : "Максимум"}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <ProgressLine
          label="До следующего уровня"
          value={`${formatNumber(progression.xpIntoLevel)} / ${formatNumber(
            progression.xpForLevel,
          )} XP`}
          meta={`до lvl ${progression.level + 1}`}
          progressPercent={progression.progressPercent}
          gradient="linear-gradient(90deg, #fb923c, #fde047, #6ee7b7)"
          glowColor="rgba(89,255,145,0.45)"
        />

        <ProgressLine
          label="До следующего ранга"
          value={
            nextRank
              ? `${formatNumber(rankProgress.xpIntoRank)} / ${formatNumber(
                  rankProgress.xpForRank,
                )} XP`
              : "Ранг завершен"
          }
          meta={
            nextRank
              ? `${formatNumber(rankProgress.xpToNextRank)} XP осталось`
              : "Вечное пламя активно"
          }
          progressPercent={rankProgress.progressPercent}
          gradient={currentRank.gradient}
          glowColor={currentRank.glowColor}
        />
      </div>

      <RankPath
        previousRank={rankProgress.previousRank}
        currentRank={currentRank}
        nextRank={nextRank}
      />
    </article>
  );
}

function LanguageCard({ data }: { data: DashboardData }) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <CardEyebrow icon={<Code2 className="h-4 w-4" />} label="Языки сегодня" />
        <span className="text-xs font-semibold text-zinc-400">{data.today.date}</span>
      </div>

      {data.today.languages.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
          WakaTime пока не вернул языки за сегодня.
        </div>
      ) : (
        <div className="space-y-3">
          {data.today.languages.map((language) => (
            <div key={language.name}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-white">{language.name}</span>
                <span className="text-zinc-400">
                  {language.percent}% · {formatHours(language.totalSeconds)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-300"
                  style={{ width: `${Math.min(language.percent, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function EventsCard({
  raid,
  events,
}: {
  raid: RpgData["todayRaid"];
  events: RpgData["events"];
}) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <CardEyebrow icon={<ShieldCheck className="h-4 w-4" />} label="Events" />
        <span className={cn("rounded-full border px-3 py-1 text-xs font-black", raid.completed ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100" : "border-orange-300/30 bg-orange-300/10 text-orange-100")}>
          {raid.completed ? "Cleared" : "In progress"}
        </span>
      </div>
      <EventProgressItem item={raid} label="Daily Raid" featured />

      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <EmptyText>Активных ивентов пока нет.</EmptyText>
        ) : (
          events.map((event) => (
            <EventProgressItem
              key={event.id}
              item={event}
              label={eventTypeLabel(event.type)}
            />
          ))
        )}
      </div>
    </article>
  );
}

function EventProgressItem({
  item,
  label,
  featured,
}: {
  item: RpgData["todayRaid"] | RpgData["events"][number];
  label: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        item.completed
          ? "border-emerald-300/35 bg-emerald-300/10"
          : featured
            ? "border-orange-300/25 bg-orange-300/10"
            : "border-white/10 bg-black/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
              {label}
            </span>
            {item.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : null}
          </div>
          <div className="break-words text-lg font-black leading-tight text-white">
            {item.title}
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-400">{item.description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-orange-300/25 bg-orange-300/10 px-2 py-1 text-[11px] font-black text-orange-100">
          {item.rewardLabel}
        </span>
      </div>
      <ProgressBar
        className="mt-3"
        percent={raidPercent(item)}
        label={`${item.progress} / ${item.target} ${unitLabel(item.unit)}`}
      />
      {item.requirements?.length ? (
        <div className="mt-3 grid gap-2">
          {item.requirements.slice(0, 3).map((requirement) => (
            <ProgressBar
              key={requirement.id}
              percent={requirement.percent}
              label={requirement.label}
              meta={requirement.progressLabel}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StreakCard({ data }: { data: RpgData["streak"] }) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <CardEyebrow icon={<Flame className="h-4 w-4" />} label="Серия" />
      <div className="mt-4 flex items-end gap-2">
        <span className="text-5xl font-black leading-none text-orange-200">{data.current}</span>
        <span className="pb-1 text-sm font-bold text-zinc-400">дней</span>
      </div>
      <div className="mt-3 text-sm font-black text-white">{data.title}</div>
      <p className="mt-2 text-xs leading-5 text-zinc-400">{data.status}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniStat label="Лучший" value={`${data.best} дн.`} />
        <MiniStat
          label="До вехи"
          value={data.nextMilestone ? `${data.daysToNextMilestone} дн.` : "макс"}
        />
      </div>
    </article>
  );
}

function DailyQuestsCard({ quests }: { quests: RpgData["quests"] }) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <CardEyebrow icon={<ClipboardList className="h-4 w-4" />} label="Сегодняшние квесты" />
      <div className="mt-4 space-y-3">
        {quests.map((quest) => (
          <div key={quest.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                    {questCategoryLabel(quest.category)}
                  </span>
                  {quest.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : null}
                </div>
                <div className="break-words text-sm font-black text-white">
                  {quest.title}
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{quest.description}</p>
              </div>
              <span className="shrink-0 rounded-full border border-orange-300/25 bg-orange-300/10 px-2 py-1 text-[11px] font-black text-orange-100">
                {quest.rewardLabel}
              </span>
            </div>
            <ProgressBar
              className="mt-3"
              percent={questPercent(quest)}
              label={`${quest.progress} / ${quest.target} ${unitLabel(quest.unit)}`}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

function WeeklyQuestsCard({ quests }: { quests: RpgData["weeklyQuests"] }) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <CardEyebrow icon={<CalendarDays className="h-4 w-4" />} label="Weekly Quests" />
      <div className="mt-4 space-y-3">
        {quests.map((quest) => (
          <div key={quest.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                    {questCategoryLabel(quest.category)}
                  </span>
                  {quest.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : null}
                </div>
                <div className="break-words text-sm font-black text-white">
                  {quest.title}
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{quest.description}</p>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[11px] font-black text-emerald-100">
                {quest.rewardLabel}
              </span>
            </div>
            <ProgressBar
              className="mt-3"
              percent={questPercent(quest)}
              label={`${quest.progress} / ${quest.target} ${unitLabel(quest.unit)}`}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

function GoalsCard({ goals }: { goals: RpgData["goals"] }) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <CardEyebrow icon={<Target className="h-4 w-4" />} label="Цели" />
      <div className="mt-4 space-y-4">
        {[goals.daily, goals.weekly, goals.mainLanguage].map((goal) => (
          <ProgressBar
            key={goal.label}
            percent={goal.percent}
            label={`${goal.label}: ${goal.progress} / ${goal.target} ${goal.unit}`}
            meta={goal.completed ? "готово" : `осталось ${goal.remaining}`}
          />
        ))}
      </div>
    </article>
  );
}

function FocusCard({
  focus,
  title,
}: {
  focus: RpgData["focusDay"];
  title: RpgData["dailyTitle"];
}) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <CardEyebrow icon={<Brain className="h-4 w-4" />} label="Фокус дня" />
          <div className="mt-4 text-4xl font-black text-emerald-200">
            {focus.percent}%
          </div>
          <div className="mt-1 text-sm font-black text-white">
            {focus.title}{focus.language ? ` · ${focus.language}` : ""}
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-400">{focus.description}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
            Титул дня
          </div>
          <div className="mt-2 text-2xl font-black text-white">{title.title}</div>
          <p className="mt-2 text-xs leading-5 text-zinc-400">{title.description}</p>
        </div>
      </div>
    </article>
  );
}

function WeeklyReportCard({
  report,
  comparison,
}: {
  report: RpgData["weeklyReport"];
  comparison: RpgData["weekComparison"];
}) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <CardEyebrow icon={<TrendingUp className="h-4 w-4" />} label="Неделя" />
      <p className="mt-3 text-sm leading-6 text-zinc-300">{report.summary}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MiniStat label="XP" value={`${report.totalXp}`} />
        <MiniStat label="Часы" value={`${report.totalHours}`} />
        <MiniStat label="Дни" value={`${report.activeDays}/7`} />
        <MiniStat label="Язык" value={report.topLanguage ?? "нет"} />
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
        {comparison.summary}
      </div>
    </article>
  );
}

function AchievementsCard({ achievements }: { achievements: RpgData["achievements"] }) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [visibleLimit, setVisibleLimit] = useState(18);
  const categories = ["all", ...Array.from(new Set(achievements.map((achievement) => achievement.category)))];
  const visibleAchievements =
    categoryFilter === "all"
      ? achievements
      : achievements.filter((achievement) => achievement.category === categoryFilter);
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardEyebrow icon={<Award className="h-4 w-4" />} label="Достижения" />
        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
              onClick={() => {
                setCategoryFilter(category);
                setVisibleLimit(18);
              }}
              className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] transition-colors",
              categoryFilter === category
                ? "border-orange-300/50 bg-orange-300/15 text-orange-100"
                : "border-white/10 bg-black/20 text-zinc-500 hover:text-zinc-200",
            )}
          >
            {category === "all" ? "all" : achievementCategoryLabel(category)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {visibleAchievements.slice(0, visibleLimit).map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              "min-w-0 rounded-lg border p-3",
              achievement.unlocked
                ? "border-emerald-300/35 bg-emerald-300/10"
                : "border-white/10 bg-black/20 opacity-70",
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-base">{achievement.icon}</span>
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", achievementRarityClass(achievement.rarity))}>
                {achievementRarityLabel(achievement.rarity)}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                {achievementCategoryLabel(achievement.category)}
              </span>
            </div>
            <div className="break-words text-sm font-black text-white">
              {achievement.title}
            </div>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{achievement.description}</p>
            {!achievement.unlocked && achievement.target ? (
              <ProgressBar
                className="mt-2"
                percent={((achievement.progress ?? 0) / achievement.target) * 100}
                label={`${achievement.progress ?? 0} / ${achievement.target}`}
              />
            ) : (
              <div className="mt-2 text-[11px] font-bold text-emerald-200">
                {achievement.unlockedAt ? `unlocked ${achievement.unlockedAt}` : "unlocked"}
              </div>
            )}
          </div>
        ))}
      </div>
      {visibleAchievements.length > visibleLimit ? (
        <button
          type="button"
          onClick={() => setVisibleLimit((current) => current + 18)}
          className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-zinc-200 transition-colors hover:border-orange-300/35 hover:text-orange-100"
        >
          Показать больше
        </button>
      ) : null}
    </article>
  );
}

function LanguageLevelsCard({ levels }: { levels: RpgData["languageLevels"] }) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <CardEyebrow icon={<Code2 className="h-4 w-4" />} label="Уровни языков" />
      <div className="mt-4 space-y-3">
        {levels.length === 0 ? (
          <EmptyText>Пока нет языковой истории.</EmptyText>
        ) : (
          levels.map((level) => (
            <LanguageLevelRow key={level.name} level={level} />
          ))
        )}
      </div>
    </article>
  );
}

function LanguageLevelRow({ level }: { level: RpgData["languageLevels"][number] }) {
  const icon = getLanguageIcon(level.name);
  const { currentRank, nextRank } = level.rankProgress;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <LanguageLogo icon={icon} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="min-w-0 break-words text-sm font-black text-white">
              {level.name}
            </span>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <span className="rounded-full border border-orange-300/25 bg-orange-300/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-orange-100">
                lvl {level.level}
              </span>
              <span
                className="max-w-full rounded-full border px-2 py-0.5 text-[11px] font-black leading-tight text-white"
                style={{
                  borderColor: currentRank.accentColor,
                  background: `${currentRank.accentColor}1A`,
                  boxShadow: `0 0 10px ${currentRank.glowColor}`,
                }}
                title={currentRank.shortDescription}
              >
                {currentRank.badge} · {currentRank.name}
              </span>
            </div>
          </div>
          <div className="mt-1 break-words text-xs font-semibold text-zinc-500">
            {formatNumber(level.xp)} XP языка
          </div>
        </div>
      </div>

      <ProgressBar
        className="mt-3"
        percent={level.progressPercent}
        label="До следующего уровня"
        meta={`${formatNumber(level.xpIntoLevel)} / ${formatNumber(level.xpForLevel)} XP`}
      />

      <ProgressBar
        className="mt-3"
        percent={level.rankProgress.progressPercent}
        label={nextRank ? `До ранга: ${nextRank.name}` : "Максимальный ранг языка"}
        meta={
          nextRank
            ? `${formatNumber(level.rankProgress.xpToNextRank)} XP`
            : `${formatNumber(level.rankProgress.xpIntoRank)} XP`
        }
      />

      <div className="mt-2 text-[11px] leading-4 text-zinc-500">
        {currentRank.shortDescription}
      </div>
    </div>
  );
}

function ProjectZonesCard({ zones }: { zones: RpgData["projectZones"] }) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <CardEyebrow icon={<Map className="h-4 w-4" />} label="Активные зоны" />
      <div className="mt-4 space-y-3">
        {zones.length === 0 ? (
          <EmptyText>Недостаточно данных о проектах.</EmptyText>
        ) : (
          zones.map((zone) => (
            <ProgressBar
              key={zone.name}
              percent={zone.percent}
              label={`${zone.zoneName} · ${zone.name}`}
              meta={`${zone.xp} XP`}
            />
          ))
        )}
      </div>
    </article>
  );
}

function RecordsCard({ records }: { records: RpgData["records"] }) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <CardEyebrow icon={<Trophy className="h-4 w-4" />} label="Рекорды" />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {records.items.slice(0, 6).map((record) => (
          <MiniStat
            key={record.label}
            label={record.label}
            value={record.value}
            hint={record.date}
          />
        ))}
      </div>
    </article>
  );
}

function BalanceCard({ balance }: { balance: RpgData["balance"] }) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardEyebrow icon={<HeartPulse className="h-4 w-4" />} label="Баланс обучения" />
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em]",
            balance.tone === "fire"
              ? "border-orange-300/40 bg-orange-300/10 text-orange-100"
              : balance.tone === "warning"
                ? "border-yellow-300/35 bg-yellow-300/10 text-yellow-100"
                : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
          )}
        >
          {balance.status}
        </span>
      </div>
      <div
        className={cn(
          "mt-4 rounded-lg border p-4",
          balance.tone === "fire"
            ? "border-orange-300/40 bg-orange-300/10"
            : balance.tone === "warning"
              ? "border-yellow-300/35 bg-yellow-300/10"
              : "border-emerald-300/25 bg-emerald-300/10",
        )}
      >
        <div className="flex items-end gap-3">
          <span className="text-5xl font-black leading-none text-emerald-200">{balance.score}</span>
          <span className="pb-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">/100</span>
        </div>
        <div className="mt-3 text-xl font-black text-white">{balance.title}</div>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{balance.description}</p>
        <div className="mt-4 space-y-2">
          {balance.tips.map((tip) => (
            <div
              key={tip}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-zinc-300"
            >
              {tip}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-emerald-100">
        <span className="text-emerald-300">{icon}</span>
        {title}
      </div>
      {children}
    </article>
  );
}

function MiniBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
        <span className="text-orange-300">{icon}</span>
        <span className="min-w-0 break-words">{label}</span>
      </div>
      <div className="mt-1 break-words text-xl font-black leading-tight text-white">{value}</div>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  valueNode,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueNode?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
        <span className="text-emerald-300">{icon}</span>
        <span className="min-w-0 break-words">{label}</span>
      </div>
      <div className="min-h-8 min-w-0 break-words text-xl font-black leading-tight text-white sm:text-2xl">
        {valueNode ?? value}
      </div>
      {hint ? (
        <div
          className="mt-2 flex items-start gap-1.5 text-[11px] leading-4 text-zinc-500"
          title={hint}
        >
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-orange-300/80" />
          <span className="min-w-0 break-words">{hint}</span>
        </div>
      ) : null}
    </div>
  );
}

function LanguageValue({ icon, label }: { icon: LanguageIcon; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <LanguageLogo icon={icon} />
      <span className="min-w-0 break-words">{label}</span>
    </div>
  );
}

function LanguageLogo({ icon }: { icon: LanguageIcon }) {
  const hasImage = Boolean(icon.imageSrc);

  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border text-sm font-black"
      style={{
        color: icon.foreground,
        background: hasImage ? "rgba(2, 6, 23, 0.66)" : icon.background,
        borderColor: icon.borderColor,
        boxShadow: hasImage ? "0 0 14px rgba(55, 118, 171, 0.28)" : `0 0 18px ${icon.shadowColor}`,
      }}
      title={icon.name}
    >
      {icon.imageSrc ? (
        <Image
          src={icon.imageSrc}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          aria-hidden="true"
        />
      ) : (
        icon.mark
      )}
    </span>
  );
}

function RankBadgeImage({
  rank,
  size = "small",
}: {
  rank: Rank | null;
  size?: "tiny" | "small" | "large";
}) {
  const imageSize = size === "large" ? 128 : size === "small" ? 36 : 24;
  const sizeClass =
    size === "large" ? "h-32 w-32" : size === "small" ? "h-9 w-9" : "h-6 w-6";

  if (rank?.badgeImage) {
    return (
      <span
        className={cn("relative block shrink-0 overflow-hidden", sizeClass)}
        style={{
          filter: `drop-shadow(0 0 ${size === "large" ? "18px" : "9px"} ${rank.glowColor})`,
        }}
      >
        {/* TODO: crop transparent/empty padding in badge assets if a medal still looks too small. */}
        <Image
          src={rank.badgeImage}
          alt=""
          width={imageSize}
          height={imageSize}
          sizes={`${imageSize}px`}
          className={cn(
            "h-full w-full object-contain",
            size === "large" ? "scale-125" : size === "small" ? "scale-110" : "scale-105",
          )}
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
        size === "large" ? "text-4xl" : "text-xs",
      )}
      style={
        rank
          ? {
              borderColor: rank.accentColor,
              boxShadow: `0 0 ${size === "large" ? "18px" : "9px"} ${rank.glowColor}`,
            }
          : undefined
      }
      aria-hidden="true"
    >
      {rank?.medalIcon ?? "XP"}
    </span>
  );
}

function RankMedal({ rank }: { rank: Rank }) {
  return (
    <div
      className="relative grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-lg border bg-black/30 p-0 shadow-xl"
      style={{
        background: `radial-gradient(circle at 50% 30%, ${rank.glowColor}, rgba(0,0,0,0.08) 56%), rgba(10,10,12,0.72)`,
        borderColor: rank.accentColor,
        boxShadow: `0 0 26px ${rank.glowColor}`,
      }}
      title={`Медаль ранга: ${rank.name}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_46%)]" />
      <RankBadgeImage rank={rank} size="large" />
    </div>
  );
}

function ProgressLine({
  label,
  value,
  meta,
  progressPercent,
  gradient,
  glowColor,
}: {
  label: string;
  value: string;
  meta: string;
  progressPercent: number;
  gradient: string;
  glowColor: string;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs font-semibold text-zinc-300">
        <span className="min-w-0 break-words">{label}</span>
        <span className="break-words text-zinc-400">{value}</span>
        <span className="break-words text-orange-100">{meta}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-emerald-300/15 bg-black/40">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progressPercent}%`,
            background: gradient,
            boxShadow: `0 0 18px ${glowColor}`,
          }}
        />
      </div>
    </div>
  );
}

function RankPath({
  previousRank,
  currentRank,
  nextRank,
}: {
  previousRank: Rank | null;
  currentRank: Rank;
  nextRank: Rank | null;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
        Rank Path
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <RankPathItem label="Предыдущий" rank={previousRank} fallback="Старт" />
        <RankPathItem label="Текущий" rank={currentRank} active />
        <RankPathItem label="Следующий" rank={nextRank} fallback="Вершина" muted />
      </div>
    </div>
  );
}

function RankPathItem({
  label,
  rank,
  fallback,
  active,
  muted,
}: {
  label: string;
  rank: Rank | null;
  fallback?: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border px-3 py-2.5",
        active
          ? "border-emerald-300/40 bg-emerald-300/10"
          : "border-white/10 bg-black/20",
        muted ? "opacity-60" : "",
      )}
      style={
        active && rank
          ? {
              boxShadow: `0 0 20px ${rank.glowColor}`,
            }
          : undefined
      }
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-2">
        <RankBadgeImage rank={rank} size="small" />
        <span className="min-w-0 break-words text-xs font-black leading-tight text-white">
          {rank?.name ?? fallback}
        </span>
      </div>
    </div>
  );
}

function ProgressBar({
  percent,
  label,
  meta,
  className,
}: {
  percent: number;
  label: string;
  meta?: string;
  className?: string;
}) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-semibold text-zinc-300">
        <span className="min-w-0 break-words">{label}</span>
        {meta ? <span className="break-words text-right text-orange-100">{meta}</span> : null}
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-emerald-300/20 bg-black/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-300 shadow-[0_0_18px_rgba(89,255,145,0.35)]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="break-words text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 break-words text-lg font-black leading-tight text-white">{value}</div>
      {hint ? <div className="mt-1 break-words text-[11px] text-zinc-500">{hint}</div> : null}
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
      {children}
    </div>
  );
}

function unitLabel(unit: "minutes" | "xp" | "percent" | "count" | "tasks" | "sessions" | "notes") {
  if (unit === "minutes") return "мин";
  if (unit === "percent") return "%";
  if (unit === "tasks") return "задач";
  if (unit === "sessions") return "сессий";
  if (unit === "notes") return "заметок";
  if (unit === "count") return "шт";
  return "XP";
}

function questCategoryLabel(category: RpgData["quests"][number]["category"]) {
  const labels = {
    time: "time",
    language: "language",
    consistency: "streak",
    pomodoro: "pomodoro",
    journal: "journal",
    studyTasks: "study",
    stepik: "stepik",
    topic: "topic",
    recovery: "recovery",
    bossPrep: "boss prep",
  } satisfies Record<RpgData["quests"][number]["category"], string>;

  return labels[category];
}

function eventTypeLabel(type: RpgData["events"][number]["type"]) {
  const labels = {
    weekly: "weekly",
    boss: "boss",
    recovery: "recovery",
    weekend: "weekend",
    language: "language",
    seasonal: "season",
  } satisfies Record<RpgData["events"][number]["type"], string>;

  return labels[type];
}

function achievementCategoryLabel(category: RpgData["achievements"][number]["category"] | string) {
  const labels: Record<string, string> = {
    start: "start",
    daily: "daily",
    streak: "streak",
    language: "language",
    pomodoro: "pomodoro",
    journal: "journal",
    studyTasks: "study",
    stepik: "stepik",
    topic: "topic",
    boss: "boss",
    inventory: "inventory",
    season: "season",
    balance: "balance",
    rank: "rank",
  };

  return labels[category] ?? category;
}

function achievementRarityLabel(rarity: RpgData["achievements"][number]["rarity"]) {
  return rarity ?? "common";
}

function achievementRarityClass(rarity: RpgData["achievements"][number]["rarity"]) {
  if (rarity === "mythic") {
    return "border-fuchsia-300/45 bg-fuchsia-300/10 text-fuchsia-100";
  }

  if (rarity === "legendary") {
    return "border-yellow-300/45 bg-yellow-300/10 text-yellow-100";
  }

  if (rarity === "epic") {
    return "border-fuchsia-300/35 bg-fuchsia-300/10 text-fuchsia-100";
  }

  if (rarity === "rare") {
    return "border-emerald-300/35 bg-emerald-300/10 text-emerald-100";
  }

  return "border-white/10 bg-black/20 text-zinc-400";
}

function CardEyebrow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-100">
      <span className="text-orange-300">{icon}</span>
      {label}
    </div>
  );
}

function LoadingScreen() {
  return (
    <StateShell>
      <Loader2 className="h-10 w-10 animate-spin text-emerald-300" />
      <h1 className="text-4xl font-black text-white">CodeFire</h1>
      <p className="max-w-md text-center text-sm leading-6 text-zinc-300">
        Загружаю WakaTime и разжигаю XP-панель.
      </p>
    </StateShell>
  );
}

function SetupState({ message }: { message: string }) {
  return (
    <StateShell>
      <Flame className="h-11 w-11 text-orange-300" />
      <h1 className="text-4xl font-black text-white">CodeFire</h1>
      <p className="max-w-lg text-center text-sm leading-6 text-zinc-300">{message}</p>
      <code className="rounded-md border border-emerald-300/20 bg-black/30 px-3 py-2 text-sm text-emerald-100">
        WAKATIME_API_KEY=waka_your_api_key_here
      </code>
    </StateShell>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <StateShell>
      <AlertTriangle className="h-11 w-11 text-orange-300" />
      <h1 className="text-4xl font-black text-white">WakaTime не ответил</h1>
      <p className="max-w-xl text-center text-sm leading-6 text-zinc-300">{message}</p>
    </StateShell>
  );
}

function StateShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="glow-card flex max-w-xl flex-col items-center gap-4 rounded-lg p-8">
        {children}
      </section>
    </main>
  );
}
