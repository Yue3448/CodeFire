"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Archive,
  BookOpen,
  Check,
  Clock,
  Edit3,
  Flame,
  GraduationCap,
  ListChecks,
  Pause,
  Play,
  Plus,
  Save,
  Target,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, ProgressBar, useRemoteData } from "@/components/pages/page-kit";
import type { ManualStudyEntry } from "@/lib/manual-study";
import { calculateStudyTaskProgressList, type StudyTaskProgress } from "@/lib/study-progress";
import type {
  StudyTask,
  StudyTaskDifficulty,
  StudyTaskPeriod,
  StudyTaskSource,
  StudyTaskType,
  StudyTaskUnit,
} from "@/lib/study-tasks";
import type { StepikEntry } from "@/lib/stepik";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";
import type { LearningRpg } from "@/lib/learning-rpg";
import { cn } from "@/lib/utils";

type StudyPayload = {
  todayDate: string;
  codingDays: DailyCodingActivity[];
  studyTasks: LearningRpg["studyTasks"] | null;
  taskProgress: StudyTaskProgress[];
  stepik: LearningRpg["stepik"] | null;
  manualStudy: LearningRpg["manualStudy"] | null;
  topics: LearningRpg["topics"];
  goals: LearningRpg["goals"] | null;
  weeklyJournal: LearningRpg["weeklyJournal"] | null;
};

type TaskDraft = {
  id?: string;
  title: string;
  type: StudyTaskType;
  language: string;
  topic: string;
  customTopic: string;
  target: string;
  unit: StudyTaskUnit;
  period: StudyTaskPeriod;
  deadline: string;
  difficultyLabel: StudyTaskDifficulty;
  source: Extract<StudyTaskSource, "wakatime" | "stepik" | "manual" | "mixed">;
  description: string;
};

type StepikDraft = {
  course: string;
  section: string;
  topic: string;
  tasksSolved: string;
  difficulty: string;
  date: string;
  comment: string;
};

type ManualDraft = {
  topic: string;
  language: string;
  minutes: string;
  description: string;
  difficulty: string;
  date: string;
};

const languages = ["", "Python", "TypeScript", "JavaScript", "SQL", "FastAPI", "Docker", "Git", "Linux", "Other"];
const topics = [
  "Algorithms",
  "Dictionaries",
  "Loops",
  "Functions",
  "OOP",
  "Exceptions",
  "Files",
  "Git",
  "Linux",
  "HTTP",
  "FastAPI",
  "SQL",
  "Docker",
  "Backend",
  "custom",
];
const taskTypes: Array<{ value: StudyTaskType; label: string }> = [
  { value: "codingTime", label: "Coding time" },
  { value: "codingXp", label: "Coding XP" },
  { value: "tasksCount", label: "Tasks count" },
  { value: "stepikTasks", label: "Stepik tasks" },
  { value: "manualStudy", label: "Manual study" },
  { value: "topicXp", label: "Topic XP" },
];
const units: StudyTaskUnit[] = ["minutes", "xp", "tasks", "sessions"];
const periods: Array<{ value: StudyTaskPeriod; label: string }> = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "custom", label: "Custom deadline" },
  { value: "none", label: "No deadline" },
];
const difficulties: Array<{ value: StudyTaskDifficulty; label: string }> = [
  { value: "easy", label: "Easy" },
  { value: "normal", label: "Normal" },
  { value: "hard", label: "Hard" },
  { value: "veryHard", label: "Very hard" },
];
const sources: Array<{ value: TaskDraft["source"]; label: string }> = [
  { value: "wakatime", label: "WakaTime" },
  { value: "stepik", label: "Stepik" },
  { value: "manual", label: "Manual" },
  { value: "mixed", label: "Mixed" },
];
const quickTemplates: Array<Pick<TaskDraft, "title" | "type" | "language" | "topic" | "target" | "unit" | "period" | "source" | "difficultyLabel">> = [
  { title: "30 min Python", type: "codingTime", language: "Python", topic: "Python", target: "30", unit: "minutes", period: "today", source: "wakatime", difficultyLabel: "easy" },
  { title: "90 min Python", type: "codingTime", language: "Python", topic: "Dictionaries", target: "90", unit: "minutes", period: "today", source: "wakatime", difficultyLabel: "normal" },
  { title: "3 Stepik tasks", type: "stepikTasks", language: "Python", topic: "Algorithms", target: "3", unit: "tasks", period: "week", source: "stepik", difficultyLabel: "normal" },
  { title: "1 Pomodoro study", type: "manualStudy", language: "", topic: "Backend", target: "1", unit: "sessions", period: "today", source: "manual", difficultyLabel: "easy" },
  { title: "60 min SQL", type: "codingTime", language: "SQL", topic: "SQL", target: "60", unit: "minutes", period: "week", source: "wakatime", difficultyLabel: "normal" },
  { title: "Git practice", type: "manualStudy", language: "Git", topic: "Git", target: "30", unit: "minutes", period: "today", source: "manual", difficultyLabel: "easy" },
  { title: "FastAPI practice", type: "codingTime", language: "FastAPI", topic: "FastAPI", target: "60", unit: "minutes", period: "week", source: "wakatime", difficultyLabel: "hard" },
];
const emptyStudyTasks: StudyTask[] = [];

