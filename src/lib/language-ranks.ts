import { clampPercent } from "@/lib/codefire-config";

export type LanguageRank = {
  id: string;
  name: string;
  minXp: number;
  shortDescription: string;
  accentColor: string;
  glowColor: string;
  badge: string;
};

export type LanguageRankProgress = {
  currentRank: LanguageRank;
  nextRank: LanguageRank | null;
  xpIntoRank: number;
  xpForRank: number;
  xpToNextRank: number;
  progressPercent: number;
  isMaxRank: boolean;
};

const languageRanks: LanguageRank[] = [
  {
    id: "novice",
    name: "Новичок",
    minXp: 0,
    shortDescription: "Первые подходы к языку и базовый разогрев.",
    accentColor: "#a1a1aa",
    glowColor: "rgba(161, 161, 170, 0.22)",
    badge: "I",
  },
  {
    id: "student",
    name: "Ученик",
    minXp: 50,
    shortDescription: "Синтаксис уже начинает ложиться в руки.",
    accentColor: "#fb923c",
    glowColor: "rgba(251, 146, 60, 0.28)",
    badge: "II",
  },
  {
    id: "practitioner",
    name: "Практик",
    minXp: 150,
    shortDescription: "Язык используется в реальных задачах, не только в разминке.",
    accentColor: "#facc15",
    glowColor: "rgba(250, 204, 21, 0.28)",
    badge: "III",
  },
  {
    id: "apprentice",
    name: "Подмастерье",
    minXp: 300,
    shortDescription: "Появляется уверенный ритм и память на частые паттерны.",
    accentColor: "#84cc16",
    glowColor: "rgba(132, 204, 22, 0.26)",
    badge: "IV",
  },
  {
    id: "confident-coder",
    name: "Уверенный кодер",
    minXp: 600,
    shortDescription: "Решения становятся быстрее, а пауз на поиск меньше.",
    accentColor: "#34d399",
    glowColor: "rgba(52, 211, 153, 0.3)",
    badge: "V",
  },
  {
    id: "craftsperson",
    name: "Ремесленник",
    minXp: 1000,
    shortDescription: "Язык превращается в рабочий инструмент, а не отдельную преграду.",
    accentColor: "#22c55e",
    glowColor: "rgba(34, 197, 94, 0.3)",
    badge: "VI",
  },
  {
    id: "advanced-developer",
    name: "Продвинутый разработчик",
    minXp: 1600,
    shortDescription: "Есть устойчивость, скорость и узнаваемый стиль решений.",
    accentColor: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.3)",
    badge: "VII",
  },
  {
    id: "expert",
    name: "Эксперт",
    minXp: 2500,
    shortDescription: "Сложные задачи уже раскладываются на понятные шаги.",
    accentColor: "#a78bfa",
    glowColor: "rgba(167, 139, 250, 0.34)",
    badge: "VIII",
  },
  {
    id: "language-master",
    name: "Мастер языка",
    minXp: 4000,
    shortDescription: "Глубокое владение, зрелые решения и стабильная практика.",
    accentColor: "#fb7185",
    glowColor: "rgba(251, 113, 133, 0.34)",
    badge: "IX",
  },
  {
    id: "language-architect",
    name: "Архитектор языка",
    minXp: 6000,
    shortDescription: "Язык стал частью твоей инженерной системы мышления.",
    accentColor: "#fde047",
    glowColor: "rgba(253, 224, 71, 0.38)",
    badge: "X",
  },
];

export function getLanguageRank(languageXp: number) {
  const safeXp = Math.max(languageXp, 0);

  return languageRanks.reduce(
    (current, rank) => (safeXp >= rank.minXp ? rank : current),
    languageRanks[0],
  );
}

export function getNextLanguageRank(languageXp: number) {
  const safeXp = Math.max(languageXp, 0);

  return languageRanks.find((rank) => rank.minXp > safeXp) ?? null;
}

export function getLanguageRankProgress(languageXp: number): LanguageRankProgress {
  const safeXp = Math.max(languageXp, 0);
  const currentRank = getLanguageRank(safeXp);
  const nextRank = getNextLanguageRank(safeXp);

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      xpIntoRank: safeXp - currentRank.minXp,
      xpForRank: 0,
      xpToNextRank: 0,
      progressPercent: 100,
      isMaxRank: true,
    };
  }

  const xpIntoRank = safeXp - currentRank.minXp;
  const xpForRank = nextRank.minXp - currentRank.minXp;

  return {
    currentRank,
    nextRank,
    xpIntoRank,
    xpForRank,
    xpToNextRank: nextRank.minXp - safeXp,
    progressPercent: clampPercent((xpIntoRank / xpForRank) * 100),
    isMaxRank: false,
  };
}
