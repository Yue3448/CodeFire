import type { Achievement } from "@/lib/achievements";
import type { BossFight } from "@/lib/boss-fights";
import { hasDailyNoteContent, type DailyNote } from "@/lib/daily-notes";
import type { InventoryItem } from "@/lib/inventory";
import type { ManualStudyEntry } from "@/lib/manual-study";
import type { PomodoroSession } from "@/lib/pomodoro";
import type { DailyQuest } from "@/lib/quests";
import type { StepikEntry } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";
import type { DailyCodingActivity } from "@/lib/types";

export type DayReplayEvent = {
  id: string;
  date: string;
  time?: string;
  type: "coding" | "pomodoro" | "quest" | "achievement" | "note" | "boss" | "item" | "task" | "manualStudy";
  title: string;
  description?: string;
  icon?: string;
};

function timeFromIso(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function getDayReplay({
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
}: {
  date: string;
  day?: DailyCodingActivity;
  quests: DailyQuest[];
  achievements: Achievement[];
  note?: DailyNote | null;
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  manualStudy: ManualStudyEntry[];
  pomodoroSessions: PomodoroSession[];
  bosses: BossFight[];
  items: InventoryItem[];
}): DayReplayEvent[] {
  const events: DayReplayEvent[] = [];

  if (day && day.xp > 0) {
    events.push({
      id: `${date}:coding`,
      date,
      type: "coding",
      title: `${day.xp} Coding XP`,
      description: day.languages[0] ? `Главный язык: ${day.languages[0].name}` : undefined,
      icon: "XP",
    });
  }

  for (const session of pomodoroSessions.filter((session) => session.date === date)) {
    events.push({
      id: session.id,
      date,
      time: timeFromIso(session.endedAt ?? session.startedAt),
      type: "pomodoro",
      title: session.completed ? "Pomodoro завершен" : "Pomodoro прерван",
      description: `${session.completedMinutes}/${session.plannedMinutes} мин`,
      icon: "PO",
    });
  }

  for (const quest of quests.filter((quest) => quest.completed)) {
    events.push({
      id: `${date}:quest:${quest.id}`,
      date,
      type: "quest",
      title: `Квест: ${quest.title}`,
      description: quest.rewardLabel,
      icon: "Q",
    });
  }

  for (const task of tasks.filter((task) => task.date === date)) {
    events.push({
      id: task.id,
      date,
      time: timeFromIso(task.createdAt),
      type: "task",
      title: task.title || task.topic,
      description: `${task.source} · ${task.status}`,
      icon: "TS",
    });
  }

  for (const entry of stepikEntries.filter((entry) => entry.date === date)) {
    events.push({
      id: entry.id,
      date,
      time: timeFromIso(entry.createdAt),
      type: "task",
      title: `Stepik: ${entry.topic}`,
      description: `${entry.tasksSolved} задач`,
      icon: "ST",
    });
  }

  for (const entry of manualStudy.filter((entry) => entry.date === date)) {
    events.push({
      id: entry.id,
      date,
      time: timeFromIso(entry.createdAt),
      type: "manualStudy",
      title: entry.topic ? `Manual study: ${entry.topic}` : "Manual study",
      description: `${entry.minutes} мин · ${entry.type}`,
      icon: "MS",
    });
  }

  for (const achievement of achievements.filter((achievement) => achievement.unlockedAt === date)) {
    events.push({
      id: achievement.id,
      date,
      type: "achievement",
      title: achievement.title,
      description: achievement.rarity,
      icon: "AC",
    });
  }

  for (const boss of bosses.filter((boss) => boss.completedAt?.startsWith(date))) {
    events.push({
      id: boss.id,
      date,
      time: timeFromIso(boss.completedAt),
      type: "boss",
      title: `Boss cleared: ${boss.title}`,
      description: `${boss.reward.adventureXp} Adventure XP`,
      icon: "B",
    });
  }

  for (const item of items.filter((item) => item.unlockedAt?.startsWith(date))) {
    events.push({
      id: item.id,
      date,
      time: timeFromIso(item.unlockedAt),
      type: "item",
      title: `Предмет: ${item.name}`,
      description: item.rarity,
      icon: item.icon,
    });
  }

  if (note && hasDailyNoteContent(note)) {
    events.push({
      id: `${date}:note`,
      date,
      time: timeFromIso(note.updatedAt),
      type: "note",
      title: "Заметка дня",
      description: note.beforeText ? `Цель: ${note.beforeText}` : note.afterText ? `Итог: ${note.afterText}` : note.mood,
      icon: "NT",
    });
  }

  return events.sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
}
