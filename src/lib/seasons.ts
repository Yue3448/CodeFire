import { addDays, differenceInCalendarDays, format } from "date-fns";
import { getLocalDateKey, normalizeText, readJsonStore, writeJsonStore } from "@/lib/local-json-store.server";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { StepikEntry } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";

export type Season = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  goals: SeasonGoal[];
  rewards: SeasonReward[];
  active: boolean;
  createdAt: string;
  completedAt?: string;
};

export type SeasonGoal = {
  id: string;
  title: string;
  type: "codingXp" | "languageXp" | "tasks" | "activeDays" | "pomodoro" | "notes" | "topicXp" | "manualStudy";
  target: number;
  progress: number;
  language?: string;
  topic?: string;
  completed: boolean;
};

export type SeasonReward = {
  id: string;
  level?: number;
  title: string;
  type: "item" | "theme" | "badge" | "title" | "cosmetic" | "adventureXp";
  unlocked: boolean;
  unlockedAt?: string;
  itemId?: string;
  themeId?: string;
};

type SeasonsFile = {
  version: 1;
  seasons: Season[];
};

const fileName = "codefire-seasons.json";

function todayIso() {
  return new Date().toISOString();
}

function normalizeGoal(goal: Partial<SeasonGoal>, fallbackId: string): SeasonGoal {
  const target = Math.max(1, Math.round(Number(goal.target) || 1));
  const progress = Math.max(0, Math.round(Number(goal.progress) || 0));

  return {
    id: normalizeText(goal.id, 80) || fallbackId,
    title: normalizeText(goal.title, 140) || "Season goal",
    type: goal.type ?? "codingXp",
    target,
    progress: Math.min(progress, target),
    language: normalizeText(goal.language, 60) || undefined,
    topic: normalizeText(goal.topic, 80) || undefined,
    completed: Boolean(goal.completed) || progress >= target,
  };
}

function normalizeReward(reward: Partial<SeasonReward>, fallbackId: string): SeasonReward {
  return {
    id: normalizeText(reward.id, 80) || fallbackId,
    level: reward.level ? Math.max(1, Math.round(Number(reward.level))) : undefined,
    title: normalizeText(reward.title, 140) || "Season reward",
    type: reward.type ?? "cosmetic",
    unlocked: Boolean(reward.unlocked),
    unlockedAt: reward.unlockedAt,
    itemId: normalizeText(reward.itemId, 80) || undefined,
    themeId: normalizeText(reward.themeId, 80) || undefined,
  };
}

function normalizeSeason(input: Partial<Season>, fallback?: Season): Season {
  const now = todayIso();
  const startDate = input.startDate ?? fallback?.startDate ?? getLocalDateKey();
  const endDate = input.endDate ?? fallback?.endDate ?? format(addDays(new Date(`${startDate}T00:00:00`), 55), "yyyy-MM-dd");
  const goals = (input.goals?.length ? input.goals : fallback?.goals ?? []).map((goal, index) =>
    normalizeGoal(goal, `goal-${index + 1}`),
  );
  const rewards = (input.rewards?.length ? input.rewards : fallback?.rewards ?? []).map((reward, index) =>
    normalizeReward(reward, `reward-${index + 1}`),
  );

  return {
    id: normalizeText(input.id, 100) || fallback?.id || `season-${Date.now()}`,
    title: normalizeText(input.title, 160) || fallback?.title || "Learning Season",
    description: normalizeText(input.description, 400) || fallback?.description,
    startDate,
    endDate,
    active: input.active ?? fallback?.active ?? true,
    createdAt: input.createdAt ?? fallback?.createdAt ?? now,
    completedAt: input.completedAt ?? fallback?.completedAt,
    goals,
    rewards,
  };
}

