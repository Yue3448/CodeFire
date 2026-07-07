export type Rank = {
  id: string;
  name: string;
  minXp: number;
  badgeImage?: string;
  medalIcon: string;
  shortDescription: string;
  gradient: string;
  accentColor: string;
  glowColor: string;
  nextRank: string | null;
};

export type RankProgression = {
  currentRank: Rank;
  previousRank: Rank | null;
  nextRank: Rank | null;
  xpIntoRank: number;
  xpForRank: number;
  xpToNextRank: number;
  progressPercent: number;
  isMaxRank: boolean;
};

const ranks: Rank[] = [
  {
    id: "spark",
    name: "Искра",
    minXp: 0,
    badgeImage: "/ranks/iskra.png",
    medalIcon: "🔥",
    shortDescription: "Первое тепло CodeFire и старт личного прогресса.",
    gradient: "linear-gradient(135deg, #ff6b2c, #ffd36a)",
    accentColor: "#ff8a2a",
    glowColor: "rgba(255, 138, 42, 0.45)",
    nextRank: "campfire-apprentice",
  },
  {
    id: "campfire-apprentice",
    name: "Ученик костра",
    minXp: 100,
    badgeImage: "/ranks/uchenik-kostra.png",
    medalIcon: "🪵",
    shortDescription: "Фундамент заложен, привычка к ежедневным квестам крепнет.",
    gradient: "linear-gradient(135deg, #9a5a2f, #ffb15c)",
    accentColor: "#ffb15c",
    glowColor: "rgba(255, 177, 92, 0.36)",
    nextRank: "code-novice",
  },
  {
    id: "code-novice",
    name: "Новичок кода",
    minXp: 250,
    badgeImage: "/ranks/novichok-koda.png",
    medalIcon: "⚡",
    shortDescription: "Скорость набирается, первые паттерны становятся привычными.",
    gradient: "linear-gradient(135deg, #facc15, #34d399)",
    accentColor: "#facc15",
    glowColor: "rgba(250, 204, 21, 0.38)",
    nextRank: "apprentice",
  },
  {
    id: "apprentice",
    name: "Подмастерье",
    minXp: 500,
    badgeImage: "/ranks/podmastere.png",
    medalIcon: "🛠️",
    shortDescription: "Инструменты уже в руках, практика превращается в ремесло.",
    gradient: "linear-gradient(135deg, #64748b, #f97316)",
    accentColor: "#f97316",
    glowColor: "rgba(249, 115, 22, 0.36)",
    nextRank: "iron-coder",
  },
  {
    id: "iron-coder",
    name: "Железный кодер",
    minXp: 1000,
    badgeImage: "/ranks/zheleznyy-koder.png",
    medalIcon: "🛡️",
    shortDescription: "Устойчивый темп и крепкая защита от хаоса задач.",
    gradient: "linear-gradient(135deg, #475569, #94a3b8)",
    accentColor: "#94a3b8",
    glowColor: "rgba(148, 163, 184, 0.35)",
    nextRank: "bronze-developer",
  },
  {
    id: "bronze-developer",
    name: "Бронзовый разработчик",
    minXp: 2000,
    badgeImage: "/ranks/bronzovyy-razrabotchik.png",
    medalIcon: "🥉",
    shortDescription: "Практика стала видимой серией побед и накопленного опыта.",
    gradient: "linear-gradient(135deg, #92400e, #f59e0b)",
    accentColor: "#d97706",
    glowColor: "rgba(217, 119, 6, 0.38)",
    nextRank: "silver-developer",
  },
  {
    id: "silver-developer",
    name: "Серебряный разработчик",
    minXp: 3500,
    badgeImage: "/ranks/serebryanyy-razrabotchik.png",
    medalIcon: "🥈",
    shortDescription: "Код становится чище, решения приходят быстрее.",
    gradient: "linear-gradient(135deg, #94a3b8, #e5e7eb)",
    accentColor: "#cbd5e1",
    glowColor: "rgba(203, 213, 225, 0.36)",
    nextRank: "gold-developer",
  },
  {
    id: "gold-developer",
    name: "Золотой разработчик",
    minXp: 5000,
    badgeImage: "/ranks/zolotoy-razrabotchik.png",
    medalIcon: "🥇",
    shortDescription: "Стабильная практика уже выглядит как личная система.",
    gradient: "linear-gradient(135deg, #f59e0b, #fde68a)",
    accentColor: "#fbbf24",
    glowColor: "rgba(251, 191, 36, 0.42)",
    nextRank: "flame-engineer",
  },
  {
    id: "flame-engineer",
    name: "Пламенный инженер",
    minXp: 7500,
    badgeImage: "/ranks/plamennyy-inzhener.png",
    medalIcon: "🧡",
    shortDescription: "Фокус горит ровно, а сложные задачи больше не пугают.",
    gradient: "linear-gradient(135deg, #ea580c, #fb7185)",
    accentColor: "#fb923c",
    glowColor: "rgba(251, 146, 60, 0.44)",
    nextRank: "emerald-engineer",
  },
  {
    id: "emerald-engineer",
    name: "Изумрудный инженер",
    minXp: 10000,
    badgeImage: "/ranks/izumrudnyy-inzhener.png",
    medalIcon: "🟢",
    shortDescription: "Сильный рост, ясный ритм и уверенное техническое мышление.",
    gradient: "linear-gradient(135deg, #059669, #86efac)",
    accentColor: "#34d399",
    glowColor: "rgba(52, 211, 153, 0.44)",
    nextRank: "diamond-engineer",
  },
  {
    id: "diamond-engineer",
    name: "Алмазный инженер",
    minXp: 15000,
    badgeImage: "/ranks/almaznyy-inzhener.png",
    medalIcon: "💎",
    shortDescription: "Навык огранен практикой, решения становятся точнее.",
    gradient: "linear-gradient(135deg, #38bdf8, #c084fc)",
    accentColor: "#7dd3fc",
    glowColor: "rgba(125, 211, 252, 0.42)",
    nextRank: "flame-architect",
  },
  {
    id: "flame-architect",
    name: "Архитектор пламени",
    minXp: 22000,
    badgeImage: "/ranks/arkhitektor-plameni.png",
    medalIcon: "🏛️",
    shortDescription: "Ты уже строишь системы, а не только проходишь задачи.",
    gradient: "linear-gradient(135deg, #f97316, #a78bfa)",
    accentColor: "#a78bfa",
    glowColor: "rgba(167, 139, 250, 0.42)",
    nextRank: "codefire-legend",
  },
  {
    id: "codefire-legend",
    name: "Легенда CodeFire",
    minXp: 30000,
    badgeImage: "/ranks/legenda-codefire.png",
    medalIcon: "👑",
    shortDescription: "Огонь дисциплины уже виден издалека.",
    gradient: "linear-gradient(135deg, #fbbf24, #fb7185)",
    accentColor: "#facc15",
    glowColor: "rgba(250, 204, 21, 0.48)",
    nextRank: "mythic-developer",
  },
  {
    id: "mythic-developer",
    name: "Мифический разработчик",
    minXp: 45000,
    badgeImage: "/ranks/mificheskiy-razrabotchik.png",
    medalIcon: "🌌",
    shortDescription: "Редкая глубина практики и собственная траектория роста.",
    gradient: "linear-gradient(135deg, #312e81, #22d3ee)",
    accentColor: "#22d3ee",
    glowColor: "rgba(34, 211, 238, 0.42)",
    nextRank: "eternal-flame",
  },
  {
    id: "eternal-flame",
    name: "Вечное пламя",
    minXp: 60000,
    badgeImage: "/ranks/vechnoe-plamya.png",
    medalIcon: "☀️",
    shortDescription: "Максимальный ранг текущей эпохи CodeFire.",
    gradient: "linear-gradient(135deg, #fde047, #f97316, #34d399)",
    accentColor: "#fde047",
    glowColor: "rgba(253, 224, 71, 0.52)",
    nextRank: null,
  },
];

export function getAllRanks() {
  return [...ranks];
}

export function getCurrentRank(totalXp: number) {
  const safeXp = Math.max(totalXp, 0);

  return ranks.reduce((current, rank) => (safeXp >= rank.minXp ? rank : current), ranks[0]);
}

export function getNextRank(totalXp: number) {
  const safeXp = Math.max(totalXp, 0);

  return ranks.find((rank) => rank.minXp > safeXp) ?? null;
}

export function getRankProgress(totalXp: number): RankProgression {
  const safeXp = Math.max(totalXp, 0);
  const currentRank = getCurrentRank(safeXp);
  const currentIndex = ranks.findIndex((rank) => rank.id === currentRank.id);
  const previousRank = currentIndex > 0 ? ranks[currentIndex - 1] : null;
  const nextRank = getNextRank(safeXp);

  if (!nextRank) {
    return {
      currentRank,
      previousRank,
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
  const xpToNextRank = nextRank.minXp - safeXp;

  return {
    currentRank,
    previousRank,
    nextRank,
    xpIntoRank,
    xpForRank,
    xpToNextRank,
    progressPercent: Math.min(100, Math.max(0, (xpIntoRank / xpForRank) * 100)),
    isMaxRank: false,
  };
}
