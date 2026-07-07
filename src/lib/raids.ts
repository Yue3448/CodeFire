import { raidCatalog, type RaidCategory, type RaidDefinition, type RaidDifficulty } from "@/content/raids";
import { clampPercent, getStableIndex } from "@/lib/codefire-config";
import { getConditionProgress, type ConditionProgressContext } from "@/lib/condition-progress";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { DailyQuest } from "@/lib/quests";
import type { StepikEntry } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";

type EventUnit = "minutes" | "xp" | "percent" | "count" | "tasks" | "sessions" | "notes";

type RequirementProgress = {
  id: string;
  label: string;
  progress: number;
  target: number;
  percent: number;
  completed: boolean;
  progressLabel: string;
};

type EventBase = {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  unit: EventUnit;
  completed: boolean;
  rewardLabel: string;
  difficulty?: RaidDifficulty;
  requirements?: RequirementProgress[];
};

export type TodayRaid = EventBase & {
  kind: "daily-raid";
};

export type CodeFireEvent = EventBase & {
  type: Exclude<RaidCategory, "daily">;
  rarity: "common" | "rare" | "epic" | "legendary";
};

export type RaidContext = {
  today: DailyCodingActivity;
  date: string;
  mainLanguage: string;
  weekDays: DailyCodingActivity[];
  days?: DailyCodingActivity[];
  yesterday?: DailyCodingActivity;
  completedQuests?: DailyQuest[];
  pomodoroStats?: PomodoroStats;
  studyTasks?: StudyTask[];
  stepikEntries?: StepikEntry[];
  topics?: TopicProgress[];
  seasonLevel?: number;
  seasonXp?: number;
};

function rarityForDifficulty(difficulty: RaidDifficulty): CodeFireEvent["rarity"] {
  if (difficulty === "legendary") return "legendary";
  if (difficulty === "epic") return "epic";
  if (difficulty === "hard") return "rare";
  return "common";
}

function contextForRaid(context: RaidContext): ConditionProgressContext {
  return {
    scope: "live",
    date: context.date,
    today: context.today,
    days: context.days ?? context.weekDays,
    weekDays: context.weekDays,
    mainLanguage: context.mainLanguage,
    yesterday: context.yesterday,
    pomodoroStats: context.pomodoroStats,
    studyTasks: context.studyTasks,
    stepikEntries: context.stepikEntries,
    topics: context.topics,
    seasonLevel: context.seasonLevel,
    seasonXp: context.seasonXp,
  };
}

function isWeekend(date: string) {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function isRaidAvailable(definition: RaidDefinition, context: RaidContext) {
  if (definition.category === "weekend") return isWeekend(context.date);
  if (definition.category === "recovery") return (context.yesterday?.xp ?? 0) >= 240 || definition.id.includes("balance");
  if (definition.category === "language") {
    const title = definition.title.toLowerCase();
    const language = context.mainLanguage.toLowerCase();
    return title.includes(language) || title.includes("dictionary") || title.includes("oop") || title.includes("http") || title.includes("sql") || title.includes("docker") || title.includes("git");
  }
  return true;
}

function buildRaid(definition: RaidDefinition, context: RaidContext): EventBase {
  const progressContext = contextForRaid(context);
  const requirements = definition.requirements.map((requirement) => {
    const progress = getConditionProgress(requirement.condition, progressContext);

    return {
      id: requirement.id,
      label: requirement.label,
      progress: progress.current,
      target: progress.target,
      percent: progress.percent,
      completed: progress.completed,
      progressLabel: progress.label,
    };
  });
  const totalPercent = requirements.length
    ? Math.round(requirements.reduce((sum, requirement) => sum + requirement.percent, 0) / requirements.length)
    : 0;
  const rewardLabel = definition.rewards
    .map((reward) => reward.label)
    .slice(0, 2)
    .join(" + ");

  return {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    target: 100,
    progress: totalPercent,
    unit: "percent",
    completed: requirements.every((requirement) => requirement.completed),
    rewardLabel,
    difficulty: definition.difficulty,
    requirements,
  };
}

export function getTodayRaid(
  today: DailyCodingActivity,
  date: string,
  mainLanguage: string,
  options: {
    weekDays?: DailyCodingActivity[];
    days?: DailyCodingActivity[];
    pomodoroStats?: PomodoroStats;
    studyTasks?: StudyTask[];
    stepikEntries?: StepikEntry[];
    topics?: TopicProgress[];
    seasonLevel?: number;
    seasonXp?: number;
  } = {},
): TodayRaid {
  const context: RaidContext = {
    today,
    date,
    mainLanguage,
    weekDays: options.weekDays ?? [today],
    days: options.days,
    pomodoroStats: options.pomodoroStats,
    studyTasks: options.studyTasks,
    stepikEntries: options.stepikEntries,
    topics: options.topics,
    seasonLevel: options.seasonLevel,
    seasonXp: options.seasonXp,
  };
  const candidates = raidCatalog.filter((definition) => definition.category === "daily" && isRaidAvailable(definition, context));
  const definition = candidates[getStableIndex(`${date}:raid:${mainLanguage}`, candidates.length)] ?? raidCatalog[0];

  return {
    ...buildRaid(definition, context),
    kind: "daily-raid",
  };
}

export function getActiveEvents(context: RaidContext): CodeFireEvent[] {
  const candidates = raidCatalog.filter((definition) => definition.category !== "daily" && isRaidAvailable(definition, context));
  const targetCount = 1 + getStableIndex(`${context.date}:events-count`, 2);
  const picked = new Set<string>();

  for (let cursor = 0; picked.size < targetCount && cursor < candidates.length * 2; cursor += 1) {
    const index = getStableIndex(`${context.date}:event:${cursor}:${context.mainLanguage}`, candidates.length);
    picked.add(candidates[(index + cursor) % candidates.length].id);
  }

  return [...picked]
    .map((id) => candidates.find((definition) => definition.id === id))
    .filter((definition): definition is RaidDefinition => Boolean(definition))
    .map((definition) => ({
      ...buildRaid(definition, context),
      type: definition.category as Exclude<RaidCategory, "daily">,
      rarity: rarityForDifficulty(definition.difficulty),
    }));
}

export function raidPercent(raid: TodayRaid | CodeFireEvent) {
  return clampPercent((raid.progress / raid.target) * 100);
}
