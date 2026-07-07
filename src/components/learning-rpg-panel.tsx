"use client";

import { useMemo, useState } from "react";
import type React from "react";
import {
  BookOpen,
  Boxes,
  Crown,
  Dumbbell,
  Flag,
  Goal,
  GraduationCap,
  HeartPulse,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Swords,
  Trash2,
  User,
} from "lucide-react";
import type { LearningRpg } from "@/lib/learning-rpg";
import { cn } from "@/lib/utils";
import { HallOfFameCard as HallOfFameShowcase } from "@/components/hall-of-fame/hall-of-fame-card";
import { AvatarCard } from "@/components/profile/avatar-card";
import { DeveloperProfileCard } from "@/components/profile/developer-profile-card";
import { SeasonCard as SeasonShowcase } from "@/components/seasons/season-card";
import { SeasonPass as SeasonPassShowcase } from "@/components/seasons/season-pass";
import { LearningTimeline } from "@/components/timeline/learning-timeline";

const tabs = ["Overview", "RPG", "Study", "Seasons", "Profile"] as const;
const studySources = ["Stepik", "Codeforces", "Book", "Custom"] as const;
const studyStatuses = ["solved", "almost", "failed", "reviewed"] as const;
const goalTypes = ["time", "language", "tasks", "pomodoro", "journal", "focus", "topic", "manualStudy"] as const;
const goalUnits = ["minutes", "xp", "tasks", "sessions", "percent", "notes"] as const;
const goalPeriods = ["day", "week", "month"] as const;

type TabId = (typeof tabs)[number];

export function LearningRpgPanel({
  learning,
  todayDate,
}: {
  learning: LearningRpg;
  todayDate: string;
}) {
  const [tab, setTab] = useState<TabId>("Overview");

  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-orange-100">
            <Sparkles className="h-4 w-4 text-orange-300" />
            Learning RPG
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">CodeFire progression layer</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition-colors",
                tab === item
                  ? "border-orange-300/50 bg-orange-300/15 text-orange-100"
                  : "border-white/10 bg-black/20 text-zinc-500 hover:text-zinc-200",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {tab === "Overview" ? <OverviewTab learning={learning} /> : null}
        {tab === "RPG" ? <RpgTab learning={learning} todayDate={todayDate} /> : null}
        {tab === "Study" ? <StudyTab learning={learning} todayDate={todayDate} /> : null}
        {tab === "Seasons" ? <SeasonsTab learning={learning} /> : null}
        {tab === "Profile" ? <ProfileTab learning={learning} /> : null}
      </div>
    </article>
  );
}

function OverviewTab({ learning }: { learning: LearningRpg }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <Metric label="Coding XP" value={`${learning.xp.codingXp}`} hint="только WakaTime" />
        <Metric label="Adventure XP" value={`${learning.xp.adventureXp}`} hint="квесты, задачи, боссы, заметки" />
        <Metric label="Season XP" value={`${learning.xp.seasonXp}`} hint="отдельный сезонный прогресс" />
        <Metric label="Total display" value={`${learning.xp.totalDisplayXp}`} hint="не заменяет Coding XP" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RecoveryCard learning={learning} />
        <ActiveBossCard learning={learning} />
        <WeeklyJournalCard learning={learning} compact />
        <TimelineCard learning={learning} />
      </div>
    </div>
  );
}

function RpgTab({ learning, todayDate }: { learning: LearningRpg; todayDate: string }) {
  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-4">
          <ActiveBossCard learning={learning} full />
          <InventoryCard learning={learning} />
          <GoalsCard learning={learning} todayDate={todayDate} />
        </div>
        <div className="grid content-start gap-4">
          <RecoveryCard learning={learning} full />
        </div>
      </div>
      <HallOfFameShowcase hallOfFame={learning.hallOfFame} />
    </div>
  );
}

function StudyTab({ learning, todayDate }: { learning: LearningRpg; todayDate: string }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-4">
        <StudyTaskCard learning={learning} todayDate={todayDate} />
        <StepikCard learning={learning} todayDate={todayDate} />
        <ManualStudyCard learning={learning} todayDate={todayDate} />
      </div>
      <div className="grid gap-4">
        <TopicTrackerCard learning={learning} />
        <DifficultyCard learning={learning} todayDate={todayDate} />
        <WeeklyJournalCard learning={learning} />
      </div>
    </div>
  );
}