function defaultSeason(todayDate: string): Season {
  const startDate = `${todayDate.slice(0, 7)}-01`;
  const endDate = format(addDays(new Date(`${startDate}T00:00:00`), 55), "yyyy-MM-dd");

  return normalizeSeason({
    id: "season-1-python-foundation",
    title: "Season 1: Python Foundation",
    description: "A local CodeFire learning season for Python, rhythm, and study tasks.",
    startDate,
    endDate,
    active: true,
    goals: [
      { id: "coding-3000", title: "3000 real Coding XP", type: "codingXp", target: 3000, progress: 0, completed: false },
      { id: "python-1200", title: "1200 Python XP", type: "languageXp", target: 1200, progress: 0, language: "Python", completed: false },
      { id: "tasks-30", title: "30 study tasks", type: "tasks", target: 30, progress: 0, completed: false },
      { id: "active-24", title: "24 active coding days", type: "activeDays", target: 24, progress: 0, completed: false },
      { id: "pomodoro-20", title: "20 Pomodoro focus sessions", type: "pomodoro", target: 20, progress: 0, completed: false },
      { id: "topic-dicts-500", title: "500 topic XP: Dictionaries", type: "topicXp", target: 500, progress: 0, topic: "Dictionaries", completed: false },
    ],
    rewards: [
      { id: "season-title-spark", level: 1, title: "Season Spark", type: "title", unlocked: false },
      { id: "season-frame-profile", level: 3, title: "Profile Frame", type: "cosmetic", unlocked: false },
      { id: "season-item-python-core", level: 5, title: "Python Charm", type: "item", itemId: "python-core", unlocked: false },
      { id: "season-theme-python-green", level: 10, title: "Python Green Theme", type: "theme", themeId: "python-green", unlocked: false },
      { id: "season-badge-foundation", level: 15, title: "Foundation Medal", type: "badge", unlocked: false },
      { id: "season-title-clear", level: 20, title: "Foundation Clear", type: "title", unlocked: false },
    ],
  });
}

async function readSeasonsFile(todayDate = getLocalDateKey()): Promise<SeasonsFile> {
  const fallback: SeasonsFile = { version: 1, seasons: [defaultSeason(todayDate)] };
  const data = await readJsonStore<Partial<SeasonsFile>>(fileName, fallback);

  if (!Array.isArray(data.seasons) || data.seasons.length === 0) {
    await writeJsonStore<SeasonsFile>(fileName, fallback);
    return fallback;
  }

  const seasons = data.seasons.map((season) => normalizeSeason(season));

  return {
    version: 1,
    seasons,
  };
}

async function writeSeasons(seasons: Season[]) {
  await writeJsonStore<SeasonsFile>(fileName, { version: 1, seasons });
}

export async function getSeasons(todayDate = getLocalDateKey()) {
  const data = await readSeasonsFile(todayDate);
  return data.seasons;
}

export async function getActiveSeason(todayDate = getLocalDateKey()) {
  const seasons = await getSeasons(todayDate);
  return seasons.find((season) => season.active && todayDate >= season.startDate && todayDate <= season.endDate)
    ?? seasons.find((season) => season.active)
    ?? null;
}

export async function createSeason(input: Partial<Season>) {
  const data = await readSeasonsFile();
  const season = normalizeSeason(input);
  const seasons = season.active
    ? data.seasons.map((item) => ({ ...item, active: false })).concat(season)
    : data.seasons.concat(season);

  await writeSeasons(seasons);
  return season;
}

export async function updateSeason(input: Partial<Season> & { id: string }) {
  const data = await readSeasonsFile();
  const existing = data.seasons.find((season) => season.id === input.id);
  const season = normalizeSeason(input, existing);
  const seasons = data.seasons.map((item) => (item.id === season.id ? season : item));

  await writeSeasons(seasons);
  return season;
}

export async function completeSeason(id: string) {
  const data = await readSeasonsFile();
  const completedAt = todayIso();
  const seasons = data.seasons.map((season) =>
    season.id === id ? { ...season, active: false, completedAt } : season,
  );
  const season = seasons.find((item) => item.id === id) ?? null;

  await writeSeasons(seasons);
  return season;
}

export async function saveSeason(season: Season) {
  const data = await readSeasonsFile();
  const normalized = normalizeSeason(season);
  const exists = data.seasons.some((item) => item.id === normalized.id);
  const seasons = exists
    ? data.seasons.map((item) => (item.id === normalized.id ? normalized : item))
    : data.seasons.concat(normalized);

  await writeSeasons(seasons);
  return normalized;
}

