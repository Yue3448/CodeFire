"use client";

import Image from "next/image";
import Link from "next/link";
import { Award, Backpack, Boxes, Flame, Medal, Shield, Sparkles, Trophy, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, ProgressBar, useRemoteData } from "@/components/pages/page-kit";
import type { Achievement } from "@/lib/achievements";
import { formatNumber } from "@/lib/format";
import type { InventoryItem } from "@/lib/inventory";
import {
  calculateProfileSummary,
  getEquippedItemsSummary,
  getProfileAchievementsSummary,
  type ProfileAchievementsSummary,
  type ProfileEquipmentSlotSummary,
  type ProfileSummary,
} from "@/lib/profile-summary";
import { getRankProgress, type Rank, type RankProgression } from "@/lib/ranks";
import type { StreakStats } from "@/lib/streaks";
import type { CodeFireData } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProfilePayload = {
  learning: NonNullable<NonNullable<CodeFireData["rpg"]>["learning"]> | null;
  progression: CodeFireData["progression"];
  today: CodeFireData["today"];
  streak: StreakStats | null;
  achievements: Achievement[];
  records: NonNullable<CodeFireData["rpg"]>["records"] | null;
  languageLevels: NonNullable<CodeFireData["rpg"]>["languageLevels"];
  last365Days: CodeFireData["last365Days"];
};

type StatItem = {
  label: string;
  value: string;
  hint?: string;
};

const stageLabels = {
  spark: "Spark",
  apprentice: "Apprentice",
  coder: "Coder",
  engineer: "Engineer",
  architect: "Architect",
  legend: "Legend",
} satisfies Record<NonNullable<ProfilePayload["learning"]>["avatar"]["stage"], string>;

const rarityClasses: Record<InventoryItem["rarity"] | NonNullable<Achievement["rarity"]>, string> = {
  common: "border-emerald-300/20 bg-emerald-300/10 shadow-emerald-950/20",
  rare: "border-sky-300/25 bg-sky-300/10 shadow-sky-950/30",
  epic: "border-violet-300/30 bg-violet-300/10 shadow-violet-950/35",
  legendary: "border-amber-300/35 bg-amber-300/10 shadow-amber-950/40",
  mythic: "border-fuchsia-300/35 bg-fuchsia-300/10 shadow-fuchsia-950/40",
};