function SeasonsTab({ learning }: { learning: LearningRpg }) {
  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SeasonShowcase learning={learning} />
        <SeasonPassShowcase learning={learning} />
      </div>
      <ThemesCard learning={learning} />
      <HallOfFameShowcase hallOfFame={learning.hallOfFame} />
    </div>
  );
}

function ProfileTab({ learning }: { learning: LearningRpg }) {
  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <DeveloperProfileCard learning={learning} />
        <AvatarCard learning={learning} />
      </div>
      <LearningTimeline events={learning.timeline} limit={18} grouped />
    </div>
  );
}

function ActiveBossCard({ learning, full }: { learning: LearningRpg; full?: boolean }) {
  const boss = learning.activeBoss;

  return (
    <Panel icon={<Swords className="h-4 w-4" />} title="Boss Fights">
      {boss ? (
        <div className="rounded-lg border border-orange-300/25 bg-orange-300/10 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xl font-black text-white">{boss.title}</div>
              <p className="mt-1 text-sm leading-6 text-zinc-300">{boss.description}</p>
            </div>
            <Badge>{boss.difficulty}</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {boss.requirements.map((requirement) => (
              <ProgressLine
                key={requirement.id}
                label={requirement.label}
                value={`${requirement.progress}/${requirement.target}`}
                percent={(requirement.progress / requirement.target) * 100}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-orange-100">
              Reward: {boss.reward.adventureXp} Adventure XP{boss.reward.itemId ? ` · ${boss.reward.itemId}` : ""}
            </span>
            <button
              type="button"
              disabled={!boss.completed}
              onClick={() => postAndReload("/api/boss-fights", { action: "claim", bossId: boss.id })}
              className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Claim
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="text-sm font-bold text-zinc-300">Активного босса пока нет.</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {learning.bossPresets.slice(0, full ? 4 : 2).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => postAndReload("/api/boss-fights", { action: "createPreset", presetId: preset.id })}
                className="rounded-lg border border-orange-300/25 bg-orange-300/10 px-3 py-2 text-xs font-black text-orange-100"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>
      )}
      {full ? (
        <div className="mt-4 grid gap-2">
          {learning.completedBosses.slice(0, 5).map((boss) => (
            <SmallRow key={boss.id} title={boss.title} meta={`${boss.reward.adventureXp} Adventure XP`} />
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

function InventoryCard({ learning }: { learning: LearningRpg }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [visibleLimit, setVisibleLimit] = useState(18);
  const itemTypes = useMemo(
    () => ["all", ...Array.from(new Set(learning.inventory.items.map((item) => item.type)))],
    [learning.inventory.items],
  );
  const rarities = ["all", "common", "rare", "epic", "legendary", "mythic"];
  const filteredItems = useMemo(
    () =>
      learning.inventory.items.filter((item) => {
        const typeMatch = typeFilter === "all" || item.type === typeFilter;
        const rarityMatch = rarityFilter === "all" || item.rarity === rarityFilter;

        return typeMatch && rarityMatch;
      }),
    [learning.inventory.items, rarityFilter, typeFilter],
  );
  const slotItems = useMemo(
    () => ({
      amulet: learning.inventory.items.find((item) => item.id === learning.inventory.equipped.amulet),
      ring: learning.inventory.items.find((item) => item.id === learning.inventory.equipped.ring),
      artifact: learning.inventory.items.find((item) => item.id === learning.inventory.equipped.artifact),
    }),
    [learning.inventory.equipped.amulet, learning.inventory.equipped.artifact, learning.inventory.equipped.ring, learning.inventory.items],
  );

  return (
    <Panel icon={<Boxes className="h-4 w-4" />} title="Inventory">
      <div className="mb-3 text-sm text-zinc-400">
        {learning.inventory.unlockedCount}/{learning.inventory.items.length} unlocked · slots: amulet, ring, artifact
      </div>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {(["amulet", "ring", "artifact"] as const).map((slot) => (
          <div key={slot} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{slot}</div>
            <div className="mt-1 min-h-5 break-words text-sm font-black text-white">
              {slotItems[slot] ? `${slotItems[slot]?.icon} ${slotItems[slot]?.name}` : "empty"}
            </div>
          </div>
        ))}
      </div>
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Select value={typeFilter} onChange={(value) => { setTypeFilter(value); setVisibleLimit(18); }} ariaLabel="Inventory type filter">
          {itemTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </Select>
        <Select value={rarityFilter} onChange={(value) => { setRarityFilter(value); setVisibleLimit(18); }} ariaLabel="Inventory rarity filter">
          {rarities.map((rarity) => (
            <option key={rarity} value={rarity}>{rarity}</option>
          ))}
        </Select>
        <Metric label="boost" value={`${learning.inventory.boosts.questAdventureXpBoost + learning.inventory.boosts.pomodoroQuestBoost + learning.inventory.boosts.studyTaskBoost}%`} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {filteredItems.slice(0, visibleLimit).map((item) => (
          <div
            key={item.id}
            className={cn(
              "min-w-0 rounded-lg border p-3",
              item.unlocked ? rarityClass(item.rarity) : "border-white/10 bg-black/20 opacity-65",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black text-white">{item.icon} {item.name}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {item.type} · {item.rarity}
                </div>
              </div>
              {item.equipped ? <Badge>equipped</Badge> : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-400">{item.description}</p>
            <div className="mt-2 text-[11px] font-bold text-zinc-500">
              {item.effect ? effectLabel(item.effect) : "cosmetic"}
            </div>
            {!item.unlocked && item.unlockTarget ? (
              <div className="mt-3">
                <ProgressLine
                  label="unlock"
                  value={item.unlockLabel ?? `${item.unlockProgress ?? 0} / ${item.unlockTarget}`}
                  percent={((item.unlockProgress ?? 0) / item.unlockTarget) * 100}
                />
              </div>
            ) : null}
            {item.source ? <div className="mt-1 text-[11px] text-zinc-600">source: {item.source}</div> : null}
            {item.unlocked ? (
              <button
                type="button"
                onClick={() => postAndReload("/api/inventory", { action: item.equipped ? "unequip" : "equip", itemId: item.id })}
                className="mt-3 min-h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-black text-zinc-200 hover:border-emerald-300/35"
              >
                {item.equipped ? "Снять" : "Экипировать"}
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {filteredItems.length > visibleLimit ? (
        <button
          type="button"
          onClick={() => setVisibleLimit((current) => current + 18)}
          className="mt-3 min-h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-black text-zinc-200 hover:border-emerald-300/35"
        >
          Показать больше
        </button>
      ) : null}
    </Panel>
  );
}

function rarityClass(rarity: LearningRpg["inventory"]["items"][number]["rarity"]) {
  if (rarity === "mythic") return "border-fuchsia-300/45 bg-gradient-to-br from-red-400/15 to-fuchsia-400/15";
  if (rarity === "legendary") return "border-yellow-300/45 bg-yellow-300/10";
  if (rarity === "epic") return "border-fuchsia-300/35 bg-fuchsia-300/10";
  if (rarity === "rare") return "border-sky-300/35 bg-sky-300/10";
  return "border-emerald-300/25 bg-emerald-300/10";
}

function effectLabel(effect: NonNullable<LearningRpg["inventory"]["items"][number]["effect"]>) {
  if (effect.kind === "cosmeticOnly") return "cosmetic only";
  const value = effect.value ? `+${effect.value}%` : "bonus";
  return effect.language ? `${value} ${effect.kind} · ${effect.language}` : `${value} ${effect.kind}`;
}

function StudyTaskCard({ learning, todayDate }: { learning: LearningRpg; todayDate: string }) {
  const todayTasks = learning.studyTasks.items.filter((task) => task.date === todayDate);

  return (
    <Panel icon={<GraduationCap className="h-4 w-4" />} title="Учебные задачи">
      <StudyTaskAdvancedForm todayDate={todayDate} />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="today" value={`${learning.studyTasks.stats.todayTasks}`} />
        <Metric label="week" value={`${learning.studyTasks.stats.weekTasks}`} />
        <Metric label="avg diff" value={`${learning.studyTasks.stats.averageDifficulty}`} />
        <Metric label="Study XP" value={`${learning.studyTasks.stats.studyXp}`} />
      </div>
      <ListPreview
        items={learning.studyTasks.items.slice(0, 5).map((task) => ({
          id: task.id,
          title: task.title || task.topic,
          meta: `${task.source} · ${task.status} · d${task.difficulty}`,
        }))}
      />
      <div className="mt-4 space-y-2">
        {todayTasks.length === 0 ? (
          <EmptyText>Сегодня учебных задач пока нет.</EmptyText>
        ) : (
          todayTasks.map((task) => (
            <div key={task.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words text-sm font-black text-white">{task.title || task.topic}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {task.source} · {task.status} · difficulty {task.difficulty}
                  </div>
                  {task.notes ? <p className="mt-2 text-xs leading-5 text-zinc-400">{task.notes}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => deleteAndReload("/api/study-tasks", task.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-red-300/25 bg-red-400/10 text-red-100"
                  aria-label="Delete study task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function StepikCard({ learning, todayDate }: { learning: LearningRpg; todayDate: string }) {
  return (
    <Panel icon={<Dumbbell className="h-4 w-4" />} title="Stepik Practice">
      <StepikForm todayDate={todayDate} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="today" value={`${learning.stepik.stats.todayTasks}`} />
        <Metric label="week" value={`${learning.stepik.stats.weekTasks}`} />
        <Metric label="XP" value={`${learning.stepik.stats.adventureXp}`} />
      </div>
      <ListPreview
        items={learning.stepik.entries.slice(0, 4).map((entry) => ({
          id: entry.id,
          title: entry.topic,
          meta: `${entry.tasksSolved} задач · ${entry.status}`,
        }))}
      />
    </Panel>
  );
}

function ManualStudyCard({ learning, todayDate }: { learning: LearningRpg; todayDate: string }) {
  return (
    <Panel icon={<BookOpen className="h-4 w-4" />} title="Учёба вне кода">
      <ManualStudyForm todayDate={todayDate} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="today" value={`${learning.manualStudy.stats.todayMinutes}м`} />
        <Metric label="week" value={`${learning.manualStudy.stats.weekMinutes}м`} />
        <Metric label="Study XP" value={`${learning.manualStudy.stats.adventureXp}`} />
      </div>
      <ListPreview
        items={learning.manualStudy.entries.slice(0, 4).map((entry) => ({
          id: entry.id,
          title: entry.topic || entry.type,
          meta: `${entry.minutes} мин · ${entry.type}`,
        }))}
      />
    </Panel>
  );
}

function TopicTrackerCard({ learning }: { learning: LearningRpg }) {
  return (
    <Panel icon={<Flag className="h-4 w-4" />} title="Темы">
      <div className="space-y-3">
        {learning.topics.slice(0, 8).map((topic) => (
          <div key={topic.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="break-words text-sm font-black text-white">{topic.name}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  lvl {topic.level} · confidence {topic.confidence}/5 · {topic.solvedTasks} tasks
                </div>
              </div>
              {topic.reviewRecommended ? <Badge>review</Badge> : null}
            </div>
            <ProgressLine label={topic.reviewHint} value={`${topic.xp} XP`} percent={Math.min(100, topic.xp / 8)} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DifficultyCard({ learning, todayDate }: { learning: LearningRpg; todayDate: string }) {
  const labels = {
    easy: "Легко",
    normal: "Нормально",
    hard: "Трудно",
    veryHard: "Очень трудно",
  } satisfies Record<NonNullable<LearningRpg["todayDifficulty"]>["difficulty"], string>;

  return (
    <Panel icon={<HeartPulse className="h-4 w-4" />} title="Трудность дня">
      <div className="grid grid-cols-2 gap-2">
        {(["easy", "normal", "hard", "veryHard"] as const).map((difficulty) => (
          <button
            key={difficulty}
            type="button"
            onClick={() => postAndReload("/api/difficulty", { date: todayDate, difficulty })}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-black",
              learning.todayDifficulty?.difficulty === difficulty
                ? "border-orange-300/50 bg-orange-300/15 text-orange-100"
                : "border-white/10 bg-black/20 text-zinc-400",
            )}
          >
            {labels[difficulty]}
          </button>
        ))}
      </div>
    </Panel>
  );
}

function RecoveryCard({ learning, full }: { learning: LearningRpg; full?: boolean }) {
  return (
    <Panel icon={<HeartPulse className="h-4 w-4" />} title="Recovery / Light Day">
      <div className={cn("rounded-lg border p-4", learning.recovery.active ? "border-yellow-300/30 bg-yellow-300/10" : "border-emerald-300/25 bg-emerald-300/10")}>
        <div className="text-lg font-black text-white">{learning.recovery.title}</div>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{learning.recovery.description}</p>
        <div className="mt-3 space-y-2">
          {learning.recovery.tips.slice(0, full ? 3 : 2).map((tip) => (
            <div key={tip} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
              {tip}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            postAndReload("/api/light-day", {
              date: new Date().toISOString().slice(0, 10),
              enabled: true,
              reason: "recovery",
              minimumGoalMinutes: 25,
            })
          }
          className="mt-3 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100"
        >
          Включить лёгкий день
        </button>
      </div>
    </Panel>
  );
}

function GoalsCard({ learning, todayDate }: { learning: LearningRpg; todayDate: string }) {
  return (
    <Panel icon={<Goal className="h-4 w-4" />} title="Custom Goals">
      <GoalAdvancedForm todayDate={todayDate} />
      <div className="mt-4 space-y-3">
        {learning.goals.progress.length === 0 ? (
          <EmptyText>Пользовательских целей пока нет.</EmptyText>
        ) : (
          learning.goals.progress.slice(0, 5).map((goal) => (
            <div key={goal.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <ProgressLine label={goal.title} value={`${goal.progress}/${goal.target} ${goal.unit}`} percent={goal.percent} />
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    {goal.type} · {goal.period}{goal.completed ? " · completed" : ""}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => postAndReload("/api/goals", { action: "toggle", id: goal.id })}
                    className="min-h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-[11px] font-black text-zinc-200"
                  >
                    off
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAndReload("/api/goals", goal.id)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-red-300/25 bg-red-400/10 text-red-100"
                    aria-label="Delete goal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function WeeklyJournalCard({ learning, compact }: { learning: LearningRpg; compact?: boolean }) {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const journal = learning.weeklyJournal;

  return (
    <Panel icon={<ScrollText className="h-4 w-4" />} title="Учебный дневник недели">
      <p className="text-sm leading-6 text-zinc-300">{journal.summary}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="XP" value={`${journal.codingXp}`} />
        <Metric label="tasks" value={`${journal.solvedTasks}`} />
        <Metric label="notes" value={`${journal.notesCount}`} />
      </div>
      {!compact ? (
        <>
          <div className="mt-3 space-y-2">
            {journal.recommendations.map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
                {item}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowMarkdown((value) => !value)}
            className="mt-3 rounded-lg border border-orange-300/25 bg-orange-300/10 px-3 py-2 text-xs font-black text-orange-100"
          >
            Export week to Markdown
          </button>
          {showMarkdown ? (
            <textarea
              readOnly
              value={journal.markdown}
              className="mt-3 h-52 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-3 text-xs leading-5 text-zinc-300 outline-none"
            />
          ) : null}
        </>
      ) : null}
    </Panel>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SeasonCard({ learning }: { learning: LearningRpg }) {
  const season = learning.activeSeason;

  return (
    <Panel icon={<Crown className="h-4 w-4" />} title="Season">
      {season ? (
        <>
          <div className="text-xl font-black text-white">{season.title}</div>
          <p className="mt-1 text-sm leading-6 text-zinc-400">{season.description}</p>
          <div className="mt-3 text-xs font-bold text-zinc-500">{learning.seasonDaysLeft} дней до конца</div>
          <div className="mt-4 space-y-3">
            {season.goals.map((goal) => (
              <ProgressLine key={goal.id} label={goal.title} value={`${goal.progress}/${goal.target}`} percent={(goal.progress / goal.target) * 100} />
            ))}
          </div>
        </>
      ) : (
        <EmptyText>Активного сезона нет.</EmptyText>
      )}
    </Panel>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SeasonPassCard({ learning }: { learning: LearningRpg }) {
  const pass = learning.seasonPass;

  return (
    <Panel icon={<ShieldCheck className="h-4 w-4" />} title="Season Pass">
      {pass ? (
        <>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black leading-none text-emerald-200">{pass.level}</span>
            <span className="pb-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">season level</span>
          </div>
          <ProgressLine label="До следующего уровня" value={`${pass.seasonXp}/${pass.nextLevelXp} Season XP`} percent={pass.progressPercent} />
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {pass.levels.map((level) => (
              <div
                key={level.level}
                className={cn(
                  "min-w-28 rounded-lg border p-3",
                  level.unlocked ? "border-emerald-300/30 bg-emerald-300/10" : "border-white/10 bg-black/20 opacity-70",
                )}
              >
                <div className="text-xs font-black text-zinc-500">Lv {level.level}</div>
                <div className="mt-1 text-sm font-black text-white">{level.reward.title}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyText>Season Pass появится вместе с активным сезоном.</EmptyText>
      )}
    </Panel>
  );
}

function ThemesCard({ learning }: { learning: LearningRpg }) {
  return (
    <Panel icon={<Sparkles className="h-4 w-4" />} title="Unlockable Themes">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {learning.themes.themes.map((theme) => (
          <div
            key={theme.id}
            className={cn(
              "min-w-0 rounded-lg border p-4",
              theme.id === learning.themes.selectedThemeId
                ? "border-orange-300/45 bg-orange-300/10 shadow-[0_0_20px_rgba(255,138,42,0.08)]"
                : theme.unlocked
                  ? "border-emerald-300/25 bg-emerald-300/10"
                  : "border-white/10 bg-black/20 opacity-75",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="whitespace-normal break-words text-base font-black leading-tight text-white">
                  {theme.name}
                </div>
                <p className="mt-2 whitespace-normal break-words text-sm leading-5 text-zinc-400">
                  {theme.description}
                </p>
              </div>
              <Badge>
                {theme.id === learning.themes.selectedThemeId ? "Active" : theme.unlocked ? "Unlocked" : "Locked"}
              </Badge>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className={cn("h-9 w-16 shrink-0 rounded-lg border", themePreviewClass(theme.id))} />
              <div className="min-w-0 text-xs font-bold leading-5 text-zinc-500">
                Условие: <span className="text-zinc-300">{theme.unlockCondition}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function themePreviewClass(themeId: string) {
  if (themeId === "campfire") return "border-orange-300/30 bg-gradient-to-r from-orange-400/40 to-yellow-200/30";
  if (themeId === "python-green") return "border-emerald-300/30 bg-gradient-to-r from-emerald-400/35 to-sky-300/25";
  if (themeId === "gold-forge") return "border-yellow-300/35 bg-gradient-to-r from-yellow-300/40 to-orange-300/25";
  if (themeId === "recovery-moon") return "border-sky-300/30 bg-gradient-to-r from-sky-300/25 to-zinc-200/20";
  if (themeId === "mythic-flame") return "border-fuchsia-300/30 bg-gradient-to-r from-orange-400/35 to-fuchsia-400/30";
  return "border-emerald-300/25 bg-gradient-to-r from-orange-400/35 to-emerald-300/30";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProfileCard({ learning }: { learning: LearningRpg }) {
  const profile = learning.profile;

  return (
    <Panel icon={<User className="h-4 w-4" />} title="Developer Profile">
      <div className="rounded-lg border border-orange-300/25 bg-orange-300/10 p-4">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-100">{learning.avatar.stage}</div>
        <div className="mt-2 text-3xl font-black text-white">{profile.name}</div>
        <div className="mt-1 text-sm font-bold text-emerald-100">{profile.title}</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="rank" value={profile.globalRank} />
          <Metric label="level" value={`${profile.level}`} />
          <Metric label="Coding XP" value={`${profile.codingXp}`} />
          <Metric label="Adventure XP" value={`${profile.adventureXp}`} />
          <Metric label="main" value={profile.mainLanguage ?? "нет"} />
          <Metric label="items" value={`${profile.itemsUnlocked}`} />
        </div>
      </div>
    </Panel>
  );
}

function TimelineCard({ learning, full }: { learning: LearningRpg; full?: boolean }) {
  return (
    <Panel icon={<ScrollText className="h-4 w-4" />} title="Путь обучения">
      <div className="space-y-2">
        {learning.timeline.slice(0, full ? 18 : 6).map((event) => (
          <div key={`${event.type}-${event.id}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-white">{event.icon ? `${event.icon} ` : ""}{event.title}</span>
              <span className="text-xs font-bold text-zinc-500">{event.date}</span>
            </div>
            {event.description ? <p className="mt-1 text-xs text-zinc-400">{event.description}</p> : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function StudyTaskAdvancedForm({ todayDate }: { todayDate: string }) {
  const [source, setSource] = useState<(typeof studySources)[number]>("Custom");
  const [topic, setTopic] = useState("Словари");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("2");
  const [status, setStatus] = useState<(typeof studyStatuses)[number]>("solved");
  const [notes, setNotes] = useState("");

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void postAndReload("/api/study-tasks", {
          date: todayDate,
          source,
          topic,
          title,
          difficulty: Number(difficulty),
          status,
          notes,
        });
        setTitle("");
        setNotes("");
      }}
    >
      <div className="grid gap-2 sm:grid-cols-[0.8fr_1fr_1fr]">
        <Select value={source} onChange={(value) => setSource(value as (typeof studySources)[number])} ariaLabel="Study task source">
          {studySources.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </Select>
        <Input value={topic} onChange={setTopic} placeholder="Тема" />
        <Input value={title} onChange={setTitle} placeholder="Задача" />
      </div>
      <div className="grid gap-2 sm:grid-cols-[0.7fr_1fr_auto]">
        <Select value={difficulty} onChange={setDifficulty} ariaLabel="Study task difficulty">
          {[1, 2, 3, 4, 5].map((item) => (
            <option key={item} value={item}>difficulty {item}</option>
          ))}
        </Select>
        <Select value={status} onChange={(value) => setStatus(value as (typeof studyStatuses)[number])} ariaLabel="Study task status">
          {studyStatuses.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </Select>
        <SubmitButton label="Add" />
      </div>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Заметки к задаче"
        className="min-h-20 w-full resize-none rounded-lg border border-white/10 bg-black/25 p-3 text-sm font-semibold text-white outline-none placeholder:text-zinc-600 focus:border-emerald-300/35"
      />
    </form>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StudyTaskForm({ todayDate }: { todayDate: string }) {
  const [topic, setTopic] = useState("Словари");
  const [title, setTitle] = useState("");

  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        void postAndReload("/api/study-tasks", { date: todayDate, topic, title, source: "Custom", difficulty: 2, status: "solved" });
      }}
    >
      <Input value={topic} onChange={setTopic} placeholder="Тема" />
      <Input value={title} onChange={setTitle} placeholder="Задача" />
      <SubmitButton label="Add" />
    </form>
  );
}

function StepikForm({ todayDate }: { todayDate: string }) {
  const [topic, setTopic] = useState("Algorithms");
  const [tasksSolved, setTasksSolved] = useState("1");

  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_90px_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        void postAndReload("/api/stepik", { date: todayDate, topic, tasksSolved: Number(tasksSolved), difficulty: 2, status: "normal" });
      }}
    >
      <Input value={topic} onChange={setTopic} placeholder="Тема" />
      <Input value={tasksSolved} onChange={setTasksSolved} placeholder="Кол-во" />
      <SubmitButton label="Add" />
    </form>
  );
}

function ManualStudyForm({ todayDate }: { todayDate: string }) {
  const [topic, setTopic] = useState("Python");
  const [minutes, setMinutes] = useState("30");

  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_90px_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        void postAndReload("/api/manual-study", { date: todayDate, topic, minutes: Number(minutes), type: "theory" });
      }}
    >
      <Input value={topic} onChange={setTopic} placeholder="Тема" />
      <Input value={minutes} onChange={setMinutes} placeholder="Мин" />
      <SubmitButton label="Add" />
    </form>
  );
}

function GoalAdvancedForm({ todayDate }: { todayDate: string }) {
  const [title, setTitle] = useState("90 минут Python");
  const [type, setType] = useState<(typeof goalTypes)[number]>("language");
  const [target, setTarget] = useState("90");
  const [unit, setUnit] = useState<(typeof goalUnits)[number]>("minutes");
  const [period, setPeriod] = useState<(typeof goalPeriods)[number]>("day");
  const [language, setLanguage] = useState("Python");
  const [topic, setTopic] = useState("");

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void postAndReload("/api/goals", {
          title,
          type,
          target: Number(target),
          unit,
          period,
          language,
          topic,
          active: true,
          createdAt: `${todayDate}T00:00:00.000Z`,
        });
      }}
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_0.8fr_0.7fr]">
        <Input value={title} onChange={setTitle} placeholder="Название цели" />
        <Select value={type} onChange={(value) => setType(value as (typeof goalTypes)[number])} ariaLabel="Goal type">
          {goalTypes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </Select>
        <Input value={target} onChange={setTarget} placeholder="Target" />
      </div>
      <div className="grid gap-2 sm:grid-cols-[0.8fr_0.8fr_1fr_1fr_auto]">
        <Select value={unit} onChange={(value) => setUnit(value as (typeof goalUnits)[number])} ariaLabel="Goal unit">
          {goalUnits.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </Select>
        <Select value={period} onChange={(value) => setPeriod(value as (typeof goalPeriods)[number])} ariaLabel="Goal period">
          {goalPeriods.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </Select>
        <Input value={language} onChange={setLanguage} placeholder="Language" />
        <Input value={topic} onChange={setTopic} placeholder="Topic" />
        <SubmitButton label="Create" />
      </div>
    </form>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GoalForm({ todayDate }: { todayDate: string }) {
  const [title, setTitle] = useState("90 минут Python");

  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        void postAndReload("/api/goals", {
          title,
          type: "language",
          target: 90,
          unit: "minutes",
          period: "day",
          language: "Python",
          active: true,
          createdAt: `${todayDate}T00:00:00.000Z`,
        });
      }}
    >
      <Input value={title} onChange={setTitle} placeholder="Goal title" />
      <SubmitButton label="Create" />
    </form>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-100">
        <span className="text-orange-300">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="break-words text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-1 break-words text-xl font-black leading-tight text-white">{value}</div>
      {hint ? <div className="mt-1 text-[11px] leading-4 text-zinc-500">{hint}</div> : null}
    </div>
  );
}

function ProgressLine({ label, value, percent }: { label: string; value: string; percent: number }) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-zinc-400">
        <span className="min-w-0 break-words">{label}</span>
        <span className="shrink-0 text-orange-100">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-emerald-300/15 bg-black/40">
        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-300" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function SmallRow({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="break-words text-sm font-black text-white">{title}</div>
      <div className="mt-1 break-words text-xs text-zinc-500">{meta}</div>
    </div>
  );
}

function ListPreview({ items }: { items: Array<{ id: string; title: string; meta: string }> }) {
  if (items.length === 0) {
    return <EmptyText>Записей пока нет.</EmptyText>;
  }

  return (
    <div className="mt-4 space-y-2">
      {items.map((item) => (
        <SmallRow key={item.id} title={item.title} meta={item.meta} />
      ))}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-orange-300/25 bg-orange-300/10 px-2 py-1 text-[11px] font-black text-orange-100">
      {children}
    </span>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-zinc-500">{children}</div>;
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-10 min-w-0 rounded-lg border border-white/10 bg-black/25 px-3 text-sm font-semibold text-white outline-none placeholder:text-zinc-600 focus:border-emerald-300/35"
    />
  );
}

function Select({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className="min-h-10 min-w-0 rounded-lg border border-white/10 bg-black/25 px-3 text-sm font-semibold text-white outline-none focus:border-emerald-300/35"
    >
      {children}
    </select>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="min-h-10 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 text-xs font-black text-emerald-100"
    >
      {label}
    </button>
  );
}

async function postAndReload(url: string, body: unknown) {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  window.location.reload();
}

async function deleteAndReload(url: string, id: string) {
  await fetch(`${url}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  window.location.reload();
}
