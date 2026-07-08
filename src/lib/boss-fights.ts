import { randomUUID } from "node:crypto";
import {
  getLocalDateKey,
  isDateKey,
  normalizeText,
  readJsonStore,
  writeJsonStore,
} from "@/lib/local-json-store.server";
import type { DailyNote } from "@/lib/daily-notes";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { StepikEntry } from "@/lib/stepik";
import { hasDailyNoteContent } from "@/lib/daily-notes";
import type { StudyTask } from "@/lib/study-tasks";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";

export type BossFight = {
  id: string;
  presetId?: string;
  title: string;
  description: string;
  topic: string;
  difficulty: "easy" | "normal" | "hard" | "epic" | "legendary";
  requirements: BossRequirement[];
  reward: BossReward;
  completed: boolean;
  rewardClaimed?: boolean;
  createdAt: string;
  completedAt?: string;
};

export type BossRequirement = {
  id: string;
  type:
    | "codingMinutes"
    | "languageMinutes"
    | "tasksSolved"
    | "pomodoroSessions"
    | "noteWritten"
    | "topicXp"
    | "manual";
  label: string;
  target: number;
  progress: number;
  completed: boolean;
  language?: string;
  topic?: string;
};

export type BossReward = {
  adventureXp: number;
  itemId?: string;
  achievementId?: string;
  title?: string;
};

export type BossFightPreset = Omit<BossFight, "id" | "requirements" | "completed" | "createdAt"> & {
  id: string;
  requirements: Array<Omit<BossRequirement, "progress" | "completed">>;
};

type BossFightFile = {
  version: 1;
  bosses: BossFight[];
};

export type BossFightContext = {
  days: DailyCodingActivity[];
  today: DailyCodingActivity;
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  topics: TopicProgress[];
  notes: DailyNote[];
  pomodoroStats?: PomodoroStats;
};

const fileName = "codefire-boss-fights.json";

export const bossPresets: BossFightPreset[] = [
  {
    id: "dictionaries-lord",
    presetId: "dictionaries-lord",
    title: "Повелитель словарей",
    description: "Закрепить словари через код, задачи и заметку после практики.",
    topic: "Словари",
    difficulty: "normal",
    requirements: [
      { id: "python-120", type: "languageMinutes", label: "120 минут Python", target: 120, language: "Python" },
      { id: "dict-tasks-3", type: "tasksSolved", label: "3 задачи на словари", target: 3, topic: "Словари" },
      { id: "note-1", type: "noteWritten", label: "1 заметка после практики", target: 1 },
    ],
    reward: { adventureXp: 300, itemId: "book-dictionaries", title: "Укротитель словарей" },
  },
  {
    id: "api-first",
    presetId: "api-first",
    title: "Первый API",
    description: "Первые шаги в backend: HTTP, заметки и фокус-сессии.",
    topic: "HTTP",
    difficulty: "hard",
    requirements: [
      { id: "coding-180", type: "codingMinutes", label: "180 минут кодинга", target: 180 },
      { id: "http-topic-160", type: "topicXp", label: "160 XP темы HTTP", target: 160, topic: "HTTP" },
      { id: "pomodoro-2", type: "pomodoroSessions", label: "2 Pomodoro", target: 2 },
    ],
    reward: { adventureXp: 450, itemId: "amulet-spark", title: "Первый API" },
  },
  {
    id: "sql-dungeon",
    presetId: "sql-dungeon",
    title: "SQL Dungeon",
    description: "Подземелье запросов, таблиц и учебных задач.",
    topic: "SQL",
    difficulty: "epic",
    requirements: [
      { id: "sql-topic-300", type: "topicXp", label: "300 XP темы SQL", target: 300, topic: "SQL" },
      { id: "sql-tasks-5", type: "tasksSolved", label: "5 задач SQL", target: 5, topic: "SQL" },
      { id: "coding-240", type: "codingMinutes", label: "240 минут кодинга", target: 240 },
    ],
    reward: { adventureXp: 700, itemId: "shield-stability", title: "SQL Delver" },
  },
];

function emptyRequirement(requirement: BossFightPreset["requirements"][number]): BossRequirement {
  return {
    ...requirement,
    progress: 0,
    completed: false,
  };
}

function sanitizeBoss(input: Partial<BossFight>): BossFight {
  return {
    id: normalizeText(input.id, 80) || randomUUID(),
    presetId: normalizeText(input.presetId, 80) || undefined,
    title: normalizeText(input.title, 120) || "Custom Boss",
    description: normalizeText(input.description, 400) || "Личная учебная цель.",
    topic: normalizeText(input.topic, 64) || "Other",
    difficulty: input.difficulty ?? "normal",
    requirements: Array.isArray(input.requirements)
      ? input.requirements.map((requirement) => ({
          id: normalizeText(requirement.id, 80) || randomUUID(),
          type: requirement.type ?? "manual",
          label: normalizeText(requirement.label, 140) || "Manual requirement",
          target: Math.max(1, Math.round(Number(requirement.target) || 1)),
          progress: Math.max(0, Math.round(Number(requirement.progress) || 0)),
          completed: Boolean(requirement.completed),
          language: normalizeText(requirement.language, 40) || undefined,
          topic: normalizeText(requirement.topic, 64) || undefined,
        }))
      : [],
    reward: {
      adventureXp: Math.max(0, Math.round(Number(input.reward?.adventureXp) || 100)),
      itemId: normalizeText(input.reward?.itemId, 80) || undefined,
      achievementId: normalizeText(input.reward?.achievementId, 80) || undefined,
      title: normalizeText(input.reward?.title, 80) || undefined,
    },
    completed: Boolean(input.completed),
    rewardClaimed: Boolean(input.rewardClaimed),
    createdAt: typeof input.createdAt === "string" && input.createdAt ? input.createdAt : new Date().toISOString(),
    completedAt: typeof input.completedAt === "string" && input.completedAt ? input.completedAt : undefined,
  };
}

