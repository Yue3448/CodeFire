"use client";

import { User } from "lucide-react";
import type { LearningRpg } from "@/lib/learning-rpg";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-20 min-w-0 flex-col justify-between rounded-lg border border-white/10 bg-black/25 p-3.5">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-2 whitespace-normal break-words text-sm font-black leading-tight text-white">{value}</div>
    </div>
  );
}

export function DeveloperProfileCard({ learning }: { learning: LearningRpg }) {
  const profile = learning.profile;

  return (
    <article className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-orange-100">
          <User className="h-4 w-4 shrink-0 text-orange-300" />
          <span className="min-w-0 whitespace-normal break-words">Developer Profile</span>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
          Level {profile.level}
        </span>
      </div>
      <div className="min-w-0">
        <div className="whitespace-normal break-words text-3xl font-black leading-tight text-white">{profile.name}</div>
        <div className="mt-1 whitespace-normal break-words text-sm font-bold leading-tight text-emerald-100">{profile.title}</div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Ранг" value={profile.globalRank} />
        <Stat label="Уровень" value={`${profile.level}`} />
        <Stat label="Coding XP" value={`${profile.codingXp}`} />
        <Stat label="Adventure XP" value={`${profile.adventureXp}`} />
        <Stat label="Сезон XP" value={`${profile.seasonXp ?? 0}`} />
        <Stat label="Главный язык" value={profile.mainLanguage ?? "нет"} />
        <Stat label="Сильный язык" value={profile.strongestLanguage ?? "нет"} />
        <Stat label="Сильная тема" value={profile.strongestTopic ?? "нет"} />
        <Stat label="Серия" value={`${profile.streak} дн.`} />
        <Stat label="Лучший день" value={profile.bestDay ?? "нет"} />
        <Stat label="Ачивки" value={`${profile.achievementsUnlocked}/${profile.achievementsTotal}`} />
        <Stat label="Предметы" value={`${profile.itemsUnlocked}/${profile.itemsTotal}`} />
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs font-bold leading-5 text-zinc-400">
        Экипировано: {profile.equippedItems.length > 0 ? profile.equippedItems.join(", ") : "пока ничего"}
      </div>
    </article>
  );
}
