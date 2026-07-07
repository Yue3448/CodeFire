"use client";

import { CalendarDays, Crown, Palette, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, ProgressBar, useRemoteData } from "@/components/pages/page-kit";
import type { LearningRpg } from "@/lib/learning-rpg";

type SeasonsPayload = {
  seasons: LearningRpg["seasons"];
  activeSeason: LearningRpg["activeSeason"];
  seasonDaysLeft: number;
  seasonPass: LearningRpg["seasonPass"];
  themes: LearningRpg["themes"] | null;
  xp: LearningRpg["xp"] | null;
};

export function SeasonsPage() {
  const state = useRemoteData<SeasonsPayload>("/api/seasons/overview");

  if (state.status === "loading") return <LoadingState label="Loading seasons..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const data = state.data;
  const season = data.activeSeason;
  const pass = data.seasonPass;

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Seasons" title="Season Track" description="Active season, goals, season pass, rewards, themes, and season history." />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Season XP" value={`${data.xp?.seasonXp ?? 0}`} />
        <Metric label="Season level" value={`${pass?.level ?? 0}`} />
        <Metric label="Days left" value={`${data.seasonDaysLeft}`} />
        <Metric label="Seasons" value={`${data.seasons.length}`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle icon={Crown} label="Active Season" />
          {season ? (
            <div>
              <div className="text-2xl font-black text-white">{season.title}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{season.description}</p>
              <div className="mt-4 grid gap-3">
                {season.goals.map((goal) => (
                  <ProgressBar key={goal.id} percent={(goal.progress / Math.max(1, goal.target)) * 100} label={goal.title} meta={`${goal.progress} / ${goal.target}`} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>No active season yet.</EmptyState>
          )}
        </Card>

        <Card>
          <CardTitle icon={ShieldCheck} label="Season Pass" />
          {pass ? (
            <div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black leading-none text-emerald-200">{pass.level}</span>
                <span className="pb-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">level</span>
              </div>
              <div className="mt-4">
                <ProgressBar percent={pass.progressPercent} label="Next level" meta={`${pass.seasonXp} / ${pass.nextLevelXp} XP`} />
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {pass.levels.map((level) => (
                  <div key={level.level} className="min-w-36 rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="text-xs font-black text-zinc-500">Lv {level.level}</div>
                    <div className="mt-1 text-sm font-black text-white">{level.reward.title}</div>
                    <div className="mt-1 text-[11px] text-zinc-500">{level.unlocked ? "unlocked" : "locked"}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>Season pass appears when a season is active.</EmptyState>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle icon={Palette} label="Themes" />
          {data.themes ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.themes.themes.map((theme) => (
                <div key={theme.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-sm font-black text-white">{theme.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">{theme.unlocked ? "unlocked" : "locked"}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No themes yet.</EmptyState>
          )}
        </Card>

        <Card>
          <CardTitle icon={CalendarDays} label="Season History" />
          <div className="grid gap-2">
            {data.seasons.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-black text-white">{item.title}</div>
                <div className="mt-1 text-xs text-zinc-500">{item.startDate} · {item.endDate}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
