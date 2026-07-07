import { getStableIndex } from "@/lib/codefire-config";
import type { DailyNoteMood } from "@/lib/daily-notes";
import type { DailyQuest } from "@/lib/quests";

export type DailyTitle = {
  title: string;
  description: string;
};

const calmTitles = ["День подготовки", "Тишина перед стартом", "Лагерь отдыха", "Спокойный практик"];

const sharedTitles = [
  "Кузнец XP",
  "Хранитель серии",
  "Охотник за задачами",
  "Ночной кодер",
  "Пламенный практик",
  "Архитектор фокуса",
  "Повелитель циклов",
  "Рыцарь отладки",
  "Мастер коротких сессий",
  "Страж Pomodoro",
  "Разжигатель CodeFire",
];

const languageTitles: Record<string, string[]> = {
  python: ["Python Adept", "Укротитель словарей", "Заклинатель функций", "Пещера циклов"],
  typescript: ["TypeScript Adept", "Типизированный страж", "Башня интерфейсов"],
  javascript: ["JavaScript Adept", "Повелитель событий", "Навигатор браузера"],
};

function xpGroup(todayXP: number) {
  if (todayXP >= 240) return "high";
  if (todayXP >= 120) return "strong";
  if (todayXP >= 30) return "steady";
  if (todayXP > 0) return "spark";
  return "rest";
}

function normalizedLanguage(language: string) {
  return language.trim().toLowerCase();
}

function titlePool(mainLanguage: string, focusPercent: number, completedQuests: number, pomodoroFocusSessions: number, streak: number, mood?: DailyNoteMood) {
  const languageKey = normalizedLanguage(mainLanguage);
  const pool = [
    ...(languageTitles[languageKey] ?? [`${mainLanguage} Adept`]),
    ...sharedTitles,
  ];

  if (focusPercent >= 80) {
    pool.push("Архитектор фокуса", "Мастер глубокого фокуса");
  }

  if (completedQuests >= 3) {
    pool.push("Закрыватель квестов", "Охотник за задачами");
  }

  if (pomodoroFocusSessions >= 2) {
    pool.push("Страж Pomodoro", "Мастер коротких сессий");
  }

  if (streak >= 7) {
    pool.push("Хранитель серии", "Пламя недели");
  }

  if (mood === "hard") {
    pool.push("Спокойный практик");
  }

  if (mood === "max") {
    pool.push("Рыцарь отладки");
  }

  return pool;
}

export function getDailyTitle({
  date,
  mainLanguage,
  todayXP,
  focusPercent,
  completedQuests,
  pomodoroFocusSessions = 0,
  streak = 0,
  mood,
}: {
  date: string;
  mainLanguage: string;
  todayXP: number;
  focusPercent: number;
  completedQuests: DailyQuest[];
  pomodoroFocusSessions?: number;
  streak?: number;
  mood?: DailyNoteMood;
}): DailyTitle {
  if (todayXP <= 0) {
    const title = calmTitles[getStableIndex(`${date}:rest:${mood ?? "none"}`, calmTitles.length)];

    return {
      title,
      description: "Сегодня можно начать мягко: короткая сессия тоже засчитывается как забота о прогрессе.",
    };
  }

  const group = xpGroup(todayXP);
  const pool = titlePool(
    mainLanguage,
    focusPercent,
    completedQuests.length,
    pomodoroFocusSessions,
    streak,
    mood,
  );
  const seed = [
    date,
    normalizedLanguage(mainLanguage),
    group,
    Math.floor(focusPercent / 20),
    completedQuests.length,
    pomodoroFocusSessions,
    streak >= 7 ? "streak" : "fresh",
    mood ?? "none",
  ].join(":");
  const title = pool[getStableIndex(seed, pool.length)];
  const description =
    completedQuests.length > 0
      ? `${completedQuests.length} квестов закрыто сегодня. Титул закреплён за текущим ритмом дня.`
      : "Титул дня закреплён детерминированно и не прыгает при refresh.";

  return {
    title,
    description,
  };
}
