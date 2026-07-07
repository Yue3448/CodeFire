"use client";

import { Trophy } from "lucide-react";
import type { HallOfFame } from "@/lib/hall-of-fame";
import { cn } from "@/lib/utils";

function rarityClass(rarity?: string) {
  if (rarity === "mythic") return "border-fuchsia-300/50 bg-fuchsia-300/10 shadow-[0_0_22px_rgba(217,70,239,0.18)]";
  if (rarity === "legendary") return "border-yellow-300/50 bg-yellow-300/10 shadow-[0_0_22px_rgba(250,204,21,0.16)]";
  if (rarity === "epic") return "border-purple-300/40 bg-purple-300/10";
  if (rarity === "rare") return "border-sky-300/35 bg-sky-300/10";
  return "border-white/10 bg-black/20";
}

export function HallOfFameCard({ hallOfFame, limit = 8 }: { hallOfFame: HallOfFame; limit?: number }) {
  const podium = hallOfFame.podium.length > 0 ? hallOfFame.podium : hallOfFame.items.slice(0, 3);
  const podiumIds = new Set(podium.map((entry) => entry.id));
  const items = hallOfFame.items.filter((entry) => !podiumIds.has(entry.id)).slice(0, limit);

  return (
    <article className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-orange-100">
          <Trophy className="h-4 w-4 shrink-0 text-orange-300" />
          <span className="min-w-0 whitespace-normal break-words">Hall of Fame</span>
        </div>
        <span className="shrink-0 text-xs font-bold text-zinc-500">{hallOfFame.items.length} записей</span>
      </div>

      {hallOfFame.items.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-400">
          Здесь появятся реальные рекорды: активность WakaTime, побеждённые боссы, предметы и достижения.
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {podium.map((entry, index) => (
              <div key={entry.id} className={cn("flex min-h-36 min-w-0 flex-col rounded-lg border p-4", rarityClass(entry.rarity))}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Top {index + 1}</div>
                  <span className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-black text-zinc-300">
                    {entry.icon ?? entry.type}
                  </span>
                </div>
                <div className="mt-3 whitespace-normal break-words text-sm font-black leading-tight text-white">{entry.title}</div>
                <div className="mt-2 whitespace-normal break-words text-lg font-black leading-tight text-orange-100">{entry.value}</div>
                {entry.description || entry.date ? (
                  <div className="mt-auto pt-3 text-xs leading-5 text-zinc-400">
                    {[entry.description, entry.date].filter(Boolean).join(" · ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {items.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((entry) => (
                <div key={entry.id} className={cn("min-w-0 rounded-lg border p-4", rarityClass(entry.rarity))}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="whitespace-normal break-words text-sm font-black leading-tight text-white">{entry.title}</div>
                      <div className="mt-2 whitespace-normal break-words text-base font-black leading-tight text-orange-100">{entry.value}</div>
                    </div>
                    <span className="shrink-0 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black text-zinc-400">
                      {entry.icon ?? entry.type}
                    </span>
                  </div>
                  {entry.description || entry.date ? (
                    <div className="mt-2 text-xs leading-5 text-zinc-400">
                      {[entry.description, entry.date].filter(Boolean).join(" · ")}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}
