"use client";

import { ShieldCheck } from "lucide-react";
import type { LearningRpg } from "@/lib/learning-rpg";
import { cn } from "@/lib/utils";

export function SeasonPass({ learning }: { learning: LearningRpg }) {
  const pass = learning.seasonPass;

  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-emerald-100">
        <ShieldCheck className="h-4 w-4 text-emerald-300" />
        Season Pass
      </div>
      {pass ? (
        <>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black leading-none text-emerald-200">{pass.level}</span>
            <span className="pb-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">season level</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-orange-300" style={{ width: `${pass.progressPercent}%` }} />
          </div>
          <div className="mt-2 text-xs font-bold text-zinc-500">{pass.seasonXp}/{pass.nextLevelXp} Season XP</div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {pass.levels.map((level) => (
              <div
                key={level.level}
                className={cn(
                  "min-w-32 rounded-lg border p-3",
                  level.unlocked ? "border-emerald-300/30 bg-emerald-300/10" : "border-white/10 bg-black/20 opacity-70",
                )}
              >
                <div className="text-xs font-black text-zinc-500">Lv {level.level}</div>
                <div className="mt-1 text-sm font-black text-white">{level.reward.title}</div>
                <div className="mt-1 text-[11px] font-bold text-zinc-500">{level.reward.type}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
          Season Pass appears when a season is active.
        </div>
      )}
    </article>
  );
}
