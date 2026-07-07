"use client";

import { Award, BadgeCheck, Flame, Medal, ShieldCheck, Sparkles, Swords, Trophy, Zap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { HallOfFameCard } from "@/components/hall-of-fame/hall-of-fame-card";
import { LearningTimeline } from "@/components/timeline/learning-timeline";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, ProgressBar, useRemoteData } from "@/components/pages/page-kit";
import { questPercent } from "@/lib/quests";
import type { CodeFireData } from "@/lib/types";
import { cn } from "@/lib/utils";

type RpgPayload = {
  progression: CodeFireData["progression"];
  quests: NonNullable<CodeFireData["rpg"]>["quests"];
  weeklyQuests: NonNullable<CodeFireData["rpg"]>["weeklyQuests"];
  achievements: NonNullable<CodeFireData["rpg"]>["achievements"];
  todayRaid: NonNullable<CodeFireData["rpg"]>["todayRaid"] | null;
  events: NonNullable<CodeFireData["rpg"]>["events"];
  learning: NonNullable<CodeFireData["rpg"]>["learning"] | null;
};

type Quest = RpgPayload["quests"][number];
type Achievement = RpgPayload["achievements"][number];

const categoryLabels: Record<Quest["category"], string> = {
  time: "Coding",
  language: "Language",
  consistency: "Consistency",
  pomodoro: "Pomodoro",
  journal: "Journal",
  studyTasks: "Study",
  stepik: "Stepik",
  topic: "Topic",
  recovery: "Recovery",
  bossPrep: "Boss",
};

const categoryClasses: Record<Quest["category"], string> = {
  time: "border-orange-300/25 bg-orange-300/10 text-orange-100",
  language: "border-sky-300/25 bg-sky-300/10 text-sky-100",
  consistency: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  pomodoro: "border-violet-300/25 bg-violet-300/10 text-violet-100",
  journal: "border-zinc-300/20 bg-zinc-300/10 text-zinc-200",
  studyTasks: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  stepik: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  topic: "border-lime-300/25 bg-lime-300/10 text-lime-100",
  recovery: "border-teal-300/25 bg-teal-300/10 text-teal-100",
  bossPrep: "border-red-300/25 bg-red-300/10 text-red-100",
};

const difficultyClasses: Record<NonNullable<Quest["difficulty"]>, string> = {
  easy: "border-white/10 bg-white/5 text-zinc-300",
  normal: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  hard: "border-orange-300/25 bg-orange-300/10 text-orange-100",
  epic: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100",
};

const rarityWeight: Record<NonNullable<Achievement["rarity"]>, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

const rarityClasses: Record<NonNullable<Achievement["rarity"]>, string> = {
  common: "border-emerald-300/20 bg-emerald-300/10",
  rare: "border-sky-300/25 bg-sky-300/10",
  epic: "border-violet-300/30 bg-violet-300/10",
  legendary: "border-amber-300/35 bg-amber-300/10",
  mythic: "border-fuchsia-300/35 bg-fuchsia-300/10",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value));
}

function achievementPercent(achievement: Achievement | null) {
  if (!achievement?.target) return 0;
  return Math.min(100, Math.max(0, ((achievement.progress ?? 0) / achievement.target) * 100));
}

function questStatus(quest: Quest) {
  if (quest.completed) return "done";
  if (quest.progress > 0) return "active";
  return "open";
}

function TinyProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full border border-emerald-300/10 bg-black/50">
      <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-300" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

function StatChip({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-1 break-words text-sm font-black leading-tight text-white">{value}</div>
      {hint ? <div className="mt-0.5 break-words text-[11px] leading-4 text-zinc-500">{hint}</div> : null}
    </div>
  );
}

