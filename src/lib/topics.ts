import { clampNumber, normalizeText, readJsonStore, writeJsonStore } from "@/lib/local-json-store.server";
import type { DailyNote } from "@/lib/daily-notes";
import type { ManualStudyEntry } from "@/lib/manual-study";
import type { StepikEntry } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";

export type TopicProgress = {
  id: string;
  name: string;
  category: "python" | "backend" | "tools" | "algorithms" | "other";
  xp: number;
  level: number;
  confidence: 1 | 2 | 3 | 4 | 5;
  solvedTasks: number;
  notesCount: number;
  lastPracticedAt?: string;
  reviewRecommended: boolean;
  reviewHint: string;
};

type TopicOverridesFile = {
  version: 1;
  confidence: Record<string, 1 | 2 | 3 | 4 | 5>;
};

const fileName = "codefire-topics.json";
const dayInMs = 24 * 60 * 60 * 1000;

export const defaultTopics: Array<Pick<TopicProgress, "id" | "name" | "category">> = [
  { id: "dictionaries", name: "Словари", category: "python" },
  { id: "lists", name: "Списки", category: "python" },
  { id: "loops", name: "Циклы", category: "python" },
  { id: "functions", name: "Функции", category: "python" },
  { id: "files", name: "Файлы", category: "python" },
  { id: "oop", name: "ООП", category: "python" },
  { id: "exceptions", name: "Исключения", category: "python" },
  { id: "git", name: "Git", category: "tools" },
  { id: "linux", name: "Linux", category: "tools" },
  { id: "http", name: "HTTP", category: "backend" },
  { id: "fastapi", name: "FastAPI", category: "backend" },
  { id: "sql", name: "SQL", category: "backend" },
  { id: "docker", name: "Docker", category: "tools" },
  { id: "algorithms", name: "Algorithms", category: "algorithms" },
];

function topicId(value: string) {
  const normalized = value.toLowerCase().trim();
  const known = defaultTopics.find((topic) => topic.name.toLowerCase() === normalized || topic.id === normalized);

  return (known?.id ?? normalized.replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "")) || "other";
}

function topicLevel(xp: number) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 80)) + 1;
}

async function readTopicOverrides(): Promise<TopicOverridesFile> {
  const data = await readJsonStore<Partial<TopicOverridesFile>>(fileName, { version: 1, confidence: {} });

  return {
    version: 1,
    confidence: data.confidence ?? {},
  };
}

export async function saveTopicConfidence(topicIdValue: string, confidence: number) {
  const data = await readTopicOverrides();
  const id = normalizeText(topicIdValue, 80);

  data.confidence[id] = clampNumber(confidence, 1, 5, 3) as TopicProgress["confidence"];
  await writeJsonStore<TopicOverridesFile>(fileName, data);

  return data.confidence[id];
}

export async function getTopicTracker({
  tasks,
  stepikEntries,
  manualStudy,
  notes,
  todayDate,
}: {
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  manualStudy: ManualStudyEntry[];
  notes: DailyNote[];
  todayDate: string;
}): Promise<TopicProgress[]> {
  const overrides = await readTopicOverrides();
  const map = new Map<string, TopicProgress>();

  function ensureTopic(name: string, category: TopicProgress["category"] = "other") {
    const id = topicId(name);
    const known = defaultTopics.find((topic) => topic.id === id);
    const existing = map.get(id);

    if (existing) return existing;

    const topic: TopicProgress = {
      id,
      name: known?.name ?? name,
      category: known?.category ?? category,
      xp: 0,
      level: 1,
      confidence: overrides.confidence[id] ?? 3,
      solvedTasks: 0,
      notesCount: 0,
      reviewRecommended: false,
      reviewHint: "Практики пока мало.",
    };

    map.set(id, topic);
    return topic;
  }

  defaultTopics.forEach((topic) => ensureTopic(topic.name, topic.category));

  for (const task of tasks) {
    const topic = ensureTopic(task.topic);
    const solvedMultiplier =
      task.status === "solved" || task.status === "completed"
        ? 30
        : task.status === "almost"
          ? 18
          : task.status === "reviewed"
            ? 12
            : task.status === "failed"
              ? 5
              : 0;

    topic.xp += solvedMultiplier * task.difficulty;
    topic.solvedTasks += task.status === "solved" || task.status === "completed" ? 1 : 0;
    topic.lastPracticedAt = topic.lastPracticedAt && topic.lastPracticedAt > task.date ? topic.lastPracticedAt : task.date;
  }

  for (const entry of stepikEntries) {
    const topic = ensureTopic(entry.topic, "algorithms");

    topic.xp += entry.tasksSolved * entry.difficulty * 16;
    topic.solvedTasks += entry.tasksSolved;
    topic.lastPracticedAt = topic.lastPracticedAt && topic.lastPracticedAt > entry.date ? topic.lastPracticedAt : entry.date;
  }

  for (const entry of manualStudy) {
    if (!entry.topic) continue;
    const topic = ensureTopic(entry.topic);

    topic.xp += Math.round(entry.minutes * 0.7);
    topic.lastPracticedAt = topic.lastPracticedAt && topic.lastPracticedAt > entry.date ? topic.lastPracticedAt : entry.date;
  }

  for (const note of notes) {
    const noteText = [note.beforeText, note.afterText, note.text].filter(Boolean).join(" ").toLowerCase();
    const matchedTopic = defaultTopics.find((topic) => noteText.includes(topic.name.toLowerCase()));

    if (!matchedTopic) continue;
    const topic = ensureTopic(matchedTopic.name, matchedTopic.category);
    topic.notesCount += 1;
  }

  const todayMs = Date.parse(`${todayDate}T00:00:00Z`);

  return [...map.values()]
    .map((topic) => {
      const daysSincePractice = topic.lastPracticedAt
        ? Math.floor((todayMs - Date.parse(`${topic.lastPracticedAt}T00:00:00Z`)) / dayInMs)
        : null;
      const reviewRecommended = daysSincePractice === null ? false : daysSincePractice >= 7 || topic.confidence <= 2;

      return {
        ...topic,
        level: topicLevel(topic.xp),
        reviewRecommended,
        reviewHint:
          daysSincePractice === null
            ? "Ещё нет практики."
            : reviewRecommended
              ? `Повторить: ${daysSincePractice} дн. без практики.`
              : "Ритм темы свежий.",
      };
    })
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
}
