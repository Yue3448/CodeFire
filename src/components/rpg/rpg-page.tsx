"use client";

import { Award, Flame, ShieldCheck, Sparkles, Swords, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { HallOfFameCard } from "@/components/hall-of-fame/hall-of-fame-card";
import { LearningTimeline } from "@/components/timeline/learning-timeline";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, ProgressBar, useRemoteData } from "@/components/pages/page-kit";
import type { CodeFireData } from "@/lib/types";

type RpgPayload = {
  progression: CodeFireData["progression"];
  quests: NonNullable<CodeFireData["rpg"]>["quests"];
  weeklyQuests: NonNullable<CodeFireData["rpg"]>["weeklyQuests"];
  achievements: NonNullable<CodeFireData["rpg"]>["achievements"];
  todayRaid: NonNullable<CodeFireData["rpg"]>["todayRaid"] | null;
  events: NonNullable<CodeFireData["rpg"]>["events"];
  learning: NonNullable<CodeFireData["rpg"]>["learning"] | null;
};

function QuestList({ quests }: { quests: RpgPayload["quests"] }) {
  return (
    <div className="grid gap-3">
      {quests.map((quest) => (
        <div key={quest.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="break-words text-sm font-black text-white">{quest.title}</div>
              <p className="mt-1 text-xs leading-5 text-zinc-400">{quest.description}</p>
            </div>
            <span className="shrink-0 rounded-full border border-orange-300/25 bg-orange-300/10 px-2 py-1 text-[11px] font-black text-orange-100">
              {quest.rewardLabel}
            </span>
          </div>
          <ProgressBar percent={(quest.progress / quest.target) * 100} label={`${quest.progress} / ${quest.target}`} />
        </div>
      ))}
    </div>
  );
}

export function RpgPage() {
  const state = useRemoteData<RpgPayload>("/api/rpg");

  if (state.status === "loading") return <LoadingState label="Loading RPG systems..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const data = state.data;
  const learning = data.learning;
  const unlockedAchievements = data.achievements.filter((achievement) => achievement.unlocked).length;
  const closestAchievements = data.achievements
    .filter((achievement) => !achievement.unlocked)
    .sort((a, b) => ((b.progress ?? 0) / (b.target ?? 1)) - ((a.progress ?? 0) / (a.target ?? 1)))
    .slice(0, 12);

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="RPG" title="Progression Layer" description="Quests, raids, achievements, bosses, Adventure XP, and Hall of Fame." />

      <section className="grid gap-4 xl:grid-cols-4">
        <Metric label="Adventure XP" value={`${learning?.xp.adventureXp ?? 0}`} hint="separate from Coding XP" />
        <Metric label="Season XP" value={`${learning?.xp.seasonXp ?? 0}`} />
        <Metric label="Achievements" value={`${unlockedAchievements}/${data.achievements.length}`} />
        <Metric label="Level" value={`${data.progression.level}`} hint={`${data.progression.totalXP} Coding XP`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle icon={Sparkles} label="Daily Quests" />
          <QuestList quests={data.quests} />
        </Card>
        <Card>
          <CardTitle icon={Flame} label="Weekly Quests" />
          <QuestList quests={data.weeklyQuests} />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardTitle icon={ShieldCheck} label="Raids And Events" />
          <div className="grid gap-3">
            {data.todayRaid ? (
              <div className="rounded-lg border border-orange-300/25 bg-orange-300/10 p-3">
                <div className="text-base font-black text-white">{data.todayRaid.title}</div>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{data.todayRaid.description}</p>
                <div className="mt-3">
                  <ProgressBar percent={data.todayRaid.progress} label="Daily raid" meta={`${data.todayRaid.progress}%`} />
                </div>
              </div>
            ) : null}
            {data.events.map((event) => (
              <div key={event.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-black text-white">{event.title}</div>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{event.description}</p>
                <div className="mt-3">
                  <ProgressBar percent={event.progress} label={event.type} meta={event.rewardLabel} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle icon={Award} label="Achievements Near Unlock" />
          <div className="grid gap-2 sm:grid-cols-2">
            {closestAchievements.map((achievement) => (
              <div key={achievement.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words text-sm font-black text-white">{achievement.icon} {achievement.title}</div>
                    <div className="mt-1 text-xs text-zinc-500">{achievement.category} · {achievement.rarity}</div>
                  </div>
                </div>
                {achievement.target ? (
                  <div className="mt-2">
                    <ProgressBar percent={((achievement.progress ?? 0) / achievement.target) * 100} label={`${achievement.progress ?? 0} / ${achievement.target}`} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle icon={Swords} label="Boss Fights" />
          {learning?.bossFights.length ? (
            <div className="grid gap-3">
              {learning.bossFights.slice(0, 6).map((boss) => (
                <div key={boss.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words text-sm font-black text-white">{boss.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">{boss.difficulty} · {boss.reward.adventureXp} Adventure XP</div>
                    </div>
                    <span className="text-xs font-black text-emerald-100">{boss.completed ? "defeated" : "active"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No boss fights yet.</EmptyState>
          )}
        </Card>

        <Card>
          <CardTitle icon={Trophy} label="Timeline Preview" />
          {learning ? <LearningTimeline events={learning.timeline} limit={8} /> : <EmptyState>No timeline yet.</EmptyState>}
        </Card>
      </section>

      {learning ? <HallOfFameCard hallOfFame={learning.hallOfFame} /> : null}
    </div>
  );
}