function formatMinutes(minutes?: number) {
  const safeMinutes = Math.max(0, Math.round(minutes ?? 0));
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;

  if (hours === 0) return `${safeMinutes} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

function formatItemEffect(item: InventoryItem) {
  const effect = item.effect;

  if (!effect || effect.kind === "cosmeticOnly") return "Cosmetic item";
  if (effect.kind === "questAdventureXpBoost") return `+${effect.value ?? 0}% quest Adventure XP`;
  if (effect.kind === "languageQuestBoost") return `+${effect.value ?? 0}% ${effect.language ?? "language"} quests`;
  if (effect.kind === "pomodoroQuestBoost") return `+${effect.value ?? 0}% Pomodoro Adventure XP`;
  if (effect.kind === "recoveryBoost") return `+${effect.value ?? 0}% recovery rewards`;
  if (effect.kind === "studyTaskBoost") return `+${effect.value ?? 0}% study task rewards`;
  return "Character bonus";
}

function RankBadge({ rank, size = "md" }: { rank: Rank | null; size?: "sm" | "md" | "lg" }) {
  const imageSize = size === "lg" ? 104 : size === "md" ? 54 : 32;
  const sizeClass = size === "lg" ? "h-24 w-24 sm:h-28 sm:w-28" : size === "md" ? "h-14 w-14" : "h-8 w-8";

  if (rank?.badgeImage) {
    return (
      <span className={cn("relative block shrink-0 overflow-hidden rounded-md", sizeClass)} style={{ filter: `drop-shadow(0 0 ${size === "lg" ? "18px" : "9px"} ${rank.glowColor})` }} title={rank.name}>
        <Image
          src={rank.badgeImage}
          alt=""
          width={imageSize}
          height={imageSize}
          sizes={`${imageSize}px`}
          className={cn("h-full w-full object-contain", size === "lg" ? "scale-125" : "scale-110")}
          draggable={false}
          aria-hidden="true"
          priority={size === "lg"}
        />
      </span>
    );
  }

  return (
    <span className={cn("grid shrink-0 place-items-center rounded-md border border-white/10 bg-black/30 font-black text-orange-100", sizeClass, size === "lg" ? "text-2xl" : "text-xs")} aria-hidden="true">
      {rank?.medalIcon ?? "XP"}
    </span>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-1 break-words text-sm font-black leading-tight text-white">{value}</div>
    </div>
  );
}

function ProfileHero({
  summary,
  progression,
  rank,
}: {
  summary: ProfileSummary;
  progression: CodeFireData["progression"];
  rank: RankProgression;
}) {
  const nextLevelLeft = Math.max(0, progression.nextLevelXP - progression.totalXP);

  return (
    <Card className="overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <RankBadge rank={rank.currentRank} size="lg" />
          <div className="min-w-0">
            <div className="break-words text-2xl font-black leading-tight text-white sm:text-3xl">{summary.name}</div>
            <div className="mt-1 break-words text-sm font-bold leading-tight text-emerald-100">{summary.title}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-300/25 bg-orange-300/10 px-3 py-1 text-xs font-black text-orange-100">
                {rank.currentRank.name}
              </span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
                Level {summary.level}
              </span>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-2 sm:grid-cols-3 lg:w-[420px]">
          <MiniFact label="Coding XP" value={formatNumber(summary.codingXp)} />
          <MiniFact label="Main language" value={summary.mainLanguage ?? "No data"} />
          <MiniFact label="Streak" value={`${summary.currentStreak} days`} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <ProgressBar percent={progression.progressPercent} label="Next level" meta={`${formatNumber(progression.xpIntoLevel)} / ${formatNumber(progression.xpForLevel)} XP`} />
          <div className="text-[11px] font-bold text-zinc-500">{formatNumber(nextLevelLeft)} XP left</div>
          <ProgressBar percent={rank.progressPercent} label={rank.nextRank ? `Next rank: ${rank.nextRank.name}` : "Max rank reached"} meta={rank.isMaxRank ? "Max rank" : `${formatNumber(rank.xpToNextRank)} XP left`} />
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-emerald-300/15 bg-emerald-300/10 p-3">
          <RankBadge rank={rank.nextRank} size="md" />
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Next rank</div>
            <div className="mt-1 break-words text-sm font-black leading-tight text-white">
              {rank.nextRank?.name ?? "Maximum rank reached"}
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-100">
              {rank.nextRank ? `${formatNumber(rank.xpIntoRank)} / ${formatNumber(rank.xpForRank)} XP` : "Peak reached"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AvatarDossier({
  learning,
  equipped,
  currentRank,
}: {
  learning: NonNullable<ProfilePayload["learning"]>;
  equipped: ProfileEquipmentSlotSummary[];
  currentRank: Rank;
}) {
  const rank = learning.profile.globalRank;
  const preview = equipped.filter((slot) => slot.item).slice(0, 2);
  const emptySlots = Math.max(0, 3 - preview.length);

  return (
    <Card className="p-4 sm:p-5">
      <CardTitle icon={Sparkles} label="Avatar" />
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 p-3">
        <RankBadge rank={currentRank} size="md" />
        <div className="min-w-0">
          <div className="break-words text-lg font-black leading-tight text-white">{rank}</div>
          <div className="mt-1 break-words text-sm font-bold leading-tight text-emerald-100">{learning.profile.title}</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-black uppercase tracking-[0.12em]">
            <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-zinc-300">
              {stageLabels[learning.avatar.stage]}
            </span>
            <span className="rounded-full border border-orange-300/25 bg-orange-300/10 px-2 py-0.5 text-orange-100">
              Level {learning.avatar.level}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Equipped preview</div>
        <div className="grid gap-2">
          {preview.map(({ slot, item }) =>
            item ? (
              <div key={slot} className={cn("rounded-lg border p-2.5 shadow-lg", rarityClasses[item.rarity])}>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-black/35 text-xs font-black text-white">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="break-words text-sm font-black leading-tight text-white">{item.name}</div>
                    <div className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">{slot}</div>
                  </div>
                </div>
              </div>
            ) : null,
          )}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <div key={index} className="rounded-lg border border-dashed border-white/10 bg-black/20 p-2.5 text-xs font-bold text-zinc-500">
              Empty slot
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function StatGroup({ title, items }: { title: string; items: StatItem[] }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-100">{title}</div>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 items-start justify-between gap-3 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-zinc-500">{item.label}</div>
              {item.hint ? <div className="mt-0.5 break-words text-[11px] leading-4 text-zinc-600">{item.hint}</div> : null}
            </div>
            <div className="max-w-[58%] break-words text-right text-sm font-black leading-tight text-white">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeveloperStats({ summary }: { summary: ProfileSummary }) {
  const groups = [
    {
      title: "Progress",
      items: [
        { label: "Level", value: `${summary.level}` },
        { label: "Rank", value: summary.rank },
        { label: "Coding XP", value: formatNumber(summary.codingXp) },
        { label: "Adventure XP", value: formatNumber(summary.adventureXp) },
        { label: "Season XP", value: formatNumber(summary.seasonXp) },
      ],
    },
    {
      title: "Languages",
      items: [
        { label: "Main", value: summary.mainLanguage ?? "No data" },
        { label: "Strongest", value: summary.strongestLanguage ?? "No data" },
        { label: "Topic", value: summary.strongestTopic ?? "No data" },
        { label: "Top project", value: summary.topProject ?? "No data" },
      ],
    },
    {
      title: "Consistency",
      items: [
        { label: "Current streak", value: `${summary.currentStreak} days` },
        { label: "Best streak", value: `${summary.bestStreak ?? 0} days` },
        { label: "Best day", value: summary.bestDay ?? "No data" },
        { label: "Active days", value: `${summary.activeDays ?? 0}` },
        { label: "Average active day", value: formatMinutes(summary.averageActiveDayMinutes) },
        { label: "Total coding time", value: formatMinutes(summary.totalCodingTimeMinutes) },
      ],
    },
    {
      title: "Collection",
      items: [
        { label: "Achievements", value: `${summary.achievementsUnlocked} / ${summary.achievementsTotal}` },
        { label: "Items", value: `${summary.itemsUnlocked} / ${summary.itemsTotal}` },
      ],
    },
  ];

  return (
    <Card className="p-4 sm:p-5">
      <CardTitle icon={User} label="Developer Stats" />
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => (
          <StatGroup key={group.title} title={group.title} items={group.items} />
        ))}
      </div>
    </Card>
  );
}

function EquipmentSlotCard({ slot }: { slot: ProfileEquipmentSlotSummary }) {
  const item = slot.item;

  if (!item) {
    return (
      <div className="min-w-0 rounded-lg border border-dashed border-white/10 bg-black/20 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-black/30 text-[10px] font-black text-zinc-600">--</span>
          <div className="min-w-0">
            <div className="text-sm font-black text-zinc-300">{slot.label}</div>
            <div className="mt-1 text-xs leading-4 text-zinc-500">Item is not equipped yet.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 rounded-lg border p-3 shadow-lg", rarityClasses[item.rarity])}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/10 bg-black/35 text-sm font-black text-white">{item.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="break-words text-sm font-black leading-tight text-white">{item.name}</div>
          <div className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-400">
            {slot.label} · {item.rarity}
          </div>
          <div className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-300">{formatItemEffect(item)}</div>
          <div className="mt-1 line-clamp-1 text-[11px] font-bold text-zinc-500">{item.source ?? item.unlockLabel ?? "CodeFire"}</div>
        </div>
      </div>
    </div>
  );
}

function EquipmentPanel({ equipped }: { equipped: ProfileEquipmentSlotSummary[] }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle icon={Backpack} label="Equipped Items" />
        <Link href="/inventory" className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100 transition-colors hover:border-emerald-300/40">
          Open Inventory
        </Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {equipped.map((slot) => (
          <EquipmentSlotCard key={slot.slot} slot={slot} />
        ))}
      </div>
    </Card>
  );
}

function AchievementChip({ achievement }: { achievement: Achievement }) {
  return (
    <div className={cn("min-w-0 rounded-lg border p-2.5 shadow-lg", rarityClasses[achievement.rarity ?? "common"])}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-black/35 text-[11px] font-black text-white">{achievement.icon}</span>
        <div className="min-w-0">
          <div className="break-words text-xs font-black leading-tight text-white">{achievement.title}</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{achievement.rarity ?? "common"}</div>
        </div>
      </div>
    </div>
  );
}

function MilestonesPanel({ summary }: { summary: ProfileAchievementsSummary }) {
  return (
    <Card className="p-4 sm:p-5">
      <CardTitle icon={Trophy} label="Profile Milestones" />
      <div className="mt-3 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0">
          <ProgressBar percent={summary.progressPercent} label="Achievement progress" meta={`${summary.unlocked} / ${summary.total} unlocked`} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {summary.recent.length > 0 ? (
              summary.recent.map((achievement) => <AchievementChip key={achievement.id} achievement={achievement} />)
            ) : (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-500">Recent achievements will appear after new unlocks.</div>
            )}
          </div>
        </div>

        <div className="grid min-w-0 gap-3">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-orange-100">
              <Medal className="h-3.5 w-3.5" />
              Rarest
            </div>
            {summary.rarest ? <AchievementChip achievement={summary.rarest} /> : <div className="text-xs text-zinc-500">No rare unlocks yet.</div>}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
              <Shield className="h-3.5 w-3.5" />
              Next achievement
            </div>
            {summary.next ? (
              <div className="grid gap-2">
                <AchievementChip achievement={summary.next} />
                <ProgressBar
                  percent={summary.nextProgressPercent}
                  label={summary.next.progressLabel ?? "Progress"}
                  meta={summary.next.target ? `${formatNumber(summary.next.progress ?? 0)} / ${formatNumber(summary.next.target)}` : undefined}
                />
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

function UnlockedPreview({ items }: { items: InventoryItem[] }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle icon={Award} label="Unlocked Preview" />
        <span className="text-xs font-bold text-zinc-500">Full collection is in Inventory</span>
      </div>
      {items.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          {items.map((item) => (
            <div key={item.id} className={cn("min-w-0 rounded-lg border p-2.5 shadow-lg", rarityClasses[item.rarity])}>
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-black/35 text-[11px] font-black text-white">{item.icon}</span>
                <div className="min-w-0">
                  <div className="line-clamp-2 text-xs font-black leading-tight text-white">{item.name}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{item.rarity}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>No unlocked items yet.</EmptyState>
      )}
    </Card>
  );
}

function LanguageFocus({ languageLevels }: { languageLevels: ProfilePayload["languageLevels"] }) {
  return (
    <Card className="p-4 sm:p-5">
      <CardTitle icon={Flame} label="Language Focus" />
      {languageLevels.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {languageLevels.slice(0, 4).map((level) => (
            <div key={level.name} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="break-words text-sm font-black text-white">{level.name}</div>
              <div className="mt-1 text-xs font-bold text-zinc-500">Level {level.level} · {formatNumber(level.xp)} XP</div>
              <ProgressBar percent={level.progressPercent} label="Next level" meta={`${formatNumber(level.xpIntoLevel)} / ${formatNumber(level.xpForLevel)} XP`} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>No language levels yet.</EmptyState>
      )}
    </Card>
  );
}

export function ProfilePage() {
  const state = useRemoteData<ProfilePayload>("/api/profile");

  if (state.status === "loading") return <LoadingState label="Loading profile..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const { learning, progression, today, streak, achievements, languageLevels, last365Days } = state.data;

  if (!learning) {
    return <EmptyState>Profile data is not ready yet.</EmptyState>;
  }

  const summary = calculateProfileSummary({
    learning,
    progression,
    today,
    days: last365Days.days,
    achievements,
    languageLevels,
    streak,
  });
  const equipped = getEquippedItemsSummary(learning.inventory);
  const achievementSummary = getProfileAchievementsSummary(achievements);
  const rank = progression.rank?.currentRank
    ? progression.rank
    : progression.rankProgress?.currentRank
      ? progression.rankProgress
      : getRankProgress(progression.totalXP);
  const unlockedPreview = learning.inventory.items
    .filter((item) => item.unlocked)
    .sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""))
    .slice(0, 6);

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Profile" title="Character Sheet" description="Compact RPG profile, rank momentum, equipment, milestones, and personal stats." />

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <ProfileHero summary={summary} progression={progression} rank={rank} />
        <AvatarDossier learning={learning} equipped={equipped} currentRank={rank.currentRank} />
      </section>

      <DeveloperStats summary={summary} />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <EquipmentPanel equipped={equipped} />
        <MilestonesPanel summary={achievementSummary} />
      </section>

      <section className="grid gap-4">
        <UnlockedPreview items={unlockedPreview} />
        <LanguageFocus languageLevels={languageLevels} />
      </section>

      <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
        <Boxes className="h-3.5 w-3.5" />
        Profile is read-only. Equipment changes stay in Inventory.
      </div>
    </div>
  );
}
