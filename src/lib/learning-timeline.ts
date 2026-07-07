import type { Achievement } from "@/lib/achievements";
import type { BossFight } from "@/lib/boss-fights";
import { hasDailyNoteContent, type DailyNote } from "@/lib/daily-notes";
import type { InventoryItem } from "@/lib/inventory";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { StepikEntry } from "@/lib/stepik";
import type { TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity } from "@/lib/types";

export type LearningTimelineEvent = {
  id: string;
  date: string;
  time?: string;
  type:
    | "rank"
    | "languageLevel"
    | "achievement"
    | "boss"
    | "item"
    | "season"
    | "record"
    | "stepik"
    | "note"
    | "topic"
    | "pomodoro"
    | "goal"
    | "profile";
  title: string;
  description?: string;
  icon?: string;
  rarity?: "common" | "rare" | "epic" | "legendary" | "mythic";
  sourceId?: string;
};

export type TimelinePeriod = "all" | "30d" | "90d" | "365d";

export function dedupeTimelineEvents(events: LearningTimelineEvent[]) {
  const byKey = new Map<string, LearningTimelineEvent>();

  for (const event of events) {
    const key = event.id || `${event.type}:${event.sourceId ?? event.title}:${event.date}`;
    byKey.set(key, event);
  }

  return [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? ""));
}

export function getTimelineEvents(events: LearningTimelineEvent[], period: TimelinePeriod = "all") {
  if (period === "all") {
    return dedupeTimelineEvents(events);
  }

  const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  const startKey = start.toISOString().slice(0, 10);

  return dedupeTimelineEvents(events).filter((event) => event.date >= startKey);
}

export function groupTimelineByMonth(events: LearningTimelineEvent[]) {
  return dedupeTimelineEvents(events).reduce<Array<{ month: string; events: LearningTimelineEvent[] }>>((groups, event) => {
    const month = event.date.slice(0, 7);
    const current = groups.find((group) => group.month === month);

    if (current) {
      current.events.push(event);
    } else {
      groups.push({ month, events: [event] });
    }

    return groups;
  }, []);
}

export function generateTimelineFromData({
  days,
  achievements,
  bosses,
  items,
  notes,
  topics,
  stepikEntries,
  pomodoroStats,
  rankName,
  seasonTitle,
}: {
  days: DailyCodingActivity[];
  achievements: Achievement[];
  bosses: BossFight[];
  items: InventoryItem[];
  notes: DailyNote[];
  topics: TopicProgress[];
  stepikEntries: StepikEntry[];
  pomodoroStats?: PomodoroStats;
  rankName?: string;
  seasonTitle?: string;
}): LearningTimelineEvent[] {
  const events: LearningTimelineEvent[] = [];
  const firstActiveDay = days.find((day) => day.xp > 0);

  if (firstActiveDay) {
    events.push({
      id: "first-active-day",
      date: firstActiveDay.date,
      type: "record",
      title: "Запущен CodeFire",
      description: `${firstActiveDay.xp} Coding XP`,
      icon: "🔥",
      rarity: "common",
    });
  }

  if (rankName && days.some((day) => day.xp > 0)) {
    events.push({
      id: "current-rank",
      date: days.filter((day) => day.xp > 0).at(-1)?.date ?? firstActiveDay?.date ?? "",
      type: "rank",
      title: `Текущий ранг: ${rankName}`,
      icon: "🏅",
      rarity: "rare",
    });
  }

  if (seasonTitle && firstActiveDay) {
    events.push({
      id: "season-start",
      date: firstActiveDay.date,
      type: "season",
      title: seasonTitle,
      description: "Активный сезон обучения",
      icon: "◈",
      rarity: "rare",
    });
  }

  for (const achievement of achievements.filter((item) => item.unlocked && item.unlockedAt)) {
    events.push({
      id: `achievement:${achievement.id}`,
      date: achievement.unlockedAt as string,
      type: "achievement",
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity,
      sourceId: achievement.id,
    });
  }

  for (const boss of bosses.filter((item) => item.completedAt)) {
    events.push({
      id: boss.id,
      date: boss.completedAt?.slice(0, 10) ?? "",
      type: "boss",
      title: `Побеждён босс: ${boss.title}`,
      description: `${boss.reward.adventureXp} Adventure XP`,
      icon: "⚔",
      rarity: boss.difficulty === "legendary" ? "legendary" : boss.difficulty === "epic" ? "epic" : "rare",
      sourceId: boss.id,
    });
  }

  for (const item of items.filter((entry) => entry.unlockedAt)) {
    events.push({
      id: `item:${item.id}`,
      date: item.unlockedAt?.slice(0, 10) ?? "",
      type: "item",
      title: item.name,
      description: item.description,
      icon: item.icon,
      rarity: item.rarity,
      sourceId: item.id,
    });
  }

  for (const note of notes.filter(hasDailyNoteContent)) {
    events.push({
      id: `note-${note.date}`,
      date: note.date,
      type: "note",
      title: "Заметка дня",
      description: note.mood,
      icon: "✎",
    });
  }

  for (const topic of topics.filter((entry) => entry.level >= 2 && entry.lastPracticedAt).slice(0, 10)) {
    events.push({
      id: `topic-${topic.id}`,
      date: topic.lastPracticedAt as string,
      type: "topic",
      title: `${topic.name} Level ${topic.level}`,
      description: `${topic.xp} Topic XP`,
      icon: "◆",
      rarity: topic.level >= 5 ? "epic" : "rare",
      sourceId: topic.id,
    });
  }

  for (const entry of stepikEntries.filter((item) => item.tasksSolved > 0)) {
    events.push({
      id: `stepik-${entry.id}`,
      date: entry.date,
      type: "stepik",
      title: `Stepik: ${entry.topic}`,
      description: `${entry.tasksSolved} задач`,
      icon: "S",
      rarity: entry.tasksSolved >= 5 ? "rare" : "common",
      sourceId: entry.id,
    });
  }

  if (pomodoroStats?.bestDay) {
    events.push({
      id: "pomodoro-best",
      date: pomodoroStats.bestDay.date,
      type: "pomodoro",
      title: "Лучший Pomodoro-день",
      description: `${pomodoroStats.bestDay.completedSessions} сессий`,
      icon: "⏱",
      rarity: "rare",
    });
  }

  return dedupeTimelineEvents(events.filter((event) => event.date)).slice(0, 80);
}

export const getLearningTimeline = generateTimelineFromData;
