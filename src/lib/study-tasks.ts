import { getLocalDateKey } from "@/lib/local-json-store";

export type StudyTaskType = "codingTime" | "codingXp" | "tasksCount" | "stepikTasks" | "manualStudy" | "topicXp";
export type StudyTaskUnit = "minutes" | "xp" | "tasks" | "sessions";
export type StudyTaskPeriod = "today" | "week" | "custom" | "none";
export type StudyTaskDifficulty = "easy" | "normal" | "hard" | "veryHard";
export type StudyTaskSource =
  | "wakatime"
  | "stepik"
  | "manual"
  | "mixed"
  | "Stepik"
  | "Codeforces"
  | "Book"
  | "Custom";
export type StudyTaskStatus = "active" | "completed" | "paused" | "archived" | "solved" | "almost" | "failed" | "reviewed";

export type StudyTask = {
  id: string;
  date: string;
  source: StudyTaskSource;
  topic: string;
  title?: string;
  description?: string;
  language?: string;
  customTopic?: string;
  type: StudyTaskType;
  target: number;
  unit: StudyTaskUnit;
  period: StudyTaskPeriod;
  deadline?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  difficultyLabel: StudyTaskDifficulty;
  status: StudyTaskStatus;
  manualProgress?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
};

export type StudyTaskStats = {
  todaySolved: number;
  weekSolved: number;
  monthSolved: number;
  todayTasks: number;
  weekTasks: number;
  monthTasks: number;
  active: number;
  completed: number;
  paused: number;
  archived: number;
  averageDifficulty: number;
  topTopic?: string;
  solved: number;
  almost: number;
  failed: number;
  reviewed: number;
  studyXp: number;
  adventureXp: number;
};

function dateKeyToUtcMs(dateKey: string) {
  const [year = 0, month = 1, day = 1] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDays(dateKey: string, days: number) {
  return new Date(dateKeyToUtcMs(dateKey) + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function weekStart(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();

  return addDays(dateKey, day === 0 ? -6 : 1 - day);
}

export function isLegacyStudyStatus(status: StudyTaskStatus) {
  return status === "solved" || status === "almost" || status === "failed" || status === "reviewed";
}

export function isStudyTaskFinished(task: Pick<StudyTask, "status">) {
  return task.status === "completed" || task.status === "solved" || task.status === "reviewed";
}

export function studyTaskStudyXp(task: Pick<StudyTask, "status">) {
  if (task.status === "active" || task.status === "paused" || task.status === "archived") return 0;
  if (task.status === "failed") return 5;
  if (task.status === "reviewed") return 10;
  if (task.status === "almost") return 15;
  return 30;
}

export function studyTaskAdventureXp(task: Pick<StudyTask, "status">) {
  return studyTaskStudyXp(task);
}

export function calculateStudyTaskStats(tasks: StudyTask[], todayDate = getLocalDateKey()): StudyTaskStats {
  const monthStart = todayDate.slice(0, 7);
  const weekStartKey = weekStart(todayDate);
  const visibleTasks = tasks.filter((task) => task.status !== "archived");
  const todayTasks = visibleTasks.filter((task) => task.date === todayDate);
  const weekTasks = visibleTasks.filter((task) => task.date >= weekStartKey && task.date <= todayDate);
  const monthTasks = visibleTasks.filter((task) => task.date.startsWith(monthStart));
  const solved = tasks.filter((task) => task.status === "solved" || task.status === "completed");
  const topicCounts = visibleTasks.reduce<Record<string, number>>((counts, task) => {
    counts[task.customTopic || task.topic] = (counts[task.customTopic || task.topic] ?? 0) + 1;
    return counts;
  }, {});
  const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const studyXp = tasks.reduce((sum, task) => sum + studyTaskStudyXp(task), 0);

  return {
    todaySolved: solved.filter((task) => task.date === todayDate || task.completedAt?.startsWith(todayDate)).length,
    weekSolved: solved.filter((task) => (task.completedAt?.slice(0, 10) ?? task.date) >= weekStartKey && (task.completedAt?.slice(0, 10) ?? task.date) <= todayDate).length,
    monthSolved: solved.filter((task) => (task.completedAt?.slice(0, 10) ?? task.date).startsWith(monthStart)).length,
    todayTasks: todayTasks.length,
    weekTasks: weekTasks.length,
    monthTasks: monthTasks.length,
    active: visibleTasks.filter((task) => task.status === "active").length,
    completed: solved.length,
    paused: visibleTasks.filter((task) => task.status === "paused").length,
    archived: tasks.filter((task) => task.status === "archived").length,
    averageDifficulty: visibleTasks.length
      ? Math.round((visibleTasks.reduce((sum, task) => sum + task.difficulty, 0) / visibleTasks.length) * 10) / 10
      : 0,
    topTopic,
    solved: tasks.filter((task) => task.status === "solved").length,
    almost: tasks.filter((task) => task.status === "almost").length,
    failed: tasks.filter((task) => task.status === "failed").length,
    reviewed: tasks.filter((task) => task.status === "reviewed").length,
    studyXp,
    adventureXp: studyXp,
  };
}

export const getStudyTaskStats = calculateStudyTaskStats;
