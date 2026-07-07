import type { DailyCodingActivity } from "@/lib/types";
import type { BossFight } from "@/lib/boss-fights";
import { hasDailyNoteContent, type DailyNote } from "@/lib/daily-notes";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { StudyTask } from "@/lib/study-tasks";

export type RecordItem = {
  label: string;
  value: string;
  date?: string;
};

export type CodeFireRecords = {
  items: RecordItem[];
};

function bestDay(days: DailyCodingActivity[]) {
  return days.filter((day) => day.xp > 0).toSorted((a, b) => b.xp - a.xp)[0] ?? null;
}

function bestLanguageDay(days: DailyCodingActivity[], language: string) {
  return days
    .map((day) => ({
      day,
      xp: Math.floor((day.languages.find((item) => item.name === language)?.seconds ?? 0) / 60),
    }))
    .toSorted((a, b) => b.xp - a.xp)[0];
}

export function getRecords(
  days: DailyCodingActivity[],
  bestStreak: number,
  options: {
    tasks?: StudyTask[];
    pomodoroStats?: PomodoroStats;
    bosses?: BossFight[];
    notes?: DailyNote[];
  } = {},
): CodeFireRecords {
  const day = bestDay(days);
  const pythonDay = bestLanguageDay(days, "Python");
  const maxWeekXp = days.reduce((sum, item) => sum + item.xp, 0);
  const projectTotals = new Map<string, number>();
  const languageCount = new Map<string, number>();

  for (const item of days) {
    if (item.languages[0]) {
      languageCount.set(item.languages[0].name, (languageCount.get(item.languages[0].name) ?? 0) + 1);
    }

    for (const project of item.projects ?? []) {
      projectTotals.set(project.name, (projectTotals.get(project.name) ?? 0) + project.seconds);
    }
  }

  const topProject = [...projectTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const topLanguage = [...languageCount.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestTaskDay = [...(options.tasks ?? [])]
    .filter((task) => task.status === "solved")
    .reduce<Record<string, number>>((acc, task) => {
      acc[task.date] = (acc[task.date] ?? 0) + 1;
      return acc;
    }, {});
  const bestTaskEntry = Object.entries(bestTaskDay).sort((a, b) => b[1] - a[1])[0];
  const hardestBoss = [...(options.bosses ?? [])]
    .filter((boss) => boss.completed)
    .sort((a, b) => difficultyScore(b.difficulty) - difficultyScore(a.difficulty))[0];
  const notesByWeek = new Map<string, number>();

  for (const note of options.notes ?? []) {
    if (!hasDailyNoteContent(note)) continue;
    const weekKey = note.date.slice(0, 7);
    notesByWeek.set(weekKey, (notesByWeek.get(weekKey) ?? 0) + 1);
  }

  const bestNotesWeek = [...notesByWeek.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    items: [
      { label: "Лучший день", value: day ? `${day.xp} XP` : "нет данных", date: day?.date },
      { label: "Лучший Python-день", value: pythonDay?.xp ? `${pythonDay.xp} XP` : "нет данных", date: pythonDay?.day.date },
      { label: "Лучший streak", value: `${bestStreak} дн.` },
      { label: "Максимум за день", value: day ? `${Math.round((day.codingSeconds / 3600) * 10) / 10} ч` : "нет данных", date: day?.date },
      { label: "XP за период", value: `${maxWeekXp} XP` },
      { label: "Самый активный проект", value: topProject?.[0] ?? "нет данных" },
      { label: "Частый главный язык", value: topLanguage?.[0] ?? "нет данных" },
      { label: "Задач за день", value: bestTaskEntry ? `${bestTaskEntry[1]}` : "нет данных", date: bestTaskEntry?.[0] },
      { label: "Pomodoro за день", value: options.pomodoroStats?.bestDay ? `${options.pomodoroStats.bestDay.completedSessions}` : "нет данных", date: options.pomodoroStats?.bestDay?.date },
      { label: "Сложный босс", value: hardestBoss?.title ?? "нет побед", date: hardestBoss?.completedAt?.slice(0, 10) },
      { label: "Заметок за месяц", value: bestNotesWeek ? `${bestNotesWeek[1]}` : "нет данных", date: bestNotesWeek?.[0] },
    ],
  };
}

function difficultyScore(difficulty: BossFight["difficulty"]) {
  return { easy: 1, normal: 2, hard: 3, epic: 4, legendary: 5 }[difficulty];
}
