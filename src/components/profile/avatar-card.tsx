"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { LearningRpg } from "@/lib/learning-rpg";
import { getAllRanks } from "@/lib/ranks";
import { cn } from "@/lib/utils";

const stageLabels = {
  spark: "Spark",
  apprentice: "Apprentice",
  coder: "Coder",
  engineer: "Engineer",
  architect: "Architect",
  legend: "Legend",
} satisfies Record<LearningRpg["avatar"]["stage"], string>;

function stageClass(stage: LearningRpg["avatar"]["stage"]) {
  if (stage === "legend" || stage === "architect") return "border-yellow-300/30 bg-yellow-300/10";
  if (stage === "engineer" || stage === "coder") return "border-emerald-300/25 bg-emerald-300/10";
  return "border-orange-300/25 bg-orange-300/10";
}

function AvatarFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-1 whitespace-normal break-words text-sm font-black leading-tight text-white">{value}</div>
    </div>
  );
}

export function AvatarCard({ learning }: { learning: LearningRpg }) {
  const equipped = learning.avatar.equippedItemIds
    .map((id) => learning.inventory.items.find((item) => item.id === id))
    .filter((item): item is LearningRpg["inventory"]["items"][number] => Boolean(item));
  const rank = getAllRanks().find((item) => item.id === learning.avatar.rankId);
  const profile = learning.profile;

  return (
    <article className={cn("min-w-0 rounded-lg border p-4 sm:p-5", stageClass(learning.avatar.stage))}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-orange-100">
          <Sparkles className="h-4 w-4 shrink-0 text-orange-300" />
          <span className="min-w-0 whitespace-normal break-words">Avatar</span>
        </div>
        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-zinc-200">
          {stageLabels[learning.avatar.stage]}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4 rounded-lg border border-white/10 bg-black/30 p-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-orange-300/25 bg-orange-300/10">
          {rank?.badgeImage ? (
            <Image src={rank.badgeImage} alt={rank.name} width={80} height={80} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-orange-100">{rank?.medalIcon ?? "CF"}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="whitespace-normal break-words text-xl font-black leading-tight text-white">
            {profile.globalRank}
          </div>
          <div className="mt-1 whitespace-normal break-words text-sm font-bold leading-tight text-emerald-100">
            {profile.title}
          </div>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-orange-100">
            Level {learning.avatar.level}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <AvatarFact label="Ступень" value={stageLabels[learning.avatar.stage]} />
        <AvatarFact label="Ранг" value={profile.globalRank} />
      </div>

      <div className="mt-4">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Экипировка</div>
        {equipped.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {equipped.map((item) => (
              <span
                key={item.id}
                className="max-w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs font-black leading-tight text-zinc-200"
              >
                {item.icon} {item.name}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/25 p-3 text-xs leading-5 text-zinc-400">
            Пока ничего не экипировано. Предметы появятся после квестов, боссов и достижений.
          </div>
        )}
      </div>
    </article>
  );
}
