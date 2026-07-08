import type { ManualStudyEntry } from "@/lib/manual-study";
import type { StepikEntry } from "@/lib/stepik";
import { isLegacyStudyStatus, isStudyTaskFinished, type StudyTask } from "@/lib/study-tasks";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";

export type StudyTaskProgress = {
  taskId: string;
  current: number;
  target: number;
  percent: number;
  isCompleted: boolean;
  label: string;
};

export type StudyProgressContext = {
  days: DailyCodingActivity[];
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  manualStudy: ManualStudyEntry[];
  topics: TopicProgress[];
  todayDate: string;
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

function taskTopic(task: StudyTask) {
  return (task.customTopic || task.topic || "").trim();
}

function sameText(a?: string, b?: string) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function topicMatches(value: string | undefined, expected: string | undefined) {
  if (!expected || expected === "Other") return true;
  return sameText(value, expected);
}

function languageMatches(value: string | undefined, expected: string | undefined) {
  if (!expected || expected === "Other") return true;
  return sameText(value, expected);
}

function inTaskPeriod(date: string, task: StudyTask, todayDate: string) {
  if (task.period === "none") return true;
  if (task.period === "today") return date === todayDate;
  if (task.period === "week") return date >= weekStart(todayDate) && date <= todayDate;
  if (task.period === "custom") {
    const start = task.date || task.createdAt.slice(0, 10);
    const end = task.deadline && task.deadline < todayDate ? task.deadline : todayDate;

    return date >= start && date <= end;
  }

  return true;
}

function scopedDays(task: StudyTask, context: StudyProgressContext) {
  return context.days.filter((day) => inTaskPeriod(day.date, task, context.todayDate));
}

function codingMinutes(task: StudyTask, context: StudyProgressContext) {
  return Math.floor(
    scopedDays(task, context).reduce((sum, day) => {
      if (!task.language) return sum + day.codingSeconds;

      return (
        sum +
        (day.languages.find((language) => language.name.toLowerCase() === task.language?.toLowerCase())?.seconds ?? 0)
      );
    }, 0) / 60,
  );
}

function codingXp(task: StudyTask, context: StudyProgressContext) {
  return scopedDays(task, context).reduce((sum, day) => {
    if (!task.language) return sum + day.xp;

    return sum + (day.languages.find((language) => language.name.toLowerCase() === task.language?.toLowerCase())?.xp ?? 0);
  }, 0);
}

function legacyTaskProgress(task: StudyTask, context: StudyProgressContext) {
  if (isLegacyStudyStatus(task.status)) {
    return isStudyTaskFinished(task) || task.status === "almost" || task.status === "failed" ? task.target : 0;
  }

  return context.tasks
    .filter((entry) => entry.id !== task.id)
    .filter((entry) => isLegacyStudyStatus(entry.status) || entry.status === "completed")
    .filter((entry) => inTaskPeriod(entry.date, task, context.todayDate))
    .filter((entry) => topicMatches(entry.customTopic || entry.topic, taskTopic(task)))
    .length;
}

function stepikProgress(task: StudyTask, context: StudyProgressContext) {
  const topic = taskTopic(task);

  return context.stepikEntries
    .filter((entry) => inTaskPeriod(entry.date, task, context.todayDate))
    .filter((entry) => topicMatches(entry.topic, topic))
    .reduce((sum, entry) => sum + entry.tasksSolved, 0);
}

function manualStudyProgress(task: StudyTask, context: StudyProgressContext) {
  const topic = taskTopic(task);

  return context.manualStudy
    .filter((entry) => inTaskPeriod(entry.date, task, context.todayDate))
    .filter((entry) => topicMatches(entry.topic, topic))
    .filter((entry) => languageMatches(entry.language, task.language))
    .reduce((sum, entry) => sum + entry.minutes, 0);
}

function topicXpProgress(task: StudyTask, context: StudyProgressContext) {
  const topic = taskTopic(task);
  const match = context.topics.find((entry) => sameText(entry.id, topic) || sameText(entry.name, topic));

  return match?.xp ?? 0;
}

function formatUnit(value: number, unit: StudyTask["unit"]) {
  if (unit === "minutes") return `${value} min`;
  if (unit === "xp") return `${value} XP`;
  if (unit === "sessions") return `${value} sessions`;
  return `${value} tasks`;
}

export function calculateStudyTaskProgress(task: StudyTask, context: StudyProgressContext): StudyTaskProgress {
  const manualProgress = task.manualProgress ?? 0;
  let current = manualProgress;

  if (task.type === "codingTime") current = codingMinutes(task, context);
  if (task.type === "codingXp") current = codingXp(task, context);
  if (task.type === "tasksCount") current = manualProgress + legacyTaskProgress(task, context);
  if (task.type === "stepikTasks") current = manualProgress + stepikProgress(task, context);
  if (task.type === "manualStudy") current = manualProgress + manualStudyProgress(task, context);
  if (task.type === "topicXp") current = manualProgress + topicXpProgress(task, context);

  if (isStudyTaskFinished(task)) {
    current = Math.max(current, task.target);
  }

  const percent = Math.min(100, Math.max(0, (current / task.target) * 100));
  const isCompleted = task.status === "archived" ? false : current >= task.target || isStudyTaskFinished(task);

  return {
    taskId: task.id,
    current,
    target: task.target,
    percent,
    isCompleted,
    label: `${formatUnit(current, task.unit)} / ${formatUnit(task.target, task.unit)}`,
  };
}

export function calculateStudyTaskProgressList(context: StudyProgressContext) {
  return context.tasks.map((task) => calculateStudyTaskProgress(task, context));
}