function ProgressionSummary({ data }: { data: RpgPayload }) {
  const learning = data.learning;
  const unlocked = learning?.profile.achievementsUnlocked ?? data.achievements.filter((achievement) => achievement.unlocked).length;
  const total = learning?.profile.achievementsTotal ?? data.achievements.length;
  const completedDaily = data.quests.filter((quest) => quest.completed).length;
  const completedWeekly = data.weeklyQuests.filter((quest) => quest.completed).length;
  const nextAchievement =
    data.achievements
      .filter((achievement) => !achievement.unlocked)
      .sort((a, b) => achievementPercent(b) - achievementPercent(a))[0] ?? null;
  const nextReward =
    nextAchievement?.title ??
    data.todayRaid?.title ??
    learning?.seasonPass?.levels.find((level) => !level.unlocked)?.reward.title ??
    "Next reward will appear after new data";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-orange-100">
            <Zap className="h-4 w-4 text-orange-300" />
            Progression Core
          </div>
          <div className="mt-2 break-words text-2xl font-black leading-tight text-white">
            Level {data.progression.level} · {formatNumber(learning?.xp.adventureXp ?? 0)} Adventure XP
          </div>
          <div className="mt-1 break-words text-sm font-bold text-emerald-100">
            {learning?.activeSeason?.title ?? "CodeFire season"} · next: {nextReward}
          </div>
        </div>

        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:w-[430px]">
          <StatChip label="Season XP" value={formatNumber(learning?.xp.seasonXp ?? 0)} />
          <StatChip label="Achievements" value={`${unlocked}/${total}`} />
          <StatChip label="Daily done" value={`${completedDaily}/${data.quests.length}`} />
          <StatChip label="Weekly done" value={`${completedWeekly}/${data.weeklyQuests.length}`} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-emerald-300/15 bg-emerald-300/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Current streak</div>
          <div className="mt-1 text-xl font-black text-white">{learning?.profile.streak ?? 0} days</div>
        </div>
        <div className="rounded-lg border border-orange-300/15 bg-orange-300/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Active raid</div>
          <div className="mt-1 text-xl font-black text-white">{data.todayRaid ? "1" : "0"}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Coding XP</div>
          <div className="mt-1 text-xl font-black text-white">{formatNumber(data.progression.totalXP)}</div>
        </div>
      </div>
    </Card>
  );
}

function AchievementChip({ achievement }: { achievement: Achievement }) {
  return (
    <div className={cn("min-w-0 rounded-lg border p-2.5", rarityClasses[achievement.rarity ?? "common"])}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-black/35 text-[11px] font-black text-white">{achievement.icon}</span>
        <div className="min-w-0">
          <div className="line-clamp-2 text-xs font-black leading-tight text-white">{achievement.title}</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{achievement.rarity ?? "common"}</div>
        </div>
      </div>
    </div>
  );
}

