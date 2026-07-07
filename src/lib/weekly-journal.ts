import { hasDailyNoteContent, type DailyNote } from "@/lib/daily-notes";
import type { DailyDifficulty } from "@/lib/difficulty";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { StepikEntry } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";

export type WeeklyStudyJournal = {
  weekStart: string;
  weekEnd: string;
  codingXp: number;
  codingHours: number;
  activeDays: number;
  mainLanguage?: string;
  mainTopic?: string;
  solvedTasks: number;
  pomodoroSessions: number;
  notesCount: number;
  bestDay?: string;
  difficultySummary?: string;
  summary: string;
  recommendations: string[];
  markdown: string;
};

function topLanguage(days: DailyCodingActivity[]) {
  const totals = new Map<string, number>();

  for (const day of days) {
    for (const language of day.languages) {
      totals.set(language.name, (totals.get(language.name) ?? 0) + language.seconds);
    }
  }

  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function difficultySummary(days: DailyCodingActivity[], difficulties: Record<string, DailyDifficulty>) {
  const hardDays = days.filter((day) => {
    const difficulty = difficulties[day.date]?.difficulty;
    return difficulty === "hard" || difficulty === "veryHard";
  }).length;

  if (hardDays === 0) return "Неделя без отмеченных трудных дней.";
  if (hardDays <= 2) return `${hardDays} трудных дня: нормальная зона роста.`;
  return `${hardDays} трудных дня: стоит добавить восстановление.`;
}

export function getWeeklyStudyJournal({
  weekDays,
  tasks,
  stepikEntries,
  notes,
  topics,
  difficulties,
  pomodoroStats,
}: {
  weekDays: DailyCodingActivity[];
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  notes: DailyNote[];
  topics: TopicProgress[];
  difficulties: Record<string, DailyDifficulty>;
  pomodoroStats?: PomodoroStats;
}): WeeklyStudyJournal {
  const weekStart = weekDays[0]?.date ?? "";
  const weekEnd = weekDays.at(-1)?.date ?? "";
  const codingXp = weekDays.reduce((sum, day) => sum + day.xp, 0);
  const codingHours = Math.round((weekDays.reduce((sum, day) => sum + day.codingSeconds, 0) / 3600) * 10) / 10;
  const activeDays = weekDays.filter((day) => day.xp > 0).length;
  const mainLanguage = topLanguage(weekDays);
  const mainTopic = topics.find((topic) => topic.xp > 0)?.name;
  const solvedTasks =
    tasks.filter((task) => task.status === "solved" && task.date >= weekStart && task.date <= weekEnd).length +
    stepikEntries
      .filter((entry) => entry.date >= weekStart && entry.date <= weekEnd)
      .reduce((sum, entry) => sum + entry.tasksSolved, 0);
  const notesCount = notes.filter((note) => note.date >= weekStart && note.date <= weekEnd && hasDailyNoteContent(note)).length;
  const bestDay = weekDays.filter((day) => day.xp > 0).toSorted((a, b) => b.xp - a.xp)[0]?.date;
  const difficulty = difficultySummary(weekDays, difficulties);
  const recommendations = [
    activeDays >= 5 ? "Сохрани стабильность, но оставь место для отдыха." : "Выбери 3–4 опорных дня для практики.",
    solvedTasks > 0 ? "Свяжи задачи с темой, которая повторяется чаще всего." : "Добавь 1–2 учебные задачи для закрепления темы.",
    notesCount > 0 ? "Продолжай короткие заметки: они помогают видеть прогресс." : "Одна заметка в конце недели уже даст больше ясности.",
  ];
  const summary =
    activeDays === 0
      ? "Неделя пока ждёт первой практики."
      : `Неделя: ${activeDays} активных дней, ${codingXp} Coding XP, главная тема — ${mainTopic ?? "не определена"}.`;
  const markdown = [
    `# CodeFire Weekly Journal ${weekStart} — ${weekEnd}`,
    "",
    `- Coding XP: ${codingXp}`,
    `- Coding hours: ${codingHours}`,
    `- Active days: ${activeDays}`,
    `- Main language: ${mainLanguage ?? "n/a"}`,
    `- Main topic: ${mainTopic ?? "n/a"}`,
    `- Solved tasks: ${solvedTasks}`,
    `- Pomodoro sessions: ${pomodoroStats?.weekCompletedFocusSessions ?? 0}`,
    `- Notes: ${notesCount}`,
    `- Best day: ${bestDay ?? "n/a"}`,
    "",
    "## Summary",
    summary,
    "",
    "## Recommendations",
    ...recommendations.map((item) => `- ${item}`),
  ].join("\n");

  return {
    weekStart,
    weekEnd,
    codingXp,
    codingHours,
    activeDays,
    mainLanguage,
    mainTopic,
    solvedTasks,
    pomodoroSessions: pomodoroStats?.weekCompletedFocusSessions ?? 0,
    notesCount,
    bestDay,
    difficultySummary: difficulty,
    summary,
    recommendations,
    markdown,
  };
}
