"use client";

import { Crown } from "lucide-react";
import type { LearningRpg } from "@/lib/learning-rpg";

function percent(progress: number, target: number) {
  return Math.min(100, Math.round((progress / Math.max(1, target)) * 100));
}

export function SeasonCard({ learning }: { learning: LearningRpg }) {
  const season = learning.activeSeason;

  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-orange-100">
        <Crown className="h-4 w-4 text-orange-300" />
        Active Season
      </div>
      {season ? (
        <>
          <div className="text-2xl font-black text-white">{season.title}</div>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{season.description}</p>
          <div className="mt-3 text-xs font-bold text-zinc-500">{learning.seasonDaysLeft} days left</div>
          <div className="mt-4 space-y-3">
            {season.goals.map((goal) => (
              <div key={goal.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-zinc-300">
                  <span>{goal.title}</span>
                  <span>{goal.progress}/{goal.target}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-300" style={{ width: `${percent(goal.progress, goal.target)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
          No active season yet.
        </div>
      )}
    </article>
  );
}