function seasonDays(days: DailyCodingActivity[], season: Season) {
  return days.filter((day) => day.date >= season.startDate && day.date <= season.endDate);
}

export function calculateSeasonXp({
  goals,
  completedRewardCount = 0,
}: {
  goals: SeasonGoal[];
  completedRewardCount?: number;
}) {
  const goalXp = goals.reduce((sum, goal) => {
    const ratio = Math.min(1, goal.progress / Math.max(1, goal.target));
    return sum + Math.round(ratio * 120);
  }, 0);

  return goalXp + completedRewardCount * 40;
}

export function unlockSeasonRewards(rewards: SeasonReward[], seasonXp: number) {
  const level = Math.floor(Math.sqrt(Math.max(0, seasonXp) / 120)) + 1;
  const now = todayIso();

  return rewards.map((reward) => {
    const requiredLevel = reward.level ?? 1;
    const unlocked = reward.unlocked || level >= requiredLevel;

    return {
      ...reward,
      unlocked,
      unlockedAt: unlocked ? reward.unlockedAt ?? now : undefined,
    };
  });
}

export function calculateSeasonProgress({
  season,
  days,
  tasks,
  stepikEntries,
  topics,
  pomodoroStats,
  noteCount = 0,
  manualStudyMinutes = 0,
}: {
  season: Season;
  days: DailyCodingActivity[];
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  topics: TopicProgress[];
  pomodoroStats?: PomodoroStats;
  noteCount?: number;
  manualStudyMinutes?: number;
}) {
  const scopedDays = seasonDays(days, season);

  return season.goals.map((goal) => {
    let progress = goal.progress;

    if (goal.type === "codingXp") {
      progress = scopedDays.reduce((sum, day) => sum + day.xp, 0);
    } else if (goal.type === "languageXp") {
      progress = scopedDays.reduce(
        (sum, day) =>
          sum +
          (day.languages.find((language) => language.name.toLowerCase() === (goal.language ?? "").toLowerCase())?.xp ?? 0),
        0,
      );
    } else if (goal.type === "tasks") {
      progress =
        tasks.filter((task) => task.status === "solved" && task.date >= season.startDate && task.date <= season.endDate).length +
        stepikEntries
          .filter((entry) => entry.date >= season.startDate && entry.date <= season.endDate)
          .reduce((sum, entry) => sum + entry.tasksSolved, 0);
    } else if (goal.type === "activeDays") {
      progress = scopedDays.filter((day) => day.xp > 0).length;
    } else if (goal.type === "pomodoro") {
      progress = pomodoroStats?.totalCompletedFocusSessions ?? 0;
    } else if (goal.type === "notes") {
      progress = noteCount;
    } else if (goal.type === "manualStudy") {
      progress = manualStudyMinutes;
    } else if (goal.type === "topicXp") {
      progress = topics.find((topic) => topic.name.toLowerCase() === (goal.topic ?? "").toLowerCase())?.xp ?? 0;
    }

    return {
      ...goal,
      progress: Math.min(progress, goal.target),
      completed: progress >= goal.target,
    };
  });
}

export function hydrateSeasonProgress({
  season,
  days,
  tasks,
  stepikEntries,
  topics,
  pomodoroStats,
  seasonXp,
  noteCount = 0,
  manualStudyMinutes = 0,
}: {
  season: Season;
  days: DailyCodingActivity[];
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  topics: TopicProgress[];
  pomodoroStats?: PomodoroStats;
  seasonXp: number;
  noteCount?: number;
  manualStudyMinutes?: number;
}): Season {
  const goals = calculateSeasonProgress({
    season,
    days,
    tasks,
    stepikEntries,
    topics,
    pomodoroStats,
    noteCount,
    manualStudyMinutes,
  });

  return {
    ...season,
    goals,
    rewards: unlockSeasonRewards(season.rewards, seasonXp),
  };
}

export function getSeasonDaysLeft(season: Season, todayDate: string) {
  return Math.max(0, differenceInCalendarDays(new Date(`${season.endDate}T00:00:00`), new Date(`${todayDate}T00:00:00`)));
}