function defaultTaskDraft(todayDate: string): TaskDraft {
  return {
    title: "",
    type: "codingTime",
    language: "Python",
    topic: "Dictionaries",
    customTopic: "",
    target: "90",
    unit: "minutes",
    period: "today",
    deadline: todayDate,
    difficultyLabel: "normal",
    source: "wakatime",
    description: "",
  };
}

function defaultStepikDraft(todayDate: string): StepikDraft {
  return { course: "", section: "", topic: "Algorithms", tasksSolved: "1", difficulty: "2", date: todayDate, comment: "" };
}

function defaultManualDraft(todayDate: string): ManualDraft {
  return { topic: "Git", language: "", minutes: "30", description: "", difficulty: "2", date: todayDate };
}

function weekStart(todayDate: string) {
  const date = new Date(`${todayDate}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date.toISOString().slice(0, 10);
}

function taskTopic(task: StudyTask) {
  return task.customTopic || task.topic || "Other";
}

function periodLabel(task: StudyTask) {
  if (task.period === "today") return "Today";
  if (task.period === "week") return "This week";
  if (task.period === "custom") return task.deadline ? `Due ${task.deadline}` : "Custom";
  return "No deadline";
}

function typeLabel(type: StudyTaskType) {
  return taskTypes.find((item) => item.value === type)?.label ?? type;
}

function progressMap(progress: StudyTaskProgress[]) {
  return new Map(progress.map((item) => [item.taskId, item]));
}

function calculateProgress(data: StudyPayload, tasks = data.studyTasks?.items ?? []) {
  return calculateStudyTaskProgressList({
    days: data.codingDays,
    tasks,
    stepikEntries: data.stepik?.entries ?? [],
    manualStudy: data.manualStudy?.entries ?? [],
    topics: data.topics,
    todayDate: data.todayDate,
  });
}

function hydrateStudyData(data: StudyPayload, tasks = data.studyTasks?.items ?? []): StudyPayload {
  return {
    ...data,
    taskProgress: calculateProgress(data, tasks),
    studyTasks: {
      items: tasks,
      stats: data.studyTasks?.stats ?? {
        todaySolved: 0,
        weekSolved: 0,
        monthSolved: 0,
        todayTasks: 0,
        weekTasks: 0,
        monthTasks: 0,
        active: 0,
        completed: 0,
        paused: 0,
        archived: 0,
        averageDifficulty: 0,
        solved: 0,
        almost: 0,
        failed: 0,
        reviewed: 0,
        studyXp: 0,
        adventureXp: 0,
      },
    },
  };
}

function stepikStats(entries: StepikEntry[], todayDate: string) {
  const start = weekStart(todayDate);
  const month = todayDate.slice(0, 7);

  return {
    todayTasks: entries.filter((entry) => entry.date === todayDate).reduce((sum, entry) => sum + entry.tasksSolved, 0),
    weekTasks: entries.filter((entry) => entry.date >= start && entry.date <= todayDate).reduce((sum, entry) => sum + entry.tasksSolved, 0),
    monthTasks: entries.filter((entry) => entry.date.startsWith(month)).reduce((sum, entry) => sum + entry.tasksSolved, 0),
    adventureXp: entries.reduce((sum, entry) => sum + entry.tasksSolved * entry.difficulty * 12, 0),
  };
}

function manualStats(entries: ManualStudyEntry[], todayDate: string) {
  const start = weekStart(todayDate);
  const month = todayDate.slice(0, 7);

  return {
    todayMinutes: entries.filter((entry) => entry.date === todayDate).reduce((sum, entry) => sum + entry.minutes, 0),
    weekMinutes: entries.filter((entry) => entry.date >= start && entry.date <= todayDate).reduce((sum, entry) => sum + entry.minutes, 0),
    monthMinutes: entries.filter((entry) => entry.date.startsWith(month)).reduce((sum, entry) => sum + entry.minutes, 0),
    adventureXp: entries.reduce((sum, entry) => sum + Math.max(5, Math.round(entry.minutes * 0.8)), 0),
  };
}

function topicLevel(xp: number) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 80)) + 1;
}

function bumpTopic(topicsList: TopicProgress[], topicName: string | undefined, xp: number, date: string, solvedTasks = 0) {
  if (!topicName) return topicsList;
  const name = topicName.trim();
  if (!name) return topicsList;
  const lower = name.toLowerCase();
  let found = false;
  const next = topicsList.map((topic) => {
    if (topic.name.toLowerCase() !== lower && topic.id.toLowerCase() !== lower) return topic;
    found = true;
    const nextXp = topic.xp + xp;
    return {
      ...topic,
      xp: nextXp,
      level: topicLevel(nextXp),
      solvedTasks: topic.solvedTasks + solvedTasks,
      lastPracticedAt: topic.lastPracticedAt && topic.lastPracticedAt > date ? topic.lastPracticedAt : date,
    };
  });

  if (found) return next;

  return next.concat({
    id: lower.replace(/[^a-z0-9]+/g, "-") || "custom",
    name,
    category: "other",
    xp,
    level: topicLevel(xp),
    confidence: 3,
    solvedTasks,
    notesCount: 0,
    lastPracticedAt: date,
    reviewRecommended: false,
    reviewHint: "Local study entry.",
  });
}

function taskDraftFromTask(task: StudyTask): TaskDraft {
  return {
    id: task.id,
    title: task.title ?? task.topic,
    type: task.type,
    language: task.language ?? "",
    topic: task.topic,
    customTopic: task.customTopic ?? "",
    target: String(task.target),
    unit: task.unit,
    period: task.period,
    deadline: task.deadline ?? task.date,
    difficultyLabel: task.difficultyLabel,
    source: task.source === "wakatime" || task.source === "stepik" || task.source === "manual" || task.source === "mixed" ? task.source : "manual",
    description: task.description ?? task.notes ?? "",
  };
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500", className)}>
      {label}
      {children}
    </label>
  );
}

function inputClass() {
  return "min-w-0 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold normal-case tracking-normal text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-300/40";
}

function Pill({ children, tone = "zinc" }: { children: React.ReactNode; tone?: "zinc" | "green" | "orange" | "blue" | "violet" }) {
  const tones = {
    zinc: "border-white/10 bg-black/25 text-zinc-400",
    green: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    orange: "border-orange-300/25 bg-orange-300/10 text-orange-100",
    blue: "border-sky-300/25 bg-sky-300/10 text-sky-100",
    violet: "border-violet-300/25 bg-violet-300/10 text-violet-100",
  };

  return <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", tones[tone])}>{children}</span>;
}

function StudyTaskCard({
  task,
  progress,
  busy,
  onEdit,
  onPatch,
  onProgress,
}: {
  task: StudyTask;
  progress: StudyTaskProgress;
  busy: boolean;
  onEdit: (task: StudyTask) => void;
  onPatch: (task: StudyTask, input: Partial<StudyTask>) => void;
  onProgress: (task: StudyTask, amount: number) => void;
}) {
  const completed = progress.isCompleted || task.status === "completed";
  const canManualProgress = task.type === "tasksCount" || task.type === "stepikTasks" || task.type === "manualStudy";
  const progressAmount = task.type === "manualStudy" && task.unit === "minutes" ? 15 : 1;
  const progressLabel = task.type === "manualStudy" && task.unit === "minutes" ? "+15 min" : task.type === "manualStudy" ? "+1 session" : "+1 solved";

  return (
    <div className={cn("rounded-lg border bg-black/20 p-3", completed ? "border-emerald-300/20" : task.status === "paused" ? "border-zinc-500/20" : "border-white/10")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words text-sm font-black leading-tight text-white">{task.title ?? task.topic}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {task.language ? <Pill tone="blue">{task.language}</Pill> : null}
            <Pill>{taskTopic(task)}</Pill>
            <Pill tone={task.source === "wakatime" ? "orange" : task.source === "stepik" ? "violet" : "green"}>{task.source}</Pill>
            <Pill>{task.difficultyLabel}</Pill>
          </div>
        </div>
        <Pill tone={completed ? "green" : task.status === "paused" ? "zinc" : "orange"}>{completed ? "done" : task.status}</Pill>
      </div>

      <div className="mt-3">
        <ProgressBar percent={progress.percent} label={`${typeLabel(task.type)} / ${periodLabel(task)}`} meta={progress.label} />
      </div>

      {task.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{task.description}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {canManualProgress && !completed ? (
          <button type="button" disabled={busy} onClick={() => onProgress(task, progressAmount)} className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-black text-emerald-100 disabled:opacity-50">
            {progressLabel}
          </button>
        ) : null}
        {!completed ? (
          <button type="button" disabled={busy} onClick={() => onPatch(task, { status: "completed" })} className="rounded-full border border-emerald-300/25 bg-black/25 px-3 py-1 text-[11px] font-black text-emerald-100 disabled:opacity-50">
            <Check className="mr-1 inline h-3 w-3" />
            Complete
          </button>
        ) : null}
        <button type="button" disabled={busy} onClick={() => onPatch(task, { status: task.status === "paused" ? "active" : "paused" })} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-black text-zinc-300 disabled:opacity-50">
          {task.status === "paused" ? <Play className="mr-1 inline h-3 w-3" /> : <Pause className="mr-1 inline h-3 w-3" />}
          {task.status === "paused" ? "Resume" : "Pause"}
        </button>
        <button type="button" disabled={busy} onClick={() => onEdit(task)} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-black text-zinc-300 disabled:opacity-50">
          <Edit3 className="mr-1 inline h-3 w-3" />
          Edit
        </button>
        <button type="button" disabled={busy} onClick={() => onPatch(task, { status: "archived" })} className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1 text-[11px] font-black text-orange-100 disabled:opacity-50">
          <Archive className="mr-1 inline h-3 w-3" />
          Archive
        </button>
      </div>
    </div>
  );
}

export function StudyPage() {
  const state = useRemoteData<StudyPayload>("/api/study");
  const [localData, setLocalData] = useState<StudyPayload | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [stepikDraft, setStepikDraft] = useState<StepikDraft | null>(null);
  const [manualDraft, setManualDraft] = useState<ManualDraft | null>(null);
  const [topicFilter, setTopicFilter] = useState<"active" | "all" | "python" | "backend" | "tools">("active");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadedData = state.status === "ready" ? state.data : null;
  const data = loadedData ? localData ?? hydrateStudyData(loadedData) : null;
  const tasks = data?.studyTasks?.items ?? emptyStudyTasks;
  const taskProgress = progressMap(data?.taskProgress ?? []);
  const visibleTasks = useMemo(() => tasks.filter((task) => task.status !== "archived"), [tasks]);
  const activeTasks = visibleTasks.filter((task) => !(taskProgress.get(task.id)?.isCompleted || task.status === "completed"));
  const completedTasks = visibleTasks.filter((task) => taskProgress.get(task.id)?.isCompleted || task.status === "completed");
  const completedToday = completedTasks.filter((task) => (task.completedAt?.slice(0, 10) ?? task.date) === data?.todayDate).length;
  const stepikWeek = data?.stepik?.stats.weekTasks ?? 0;
  const manualWeek = data?.manualStudy?.stats.weekMinutes ?? 0;
  const topTopic = data?.topics.find((topic) => topic.xp > 0) ?? data?.topics[0] ?? null;
  const weekTaskProgress = visibleTasks.length ? Math.round((completedTasks.length / visibleTasks.length) * 100) : 0;
  const linkedTaskCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of visibleTasks) {
      const key = taskTopic(task).toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [visibleTasks]);
  const filteredTopics = useMemo(() => {
    const list = (data?.topics ?? []).filter((topic) => {
      const linked = linkedTaskCounts.get(topic.name.toLowerCase()) ?? linkedTaskCounts.get(topic.id.toLowerCase()) ?? 0;
      if (topicFilter === "active") return topic.xp > 0 || linked > 0;
      if (topicFilter === "all") return true;
      return topic.category === topicFilter;
    });

    return list
      .map((topic) => ({
        ...topic,
        linkedTasks: linkedTaskCounts.get(topic.name.toLowerCase()) ?? linkedTaskCounts.get(topic.id.toLowerCase()) ?? 0,
      }))
      .sort((a, b) => b.xp - a.xp || b.linkedTasks - a.linkedTasks)
      .slice(0, 8);
  }, [data?.topics, linkedTaskCounts, topicFilter]);

  if (state.status === "loading") return <LoadingState label="Loading study center..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;
  if (!data) return <ErrorState message="Study data is not available." />;
  const readyData = data;

  function applyTasks(nextTasks: StudyTask[]) {
    setLocalData((current) => {
      const base = current ?? readyData;
      return hydrateStudyData(
        {
          ...base,
          studyTasks: {
            items: nextTasks,
            stats: base.studyTasks?.stats ?? readyData.studyTasks?.stats,
          } as LearningRpg["studyTasks"],
        },
        nextTasks,
      );
    });
  }

  function applyStepikEntries(entries: StepikEntry[], latestEntry?: StepikEntry) {
    setLocalData((current) => {
      const base = current ?? readyData;
      const latest = latestEntry ?? entries[0];
      const bumpedTopics = latest ? bumpTopic(base.topics, latest.topic, latest.tasksSolved * latest.difficulty * 16, latest.date, latest.tasksSolved) : base.topics;
      const next = {
        ...base,
        stepik: {
          entries,
          stats: stepikStats(entries, base.todayDate),
        },
        topics: bumpedTopics,
      };
      return hydrateStudyData(next);
    });
  }

  function applyManualEntries(entries: ManualStudyEntry[], latestEntry?: ManualStudyEntry) {
    setLocalData((current) => {
      const base = current ?? readyData;
      const latest = latestEntry ?? entries[0];
      const bumpedTopics = latest ? bumpTopic(base.topics, latest.topic, Math.round(latest.minutes * 0.7), latest.date) : base.topics;
      const next = {
        ...base,
        manualStudy: {
          entries,
          stats: manualStats(entries, base.todayDate),
        },
        topics: bumpedTopics,
      };
      return hydrateStudyData(next);
    });
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskDraft) return;
    const title = taskDraft.title.trim();
    const target = Number(taskDraft.target);

    if (!title) {
      setActionError("Enter a task title.");
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      setActionError("Target must be greater than 0.");
      return;
    }
    if (taskDraft.topic === "custom" && !taskDraft.customTopic.trim()) {
      setActionError("Enter a custom topic.");
      return;
    }

    setBusyKey("save-task");
    try {
      const response = await fetch("/api/study-tasks", {
        method: taskDraft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskDraft,
          target,
          date: readyData.todayDate,
          deadline: taskDraft.period === "custom" ? taskDraft.deadline : undefined,
          id: taskDraft.id,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { tasks?: StudyTask[]; error?: string };

      if (!response.ok || payload.error || !payload.tasks) {
        setActionError(payload.error ?? "Failed to save study task.");
        return;
      }

      setActionError(null);
      applyTasks(payload.tasks);
      setTaskDraft(defaultTaskDraft(readyData.todayDate));
    } finally {
      setBusyKey(null);
    }
  }

  async function patchTask(task: StudyTask, input: Partial<StudyTask>) {
    setBusyKey(`task:${task.id}`);
    try {
      const response = await fetch("/api/study-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, ...input }),
      });
      const payload = (await response.json().catch(() => ({}))) as { tasks?: StudyTask[]; error?: string };

      if (!response.ok || payload.error || !payload.tasks) {
        setActionError(payload.error ?? "Failed to update study task.");
        return;
      }

      setActionError(null);
      applyTasks(payload.tasks);
    } finally {
      setBusyKey(null);
    }
  }

  async function addTaskProgress(task: StudyTask, amount: number) {
    setBusyKey(`task:${task.id}`);
    try {
      const response = await fetch("/api/study-tasks/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, amount }),
      });
      const payload = (await response.json().catch(() => ({}))) as { tasks?: StudyTask[]; error?: string };

      if (!response.ok || payload.error || !payload.tasks) {
        setActionError(payload.error ?? "Failed to update task progress.");
        return;
      }

      setActionError(null);
      applyTasks(payload.tasks);
    } finally {
      setBusyKey(null);
    }
  }

  async function saveStepikEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stepikDraft) return;
    setBusyKey("stepik");
    try {
      const response = await fetch("/api/stepik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...stepikDraft,
          tasksSolved: Number(stepikDraft.tasksSolved),
          difficulty: Number(stepikDraft.difficulty),
          status: Number(stepikDraft.difficulty) >= 4 ? "hard" : "normal",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { entry?: StepikEntry; entries?: StepikEntry[]; error?: string };

      if (!response.ok || payload.error || !payload.entries) {
        setActionError(payload.error ?? "Failed to save Stepik entry.");
        return;
      }

      setActionError(null);
      applyStepikEntries(payload.entries, payload.entry);
      setStepikDraft(defaultStepikDraft(readyData.todayDate));
    } finally {
      setBusyKey(null);
    }
  }

  async function saveManualEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualDraft) return;
    setBusyKey("manual");
    try {
      const response = await fetch("/api/manual-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualDraft,
          minutes: Number(manualDraft.minutes),
          difficulty: Number(manualDraft.difficulty),
          type: "theory",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { entry?: ManualStudyEntry; entries?: ManualStudyEntry[]; error?: string };

      if (!response.ok || payload.error || !payload.entries) {
        setActionError(payload.error ?? "Failed to save manual study entry.");
        return;
      }

      setActionError(null);
      applyManualEntries(payload.entries, payload.entry);
      setManualDraft(defaultManualDraft(readyData.todayDate));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Study" title="Learning Center" description="Compact learning control panel for WakaTime goals, manual practice, Stepik entries, topics, and weekly focus." />
      {actionError ? <ErrorState message={actionError} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Active tasks" value={`${activeTasks.length}`} />
        <Metric label="Completed today" value={`${completedToday}`} />
        <Metric label="Stepik week" value={`${stepikWeek}`} hint="Local entries" />
        <Metric label="Manual week" value={`${manualWeek}m`} />
        <Metric label="Top topic" value={topTopic?.name ?? "None"} hint={topTopic ? `${topTopic.xp} XP / level ${topTopic.level}` : "No topic XP yet"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_410px]">
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle icon={GraduationCap} label="Active Study Tasks" />
            <div className="flex flex-wrap gap-2">
              <Pill tone="orange">{weekTaskProgress}% week flow</Pill>
              <button type="button" onClick={() => setTaskDraft(defaultTaskDraft(data.todayDate))} className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
                <Plus className="mr-1 inline h-3.5 w-3.5" />
                New Study Task
              </button>
            </div>
          </div>

          {activeTasks.length ? (
            <div className="grid gap-3">
              {activeTasks.slice(0, 8).map((task) => (
                <StudyTaskCard
                  key={task.id}
                  task={task}
                  progress={taskProgress.get(task.id) ?? { taskId: task.id, current: 0, target: task.target, percent: 0, isCompleted: false, label: `0 / ${task.target}` }}
                  busy={busyKey === `task:${task.id}`}
                  onEdit={(entry) => setTaskDraft(taskDraftFromTask(entry))}
                  onPatch={(entry, input) => void patchTask(entry, input)}
                  onProgress={(entry, amount) => void addTaskProgress(entry, amount)}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              <EmptyState>
                No active study tasks yet. Create a goal like 90 min Python, 3 Stepik tasks, or 60 min SQL.
              </EmptyState>
              <div className="flex flex-wrap gap-2">
                {quickTemplates.slice(0, 3).map((template) => (
                  <button key={template.title} type="button" onClick={() => setTaskDraft({ ...defaultTaskDraft(data.todayDate), ...template })} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-black text-zinc-300">
                    + {template.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {completedTasks.length ? (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Completed preview</div>
              <div className="grid gap-2">
                {completedTasks.slice(0, 4).map((task) => {
                  const progress = taskProgress.get(task.id);
                  return (
                    <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-300/15 bg-emerald-300/5 px-3 py-2">
                      <span className="min-w-0 break-words text-xs font-black text-white">{task.title ?? task.topic}</span>
                      <span className="text-[11px] font-bold text-emerald-100">{progress?.label ?? "done"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="p-4 sm:p-5">
          <CardTitle icon={Target} label={taskDraft?.id ? "Edit Task" : "Quick Add"} />
          <div className="mb-3 flex flex-wrap gap-2">
            {quickTemplates.map((template) => (
              <button key={template.title} type="button" onClick={() => setTaskDraft({ ...defaultTaskDraft(data.todayDate), ...template })} className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-black text-zinc-300 transition-colors hover:border-orange-300/35 hover:text-orange-100">
                + {template.title}
              </button>
            ))}
          </div>

          {taskDraft ? (
            <form onSubmit={(event) => void saveTask(event)} className="grid gap-2">
              <Field label="Title">
                <input value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} className={inputClass()} placeholder="90 min Python" />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Type">
                  <select value={taskDraft.type} onChange={(event) => setTaskDraft({ ...taskDraft, type: event.target.value as StudyTaskType })} className={inputClass()}>
                    {taskTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </Field>
                <Field label="Source">
                  <select value={taskDraft.source} onChange={(event) => setTaskDraft({ ...taskDraft, source: event.target.value as TaskDraft["source"] })} className={inputClass()}>
                    {sources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}
                  </select>
                </Field>
                <Field label="Language">
                  <select value={taskDraft.language} onChange={(event) => setTaskDraft({ ...taskDraft, language: event.target.value })} className={inputClass()}>
                    {languages.map((language) => <option key={language || "none"} value={language}>{language || "No language"}</option>)}
                  </select>
                </Field>
                <Field label="Topic">
                  <select value={taskDraft.topic} onChange={(event) => setTaskDraft({ ...taskDraft, topic: event.target.value })} className={inputClass()}>
                    {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                  </select>
                </Field>
                {taskDraft.topic === "custom" ? (
                  <Field label="Custom topic" className="sm:col-span-2">
                    <input value={taskDraft.customTopic} onChange={(event) => setTaskDraft({ ...taskDraft, customTopic: event.target.value })} className={inputClass()} placeholder="Your topic" />
                  </Field>
                ) : null}
                <Field label="Target">
                  <input type="number" min="1" value={taskDraft.target} onChange={(event) => setTaskDraft({ ...taskDraft, target: event.target.value })} className={inputClass()} />
                </Field>
                <Field label="Unit">
                  <select value={taskDraft.unit} onChange={(event) => setTaskDraft({ ...taskDraft, unit: event.target.value as StudyTaskUnit })} className={inputClass()}>
                    {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </Field>
                <Field label="Period">
                  <select value={taskDraft.period} onChange={(event) => setTaskDraft({ ...taskDraft, period: event.target.value as StudyTaskPeriod })} className={inputClass()}>
                    {periods.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}
                  </select>
                </Field>
                <Field label="Difficulty">
                  <select value={taskDraft.difficultyLabel} onChange={(event) => setTaskDraft({ ...taskDraft, difficultyLabel: event.target.value as StudyTaskDifficulty })} className={inputClass()}>
                    {difficulties.map((difficulty) => <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>)}
                  </select>
                </Field>
                {taskDraft.period === "custom" ? (
                  <Field label="Deadline" className="sm:col-span-2">
                    <input type="date" value={taskDraft.deadline} onChange={(event) => setTaskDraft({ ...taskDraft, deadline: event.target.value })} className={inputClass()} />
                  </Field>
                ) : null}
              </div>
              <Field label="Notes">
                <textarea value={taskDraft.description} onChange={(event) => setTaskDraft({ ...taskDraft, description: event.target.value })} rows={2} className={inputClass()} placeholder="Short task description" />
              </Field>
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="submit" disabled={busyKey === "save-task"} className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100 disabled:opacity-50">
                  <Save className="mr-1 inline h-3.5 w-3.5" />
                  {busyKey === "save-task" ? "Saving..." : taskDraft.id ? "Save changes" : "Create task"}
                </button>
                <button type="button" onClick={() => setTaskDraft(null)} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-zinc-300">
                  Close
                </button>
              </div>
            </form>
          ) : (
            <EmptyState>Pick a quick template or create a custom study task.</EmptyState>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle icon={Flame} label="Topic Tracker" />
            <div className="flex flex-wrap gap-1.5">
              {(["active", "all", "python", "backend", "tools"] as const).map((filter) => (
                <button key={filter} type="button" onClick={() => setTopicFilter(filter)} className={cn("rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em]", topicFilter === filter ? "border-orange-300/30 bg-orange-300/10 text-orange-100" : "border-white/10 bg-black/25 text-zinc-500")}>
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {filteredTopics.map((topic) => (
              <div key={topic.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <ProgressBar percent={Math.min(100, (topic.xp % 240) / 2.4)} label={`${topic.name} / level ${topic.level}`} meta={`${topic.xp} XP`} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Pill>{topic.category}</Pill>
                  <Pill tone={topic.linkedTasks > 0 ? "green" : "zinc"}>{topic.linkedTasks} linked tasks</Pill>
                  {topic.reviewRecommended ? <Pill tone="orange">review</Pill> : null}
                </div>
              </div>
            ))}
            {!filteredTopics.length ? <EmptyState>No active topics yet. Add manual study, Stepik, or topic tasks.</EmptyState> : null}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <CardTitle icon={ListChecks} label="Goals Snapshot" />
          <div className="grid gap-3">
            {activeTasks.slice(0, 4).map((task) => {
              const progress = taskProgress.get(task.id);
              return (
                <ProgressBar key={task.id} percent={progress?.percent ?? 0} label={task.title ?? task.topic} meta={progress?.label} />
              );
            })}
            {data.goals?.progress.slice(0, 3).map((goal) => (
              <ProgressBar key={goal.id} percent={goal.percent} label={goal.title} meta={`${goal.progress} / ${goal.target}`} />
            ))}
            {!activeTasks.length && !data.goals?.progress.length ? <EmptyState>No goals yet. Study tasks will appear here.</EmptyState> : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle icon={BookOpen} label="Stepik Entries" />
            <button type="button" onClick={() => setStepikDraft(stepikDraft ? null : defaultStepikDraft(data.todayDate))} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-zinc-300">
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              Add Stepik entry
            </button>
          </div>
          {stepikDraft ? (
            <form onSubmit={(event) => void saveStepikEntry(event)} className="mb-3 grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Course"><input value={stepikDraft.course} onChange={(event) => setStepikDraft({ ...stepikDraft, course: event.target.value })} className={inputClass()} /></Field>
                <Field label="Section"><input value={stepikDraft.section} onChange={(event) => setStepikDraft({ ...stepikDraft, section: event.target.value })} className={inputClass()} /></Field>
                <Field label="Topic"><input value={stepikDraft.topic} onChange={(event) => setStepikDraft({ ...stepikDraft, topic: event.target.value })} className={inputClass()} /></Field>
                <Field label="Tasks solved"><input type="number" min="0" value={stepikDraft.tasksSolved} onChange={(event) => setStepikDraft({ ...stepikDraft, tasksSolved: event.target.value })} className={inputClass()} /></Field>
                <Field label="Difficulty"><input type="number" min="1" max="5" value={stepikDraft.difficulty} onChange={(event) => setStepikDraft({ ...stepikDraft, difficulty: event.target.value })} className={inputClass()} /></Field>
                <Field label="Date"><input type="date" value={stepikDraft.date} onChange={(event) => setStepikDraft({ ...stepikDraft, date: event.target.value })} className={inputClass()} /></Field>
              </div>
              <Field label="Notes"><input value={stepikDraft.comment} onChange={(event) => setStepikDraft({ ...stepikDraft, comment: event.target.value })} className={inputClass()} /></Field>
              <button type="submit" disabled={busyKey === "stepik"} className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100 disabled:opacity-50">
                Save Stepik entry
              </button>
            </form>
          ) : null}
          {data.stepik?.entries.length ? (
            <div className="grid gap-2">
              {data.stepik.entries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="break-words text-sm font-black text-white">{entry.topic}</div>
                    <Pill tone="violet">{entry.tasksSolved} tasks</Pill>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{entry.course || "Stepik"} / difficulty {entry.difficulty} / {entry.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No Stepik entries yet. Add local entries manually if there is no Stepik API integration.</EmptyState>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle icon={Clock} label="Manual Study" />
            <button type="button" onClick={() => setManualDraft(manualDraft ? null : defaultManualDraft(data.todayDate))} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-zinc-300">
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              Add manual entry
            </button>
          </div>
          {manualDraft ? (
            <form onSubmit={(event) => void saveManualEntry(event)} className="mb-3 grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Topic"><input value={manualDraft.topic} onChange={(event) => setManualDraft({ ...manualDraft, topic: event.target.value })} className={inputClass()} /></Field>
                <Field label="Language"><input value={manualDraft.language} onChange={(event) => setManualDraft({ ...manualDraft, language: event.target.value })} className={inputClass()} /></Field>
                <Field label="Minutes"><input type="number" min="1" value={manualDraft.minutes} onChange={(event) => setManualDraft({ ...manualDraft, minutes: event.target.value })} className={inputClass()} /></Field>
                <Field label="Difficulty"><input type="number" min="1" max="5" value={manualDraft.difficulty} onChange={(event) => setManualDraft({ ...manualDraft, difficulty: event.target.value })} className={inputClass()} /></Field>
                <Field label="Date" className="sm:col-span-2"><input type="date" value={manualDraft.date} onChange={(event) => setManualDraft({ ...manualDraft, date: event.target.value })} className={inputClass()} /></Field>
              </div>
              <Field label="Description"><input value={manualDraft.description} onChange={(event) => setManualDraft({ ...manualDraft, description: event.target.value })} className={inputClass()} /></Field>
              <button type="submit" disabled={busyKey === "manual"} className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100 disabled:opacity-50">
                Save manual entry
              </button>
            </form>
          ) : null}
          {data.manualStudy?.entries.length ? (
            <div className="grid gap-2">
              {data.manualStudy.entries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="break-words text-sm font-black text-white">{entry.description || entry.topic || entry.type}</div>
                    <Pill tone="green">{entry.minutes}m</Pill>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{entry.language || "Study"} / {entry.topic || "General"} / {entry.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No manual study entries yet. Add reading, lessons, review, planning, or theory sessions.</EmptyState>
          )}
        </Card>
      </section>

      <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
        <Trash2 className="h-3.5 w-3.5" />
        Coding XP stays honest: WakaTime minutes are read only, and manual entries affect study progress only.
      </div>
    </div>
  );
}
