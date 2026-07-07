"use client";

import { Backpack, BarChart3, BookOpen, Flame, NotebookPen, ShieldCheck, Sparkles, Timer, Trophy, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, NavCard, ProgressBar, useRemoteData } from "@/components/pages/page-kit";
import { YearlyHeatmap } from "@/components/heatmap/yearly-heatmap";
import type { CodeFireOverviewData } from "@/lib/types";
import { getRankProgress } from "@/lib/ranks";

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

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="Overview"
        title="CodeFire"
        description="Today, rank, current quests, focus, and quick routes into the deeper systems."
      />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardTitle icon={Flame} label="Today" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Today XP" value={`${data.today.xp}`} hint="WakaTime only" />
            <Metric label="Main language" value={data.today.mainLanguage} />
            <Metric label="Streak" value={`${rpg.streak.current} days`} />
            <Metric label="Rank" value={rank.currentRank.name} />
          </div>
          <div className="mt-4">
            <ProgressBar
              percent={data.progression.progressPercent}
              label={`Level ${data.progression.level}`}
              meta={`${data.progression.xpIntoLevel} / ${data.progression.xpForLevel} XP`}
            />
          </div>
        </Card>

        <Card>
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

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardTitle icon={Sparkles} label="Daily Quests" />
          <div className="grid gap-3">
            {rpg.quests.slice(0, 4).map((quest) => (
              <div key={quest.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words text-sm font-black text-white">{quest.title}</div>
                    <div className="mt-1 text-xs text-zinc-500">{quest.rewardLabel}</div>
                  </div>
                  <span className="shrink-0 text-xs font-black text-emerald-100">{quest.completed ? "done" : "open"}</span>
                </div>
                <ProgressBar percent={(quest.progress / quest.target) * 100} label={`${quest.progress} / ${quest.target}`} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle icon={Trophy} label="Heatmap Preview" />
          <YearlyHeatmap days={data.heatmapPreview ?? data.last30Days.days.slice(-14)} />
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <NavCard href="/profile" icon={User} title="Profile" description="Character, avatar, equipped items, and records." />
        <NavCard href="/analytics" icon={BarChart3} title="Analytics" description="Charts, heatmap, language and project signals." />
        <NavCard href="/rpg" icon={Flame} title="RPG" description="Quests, achievements, raids, bosses, and Hall of Fame." />
        <NavCard href="/inventory" icon={Backpack} title="Inventory" description="Items, rarity filters, unlock progress, and effects." />
        <NavCard href="/study" icon={BookOpen} title="Study" description="Tasks, Stepik, topics, goals, and difficulty tracking." />
        <NavCard href="/focus" icon={Timer} title="Focus" description="Pomodoro timer, settings, stats, and focus history." />
        <NavCard href="/journal" icon={NotebookPen} title="Journal" description="Daily notes, before/after reflections, and history." />
      </section>
    </div>
  );
}
