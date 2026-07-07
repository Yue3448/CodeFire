import type { Achievement } from "@/lib/achievements";
import type { BossFight } from "@/lib/boss-fights";
import type { DailyNote } from "@/lib/daily-notes";
import type { DailyDifficulty } from "@/lib/difficulty";
import type { InventoryItem } from "@/lib/inventory";
import type { ManualStudyEntry } from "@/lib/manual-study";
import type { PomodoroSession } from "@/lib/pomodoro";
import type { DailyQuest } from "@/lib/quests";
import type { StepikEntry } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";
import type { DailyCodingActivity } from "@/lib/types";
import { getDayReplay, type DayReplayEvent } from "@/lib/day-replay";

export type DayDetails = {
  date: string;
  codingXp: number;
  codingMinutes: number;
  mainLanguage?: string;
  languages: Array<{ name: string; xp: number; minutes: number }>;
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  manualStudyEntries: ManualStudyEntry[];
  pomodoroSummary?: {
    completedFocusSessions: number;
    focusMinutes: number;
  };
  note?: DailyNote | null;
  difficulty?: DailyDifficulty;
  questsCompleted: number;
  achievementsUnlocked: string[];
  itemsUnlocked: string[];
  bossesCompleted: string[];
  title?: string;
  replay: DayReplayEvent[];
};

export function getDayDetails({
  date,
  days,
  tasks,
  stepikEntries,
  manualStudy,
  pomodoroSessions,
  note,
  difficulty,
  quests,
  achievements,
  items,
  bosses,
  title,
}: {
  date: string;
  days: DailyCodingActivity[];
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  manualStudy: ManualStudyEntry[];
  pomodoroSessions: PomodoroSession[];
  note?: DailyNote | null;
  difficulty?: DailyDifficulty;
  quests: DailyQuest[];
  achievements: Achievement[];
  items: InventoryItem[];
  bosses: BossFight[];
  title?: string;
}): DayDetails {
  const day = days.find((entry) => entry.date === date);
  const dateTasks = tasks.filter((task) => task.date === date);
  const dateStepik = stepikEntries.filter((entry) => entry.date === date);
  const dateManualStudy = manualStudy.filter((entry) => entry.date === date);
  const datePomodoro = pomodoroSessions.filter((session) => session.date === date && session.mode === "focus");
  const completedPomodoro = datePomodoro.filter((session) => session.completed);
  const replay = getDayReplay({
    date,
    day,
    quests,
    achievements,
    note,
    tasks,
    stepikEntries,
    manualStudy,
    pomodoroSessions,
    bosses,
    items,
  });

  return {
    date,
    codingXp: day?.xp ?? 0,
    codingMinutes: Math.floor((day?.codingSeconds ?? 0) / 60),
    mainLanguage: day?.languages[0]?.name,
    languages:
      day?.languages.map((language) => ({
        name: language.name,
        xp: language.xp,
        minutes: Math.floor(language.seconds / 60),
      })) ?? [],
    tasks: dateTasks,
    stepikEntries: dateStepik,
    manualStudyEntries: dateManualStudy,
    pomodoroSummary: {
      completedFocusSessions: completedPomodoro.length,
      focusMinutes: completedPomodoro.reduce((sum, session) => sum + session.completedMinutes, 0),
    },
    note,
    difficulty,
    questsCompleted: quests.filter((quest) => quest.completed).length,
    achievementsUnlocked: achievements.filter((achievement) => achievement.unlockedAt === date).map((achievement) => achievement.title),
    itemsUnlocked: items.filter((item) => item.unlockedAt?.startsWith(date)).map((item) => item.name),
    bossesCompleted: bosses.filter((boss) => boss.completedAt?.startsWith(date)).map((boss) => boss.title),
    title,
    replay,
  };
}
