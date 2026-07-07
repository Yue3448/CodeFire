import { dailyQuestCatalog, weeklyQuestCatalog, type QuestCategory, type QuestDefinition, type QuestUnit } from "@/content/quests";
import { clampPercent, getStableIndex } from "@/lib/codefire-config";
import { getConditionProgress, type ConditionProgressContext } from "@/lib/condition-progress";
import type { DailyNote } from "@/lib/daily-notes";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { StepikEntry } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";

export type DailyQuestCategory = QuestCategory;

export type DailyQuest = {
  id: string;
  title: string;
  description: string;
  category: DailyQuestCategory;
  difficulty?: QuestDefinition["difficulty"];
  target: number;
  progress: number;
  unit: QuestUnit;
  completed: boolean;
  rewardXp?: number;
  rewardAdventureXp?: number;
  rewardLabel: string;
  progressLabel?: string;
};

export type WeeklyQuest = DailyQuest & {
  period: "week";
};

type QuestOptions = {
  yesterday?: DailyCodingActivity;
  streakCurrent?: number;
  pomodoroStats?: PomodoroStats;
  todayNote?: DailyNote | null;
  notes?: DailyNote[];
  studyTasks?: StudyTask[];
  stepikEntries?: StepikEntry[];
  topics?: TopicProgress[];
  activeBoss?: boolean;
};

function hasMainLanguage(mainLanguage: string) {
  return mainLanguage.trim().length > 0 && mainLanguage !== "Нет кода" && mainLanguage !== "РќРµС‚ РєРѕРґР°";
}

function buildContext(
  today: DailyCodingActivity,
  date: string,
  mainLanguage: string,
  options: QuestOptions & { weekDays?: DailyCodingActivity[]; days?: DailyCodingActivity[] } = {},
): ConditionProgressContext {
  return {
    scope: "live",
    date,
    today,
    days: options.days ?? [today],
    weekDays: options.weekDays,
    mainLanguage,
    yesterday: options.yesterday,
    pomodoroStats: options.pomodoroStats,
    todayNote: options.todayNote,
    notes: options.notes,
    studyTasks: options.studyTasks,
    stepikEntries: options.stepikEntries,
    topics: options.topics,
  };
}

function isQuestAvailable(definition: QuestDefinition, context: ConditionProgressContext, mainLanguage: string) {
  if (definition.category === "language" && definition.id.includes("main-language")) {
    return hasMainLanguage(mainLanguage);
  }

  if (definition.category === "recovery") {
    return (context.yesterday?.xp ?? 0) >= 240 || definition.id.includes("light") || definition.id.includes("keep-fire");
  }

  if (definition.category === "pomodoro") {
    return Boolean(context.pomodoroStats);
  }

  if (definition.category === "bossPrep") {
    return Boolean(context.bosses?.some((boss) => !boss.completed)) || definition.id.includes("prep-topic") || definition.id.includes("scouting");
  }

  return true;
}

function scoreQuest(definition: QuestDefinition, context: ConditionProgressContext, mainLanguage: string) {
  let score = 10;

  if ((context.today?.xp ?? 0) === 0 && (definition.difficulty === "easy" || definition.target <= 15)) score += 40;
  if ((context.yesterday?.xp ?? 0) >= 240 && definition.category === "recovery") score += 40;
  if (mainLanguage.toLowerCase() === "python" && (definition.id.includes("python") || definition.title.toLowerCase().includes("python"))) score += 28;
  if (!context.todayNote && definition.category === "journal") score += 18;
  if (context.pomodoroStats && definition.category === "pomodoro") score += 14;
  if (definition.category === "time") score += 8;

  return score;
}

function materializeQuest(definition: QuestDefinition, context: ConditionProgressContext): DailyQuest {
  const progress = getConditionProgress(definition.condition, context);
  const current = Math.min(progress.current, definition.target);

  return {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    category: definition.category,
    difficulty: definition.difficulty,
    target: definition.target,
    progress: current,
    unit: definition.unit,
    completed: progress.completed || progress.current >= definition.target,
    rewardXp: definition.rewardAdventureXp,
    rewardAdventureXp: definition.rewardAdventureXp,
    rewardLabel: `${definition.rewardAdventureXp} Adventure XP`,
    progressLabel: progress.label,
  };
}

function pickStableQuests(
  catalog: QuestDefinition[],
  targetCount: number,
  date: string,
  mainLanguage: string,
  context: ConditionProgressContext,
) {
  const candidates = catalog
    .filter((definition) => isQuestAvailable(definition, context, mainLanguage))
    .sort((a, b) => {
      const scoreDelta = scoreQuest(b, context, mainLanguage) - scoreQuest(a, context, mainLanguage);
      if (scoreDelta !== 0) return scoreDelta;
      return a.id.localeCompare(b.id);
    });
  const picked = new Set<string>();

  for (let cursor = 0; picked.size < targetCount && cursor < candidates.length * 3; cursor += 1) {
    const windowSize = Math.min(candidates.length, Math.max(targetCount + 4, 12));
    const index = getStableIndex(`${date}:quest:${cursor}:${mainLanguage}`, windowSize);
    picked.add(candidates[(index + cursor) % candidates.length].id);
  }

  return [...picked]
    .map((id) => candidates.find((definition) => definition.id === id))
    .filter((definition): definition is QuestDefinition => Boolean(definition));
}

export function getDailyQuests(
  today: DailyCodingActivity,
  date: string,
  mainLanguage: string,
  options: QuestOptions = {},
): DailyQuest[] {
  const context = buildContext(today, date, mainLanguage, options);
  const targetCount = 3 + getStableIndex(`${date}:quest-count`, 3);
  const selected = pickStableQuests(dailyQuestCatalog, targetCount, date, mainLanguage, context);

  return selected.map((definition) => materializeQuest(definition, context));
}

export function getWeeklyQuests({
  today,
  date,
  mainLanguage,
  weekDays,
  days,
  options = {},
}: {
  today: DailyCodingActivity;
  date: string;
  mainLanguage: string;
  weekDays: DailyCodingActivity[];
  days?: DailyCodingActivity[];
  options?: QuestOptions;
}): WeeklyQuest[] {
  const context = buildContext(today, date, mainLanguage, { ...options, weekDays, days });
  const selected = pickStableQuests(weeklyQuestCatalog, 3, `${date}:weekly`, mainLanguage, context);

  return selected.map((definition) => ({
    ...materializeQuest(definition, context),
    period: "week" as const,
  }));
}

export function questPercent(quest: DailyQuest) {
  return clampPercent((quest.progress / quest.target) * 100);
}