async function readBossFile(): Promise<BossFightFile> {
  const data = await readJsonStore<Partial<BossFightFile>>(fileName, { version: 1, bosses: [] });

  return {
    version: 1,
    bosses: Array.isArray(data.bosses) ? data.bosses.map(sanitizeBoss) : [],
  };
}

async function writeBossFile(bosses: BossFight[]) {
  await writeJsonStore<BossFightFile>(fileName, {
    version: 1,
    bosses: bosses.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function getStoredBossFights() {
  const data = await readBossFile();

  return data.bosses;
}

export async function createBossFromPreset(presetId: string) {
  const data = await readBossFile();
  const preset = bossPresets.find((boss) => boss.id === presetId) ?? bossPresets[0];
  const existingActive = data.bosses.find((boss) => boss.presetId === preset.id && !boss.completed);

  if (existingActive) {
    return existingActive;
  }

  const boss: BossFight = {
    id: randomUUID(),
    presetId: preset.id,
    title: preset.title,
    description: preset.description,
    topic: preset.topic,
    difficulty: preset.difficulty,
    requirements: preset.requirements.map(emptyRequirement),
    reward: preset.reward,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  await writeBossFile(data.bosses.concat(boss));

  return boss;
}

export async function saveCustomBoss(input: Partial<BossFight>) {
  const data = await readBossFile();
  const boss = sanitizeBoss(input);
  const bosses = data.bosses.filter((item) => item.id !== boss.id).concat(boss);

  await writeBossFile(bosses);

  return boss;
}

function requirementProgress(requirement: BossRequirement, context: BossFightContext) {
  if (requirement.type === "codingMinutes") {
    return Math.floor(context.days.reduce((sum, day) => sum + day.codingSeconds, 0) / 60);
  }

  if (requirement.type === "languageMinutes") {
    return Math.floor(
      context.days.reduce(
        (sum, day) =>
          sum +
          (day.languages.find(
            (language) => language.name.toLowerCase() === (requirement.language ?? "").toLowerCase(),
          )?.seconds ?? 0),
        0,
      ) / 60,
    );
  }

  if (requirement.type === "tasksSolved") {
    return (
      context.tasks.filter(
        (task) =>
          task.status === "solved" &&
          (!requirement.topic || task.topic.toLowerCase() === requirement.topic.toLowerCase()),
      ).length +
      context.stepikEntries
        .filter((entry) => !requirement.topic || entry.topic.toLowerCase() === requirement.topic.toLowerCase())
        .reduce((sum, entry) => sum + entry.tasksSolved, 0)
    );
  }

  if (requirement.type === "pomodoroSessions") {
    return context.pomodoroStats?.todayCompletedFocusSessions ?? 0;
  }

  if (requirement.type === "noteWritten") {
    return context.notes.some((note) => isDateKey(note.date) && hasDailyNoteContent(note)) ? 1 : 0;
  }

  if (requirement.type === "topicXp") {
    return context.topics.find((topic) => topic.name.toLowerCase() === (requirement.topic ?? "").toLowerCase())?.xp ?? 0;
  }

  return requirement.completed ? requirement.target : requirement.progress;
}

export function hydrateBossFightProgress(boss: BossFight, context: BossFightContext): BossFight {
  const requirements = boss.requirements.map((requirement) => {
    const progress = Math.min(requirementProgress(requirement, context), requirement.target);

    return {
      ...requirement,
      progress,
      completed: progress >= requirement.target,
    };
  });
  const completed = boss.completed || requirements.every((requirement) => requirement.completed);

  return {
    ...boss,
    requirements,
    completed,
    completedAt: completed ? boss.completedAt ?? `${getLocalDateKey()}T00:00:00.000Z` : undefined,
  };
}

export async function getBossFights(context: BossFightContext) {
  const bosses = await getStoredBossFights();

  return bosses.map((boss) => hydrateBossFightProgress(boss, context));
}

export async function completeBossFight(id: string, context: BossFightContext) {
  const data = await readBossFile();
  const bosses = data.bosses.map((boss) => {
    if (boss.id !== id) return boss;
    const hydrated = hydrateBossFightProgress(boss, context);

    if (!hydrated.requirements.every((requirement) => requirement.completed)) {
      return hydrated;
    }

    return {
      ...hydrated,
      completed: true,
      completedAt: hydrated.completedAt ?? new Date().toISOString(),
      rewardClaimed: true,
    };
  });

  await writeBossFile(bosses);

  return bosses.find((boss) => boss.id === id) ?? null;
}

export async function claimBossFightReward(id: string): Promise<BossFight | null> {
  const data = await readBossFile();
  let claimedBoss: BossFight | null = null;
  const bosses = data.bosses.map((boss) => {
    if (boss.id !== id) return boss;

    claimedBoss = {
      ...boss,
      completed: true,
      rewardClaimed: true,
      completedAt: boss.completedAt ?? new Date().toISOString(),
    };

    return claimedBoss;
  });

  await writeBossFile(bosses);

  return claimedBoss;
}