function AchievementsPreview({ achievements, learning }: { achievements: Achievement[]; learning: RpgPayload["learning"] }) {
  const unlockedTotal = learning?.profile.achievementsUnlocked ?? achievements.filter((achievement) => achievement.unlocked).length;
  const total = learning?.profile.achievementsTotal ?? achievements.length;
  const unlocked = achievements
    .filter((achievement) => achievement.unlocked)
    .sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""));
  const next =
    achievements
      .filter((achievement) => !achievement.unlocked)
      .sort((a, b) => achievementPercent(b) - achievementPercent(a))[0] ?? null;
  const rarest =
    [...unlocked].sort((a, b) => {
      const rarityDelta = rarityWeight[b.rarity ?? "common"] - rarityWeight[a.rarity ?? "common"];
      if (rarityDelta !== 0) return rarityDelta;
      return (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? "");
    })[0] ?? null;

  return (
    <Card className="p-4 sm:p-5">
      <CardTitle icon={Award} label="Achievements Preview" />
      <div className="mt-3">
        <ProgressBar percent={total ? (unlockedTotal / total) * 100 : 0} label="Unlocked" meta={`${unlockedTotal} / ${total}`} />
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Recent</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {unlocked.slice(0, 4).map((achievement) => (
              <AchievementChip key={achievement.id} achievement={achievement} />
            ))}
            {unlocked.length === 0 ? <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-500">Recent achievements will appear after unlocks.</div> : null}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-orange-100">
              <Medal className="h-3.5 w-3.5" />
              Rarest
            </div>
            {rarest ? <AchievementChip achievement={rarest} /> : <div className="text-xs text-zinc-500">No rare unlocks yet.</div>}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
              <BadgeCheck className="h-3.5 w-3.5" />
              Next
            </div>
            {next ? (
              <div className="grid gap-2">
                <AchievementChip achievement={next} />
                <TinyProgressBar percent={achievementPercent(next)} />
                <div className="text-[11px] font-bold text-zinc-500">{next.progressLabel ?? `${next.progress ?? 0} / ${next.target ?? 1}`}</div>
              </div>
            ) : (
              <div className="text-xs leading-5 text-zinc-500">Next achievement will appear after new data.</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function QuestCard({ quest }: { quest: Quest }) {
  const percent = questPercent(quest);
  const status = questStatus(quest);

  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border p-2.5 transition-colors",
        status === "done"
          ? "border-emerald-300/35 bg-emerald-300/10"
          : status === "active"
            ? "border-orange-300/25 bg-orange-300/10"
            : "border-white/10 bg-black/20",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words text-sm font-black leading-tight text-white">{quest.title}</div>
          <p className="mt-1 line-clamp-2 text-xs leading-4 text-zinc-400">{quest.description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-orange-300/25 bg-black/25 px-2 py-0.5 text-[10px] font-black text-orange-100">
          {quest.rewardLabel}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", categoryClasses[quest.category])}>
          {categoryLabels[quest.category]}
        </span>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", difficultyClasses[quest.difficulty ?? "normal"])}>
          {quest.difficulty ?? "normal"}
        </span>
        <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-300">
          {status}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold text-zinc-500">
        <span>{quest.progressLabel ?? `${quest.progress} / ${quest.target}`}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="mt-1.5">
        <TinyProgressBar percent={percent} />
      </div>
    </div>
  );
}

function QuestPanel({ title, icon: Icon, quests }: { title: string; icon: typeof Sparkles; quests: Quest[] }) {
  const completed = quests.filter((quest) => quest.completed).length;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle icon={Icon} label={title} />
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
          {completed}/{quests.length} done
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        {quests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </div>
    </Card>
  );
}

function RaidsAndEvents({ data }: { data: RpgPayload }) {
  return (
    <Card className="p-4 sm:p-5">
      <CardTitle icon={ShieldCheck} label="Raids And Events" />
      <div className="mt-3 grid gap-2">
        {data.todayRaid ? (
          <div className="rounded-lg border border-orange-300/25 bg-orange-300/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="break-words text-sm font-black text-white">{data.todayRaid.title}</div>
                <p className="mt-1 line-clamp-2 text-xs leading-4 text-zinc-400">{data.todayRaid.description}</p>
              </div>
              <span className="text-xs font-black text-orange-100">{data.todayRaid.progress}%</span>
            </div>
            <div className="mt-2">
              <TinyProgressBar percent={data.todayRaid.progress} />
            </div>
          </div>
        ) : null}

        {data.events.slice(0, 4).map((event) => (
          <div key={event.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="break-words text-sm font-black text-white">{event.title}</div>
                <p className="mt-1 line-clamp-2 text-xs leading-4 text-zinc-400">{event.description}</p>
              </div>
              <span className="shrink-0 text-[11px] font-black text-emerald-100">{event.rewardLabel}</span>
            </div>
            <div className="mt-2">
              <TinyProgressBar percent={event.progress} />
            </div>
          </div>
        ))}

        {!data.todayRaid && data.events.length === 0 ? <EmptyState>No active raids or events.</EmptyState> : null}
      </div>
    </Card>
  );
}

function BossPreview({ learning }: { learning: RpgPayload["learning"] }) {
  return (
    <Card className="p-4 sm:p-5">
      <CardTitle icon={Swords} label="Boss Fights" />
      {learning?.bossFights.length ? (
        <div className="mt-3 grid gap-2">
          {learning.bossFights.slice(0, 5).map((boss) => (
            <div key={boss.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words text-sm font-black text-white">{boss.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">{boss.difficulty} · {boss.reward.adventureXp} Adventure XP</div>
                </div>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", boss.completed ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-orange-300/25 bg-orange-300/10 text-orange-100")}>
                  {boss.completed ? "defeated" : "active"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>No boss fights yet.</EmptyState>
      )}
    </Card>
  );
}

function QuestStats({ data }: { data: RpgPayload }) {
  const dailyDone = data.quests.filter((quest) => quest.completed).length;
  const weeklyDone = data.weeklyQuests.filter((quest) => quest.completed).length;
  const allQuests = [...data.quests, ...data.weeklyQuests];
  const active = allQuests.filter((quest) => !quest.completed && quest.progress > 0).length;
  const completionRate = allQuests.length ? Math.round(((dailyDone + weeklyDone) / allQuests.length) * 100) : 0;

  return (
    <Card className="p-4 sm:p-5">
      <CardTitle icon={Trophy} label="Quest Stats" />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <StatChip label="Completed today" value={`${dailyDone}`} />
        <StatChip label="Completed weekly" value={`${weeklyDone}`} />
        <StatChip label="Active progress" value={`${active}`} />
        <StatChip label="Completion rate" value={`${completionRate}%`} />
      </div>
    </Card>
  );
}

export function RpgPage() {
  const state = useRemoteData<RpgPayload>("/api/rpg");

  if (state.status === "loading") return <LoadingState label="Loading RPG systems..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const data = state.data;
  const learning = data.learning;

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="RPG" title="Progression Layer" description="Compact progression hub for quests, raids, achievements, bosses, and Adventure XP." />

      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <ProgressionSummary data={data} />
        <AchievementsPreview achievements={data.achievements} learning={learning} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <QuestPanel title="Daily Quests" icon={Sparkles} quests={data.quests} />
        <QuestPanel title="Weekly Quests" icon={Flame} quests={data.weeklyQuests} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <RaidsAndEvents data={data} />
        <div className="grid gap-4">
          <QuestStats data={data} />
          <BossPreview learning={learning} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-4 sm:p-5">
          <CardTitle icon={Trophy} label="Timeline Preview" />
          {learning ? <LearningTimeline events={learning.timeline} limit={7} /> : <EmptyState>No timeline yet.</EmptyState>}
        </Card>
        {learning ? <HallOfFameCard hallOfFame={learning.hallOfFame} /> : null}
      </section>
    </div>
  );
}
