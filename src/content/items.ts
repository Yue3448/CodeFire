import type { CodeFireCondition } from "@/content/conditions";

export type ItemType =
  | "amulet"
  | "ring"
  | "book"
  | "weapon"
  | "cloak"
  | "crown"
  | "artifact"
  | "cosmetic"
  | "badge"
  | "frame"
  | "themeToken";

export type ItemRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type ItemEffect = {
  kind:
    | "questAdventureXpBoost"
    | "languageQuestBoost"
    | "pomodoroQuestBoost"
    | "recoveryBoost"
    | "studyTaskBoost"
    | "cosmeticOnly";
  value?: number;
  language?: string;
};

export type ItemDefinition = {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  unlockCondition: CodeFireCondition;
  effect: ItemEffect;
  source: string;
};

function item(definition: ItemDefinition): ItemDefinition {
  return definition;
}

export const itemCatalog: ItemDefinition[] = [
  item({ id: "amulet-spark", name: "Амулет Искры", description: "+5% Adventure XP за daily quests. Coding XP остается только WakaTime.", type: "amulet", rarity: "common", icon: "AI", unlockCondition: { kind: "codingXp", target: 15, period: "all" }, effect: { kind: "questAdventureXpBoost", value: 5 }, source: "first-coding-xp" }),
  item({ id: "small-fire-stone", name: "Малый огненный камень", description: "Теплый стартовый артефакт CodeFire.", type: "artifact", rarity: "common", icon: "FS", unlockCondition: { kind: "activeDays", target: 1, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "first-active-day" }),
  item({ id: "first-code-rune", name: "Первая руна кода", description: "Знак первого устойчивого дня.", type: "badge", rarity: "common", icon: "CR", unlockCondition: { kind: "codingXp", target: 60, period: "day" }, effect: { kind: "cosmeticOnly" }, source: "daily-xp" }),
  item({ id: "journal-feather", name: "Перо заметок", description: "Косметический предмет за первые заметки.", type: "cosmetic", rarity: "common", icon: "JF", unlockCondition: { kind: "journalNotes", target: 1, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "journal" }),
  item({ id: "small-focus-crystal", name: "Малый фокус-кристалл", description: "+4% Adventure XP за Pomodoro quests.", type: "artifact", rarity: "common", icon: "FC", unlockCondition: { kind: "pomodoroFocus", target: 1, period: "all" }, effect: { kind: "pomodoroQuestBoost", value: 4 }, source: "pomodoro" }),
  item({ id: "novice-frame", name: "Рамка новичка", description: "Простая рамка для первых дней.", type: "frame", rarity: "common", icon: "NF", unlockCondition: { kind: "activeDays", target: 3, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "streak" }),
  item({ id: "ember-badge", name: "Знак уголька", description: "Badge за первый мини-ритм.", type: "badge", rarity: "common", icon: "EB", unlockCondition: { kind: "codingXp", target: 120, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "coding-xp" }),

  item({ id: "serpent-amulet", name: "Змеиный амулет", description: "+10% Adventure XP за Python-квесты.", type: "amulet", rarity: "rare", icon: "SA", unlockCondition: { kind: "languageXp", language: "Python", target: 100, period: "all" }, effect: { kind: "languageQuestBoost", value: 10, language: "Python" }, source: "python" }),
  item({ id: "serpent-blade", name: "Змеиный клинок", description: "Python weapon без влияния на Coding XP.", type: "weapon", rarity: "rare", icon: "SB", unlockCondition: { kind: "languageXp", language: "Python", target: 500, period: "all" }, effect: { kind: "languageQuestBoost", value: 12, language: "Python" }, source: "python" }),
  item({ id: "python-core", name: "Ядро Python", description: "+6% Adventure XP за study tasks.", type: "artifact", rarity: "epic", icon: "PC", unlockCondition: { kind: "languageXp", language: "Python", target: 1000, period: "all" }, effect: { kind: "studyTaskBoost", value: 6, language: "Python" }, source: "python" }),
  item({ id: "book-dictionaries", name: "Том словарей", description: "Награда за словари и related bosses.", type: "book", rarity: "rare", icon: "BD", unlockCondition: { kind: "topicLevel", topic: "dictionaries", target: 2 }, effect: { kind: "cosmeticOnly" }, source: "topics" }),
  item({ id: "loop-rune", name: "Руна циклов", description: "Знак практики циклов.", type: "artifact", rarity: "rare", icon: "LR", unlockCondition: { kind: "topicLevel", topic: "loops", target: 3 }, effect: { kind: "studyTaskBoost", value: 3 }, source: "topics" }),
  item({ id: "function-seal", name: "Печать функций", description: "Знак функций.", type: "badge", rarity: "rare", icon: "FN", unlockCondition: { kind: "topicLevel", topic: "functions", target: 3 }, effect: { kind: "studyTaskBoost", value: 3 }, source: "topics" }),
  item({ id: "oop-crystal", name: "Кристалл ООП", description: "Косметический кристалл ООП.", type: "artifact", rarity: "epic", icon: "OO", unlockCondition: { kind: "topicLevel", topic: "oop", target: 3 }, effect: { kind: "cosmeticOnly" }, source: "topics" }),
  item({ id: "python-foundation-badge", name: "Python Foundation Badge", description: "Badge за устойчивую Python-базу.", type: "badge", rarity: "epic", icon: "PF", unlockCondition: { kind: "languageXp", language: "Python", target: 2500, period: "all" }, effect: { kind: "languageQuestBoost", value: 15, language: "Python" }, source: "python" }),

  item({ id: "endpoint-key", name: "Ключ эндпоинта", description: "Backend starter key.", type: "artifact", rarity: "rare", icon: "EK", unlockCondition: { kind: "topicLevel", topic: "http", target: 2 }, effect: { kind: "cosmeticOnly" }, source: "backend" }),
  item({ id: "fastapi-seal", name: "Печать FastAPI", description: "FastAPI progress seal.", type: "badge", rarity: "epic", icon: "FA", unlockCondition: { kind: "topicLevel", topic: "fastapi", target: 2 }, effect: { kind: "studyTaskBoost", value: 5 }, source: "backend" }),
  item({ id: "http-rune", name: "Руна HTTP", description: "HTTP practice marker.", type: "artifact", rarity: "rare", icon: "HT", unlockCondition: { kind: "studyTasks", target: 3, period: "all", topic: "http" }, effect: { kind: "studyTaskBoost", value: 3 }, source: "backend" }),
  item({ id: "sql-crystal", name: "SQL-кристалл", description: "SQL progress marker.", type: "artifact", rarity: "rare", icon: "SQ", unlockCondition: { kind: "languageXp", language: "SQL", target: 100, period: "all" }, effect: { kind: "languageQuestBoost", value: 8, language: "SQL" }, source: "sql" }),
  item({ id: "docker-helm", name: "Docker-шлем", description: "Docker progress cosmetic.", type: "cosmetic", rarity: "epic", icon: "DK", unlockCondition: { kind: "topicLevel", topic: "docker", target: 2 }, effect: { kind: "cosmeticOnly" }, source: "backend" }),
  item({ id: "server-compass", name: "Серверный компас", description: "Backend navigation item.", type: "artifact", rarity: "rare", icon: "SC", unlockCondition: { kind: "studyTasks", target: 10, period: "all" }, effect: { kind: "studyTaskBoost", value: 4 }, source: "study" }),
  item({ id: "api-artifact", name: "API-артефакт", description: "API progress artifact.", type: "artifact", rarity: "epic", icon: "AA", unlockCondition: { kind: "bossProgress", target: 1 }, effect: { kind: "cosmeticOnly" }, source: "boss" }),
  item({ id: "typed-ring", name: "Typed Ring", description: "+8% Adventure XP за TypeScript quests.", type: "ring", rarity: "rare", icon: "TR", unlockCondition: { kind: "languageXp", language: "TypeScript", target: 100, period: "all" }, effect: { kind: "languageQuestBoost", value: 8, language: "TypeScript" }, source: "typescript" }),

  item({ id: "ring-focus", name: "Кольцо фокуса", description: "+8% Adventure XP за Pomodoro-квесты.", type: "ring", rarity: "rare", icon: "RF", unlockCondition: { kind: "pomodoroFocus", target: 10, period: "all" }, effect: { kind: "pomodoroQuestBoost", value: 8 }, source: "pomodoro" }),
  item({ id: "concentration-watch", name: "Часы концентрации", description: "Focus cosmetic.", type: "artifact", rarity: "rare", icon: "CW", unlockCondition: { kind: "pomodoroFocusMinutes", target: 250, period: "all" }, effect: { kind: "pomodoroQuestBoost", value: 5 }, source: "pomodoro" }),
  item({ id: "deep-focus-amulet", name: "Амулет глубокого фокуса", description: "+12% Pomodoro Adventure XP.", type: "amulet", rarity: "epic", icon: "DF", unlockCondition: { kind: "pomodoroFocus", target: 50, period: "all" }, effect: { kind: "pomodoroQuestBoost", value: 12 }, source: "pomodoro" }),
  item({ id: "break-rune", name: "Руна перерыва", description: "Награда за уважение к отдыху.", type: "artifact", rarity: "rare", icon: "BR", unlockCondition: { kind: "pomodoroFocusBreakPairs", target: 10, period: "all" }, effect: { kind: "recoveryBoost", value: 4 }, source: "pomodoro" }),
  item({ id: "pomodoro-hourglass", name: "Песочные часы Pomodoro", description: "Pomodoro cosmetic.", type: "cosmetic", rarity: "epic", icon: "PH", unlockCondition: { kind: "pomodoroFocus", target: 100, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "pomodoro" }),
  item({ id: "calm-bell", name: "Колокол ритма", description: "Мягкий signal для focus rhythm.", type: "cosmetic", rarity: "common", icon: "CB", unlockCondition: { kind: "pomodoroFocusBreakPairs", target: 1, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "pomodoro" }),

  item({ id: "shield-stability", name: "Щит стабильности", description: "Награда за streak.", type: "artifact", rarity: "epic", icon: "SS", unlockCondition: { kind: "activeDays", target: 7, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "streak" }),
  item({ id: "habit-chain", name: "Цепь привычки", description: "Streak cosmetic.", type: "artifact", rarity: "rare", icon: "HC", unlockCondition: { kind: "activeDays", target: 14, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "streak" }),
  item({ id: "week-fire", name: "Огонь недели", description: "Badge за неделю.", type: "badge", rarity: "rare", icon: "WF", unlockCondition: { kind: "activeDays", target: 5, period: "week" }, effect: { kind: "cosmeticOnly" }, source: "weekly" }),
  item({ id: "seal-14-days", name: "Печать 14 дней", description: "Epic streak seal.", type: "badge", rarity: "epic", icon: "14", unlockCondition: { kind: "activeDays", target: 14, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "streak" }),
  item({ id: "eternal-spark", name: "Вечная искра", description: "Legendary streak spark.", type: "artifact", rarity: "legendary", icon: "ES", unlockCondition: { kind: "activeDays", target: 60, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "streak" }),
  item({ id: "hundred-day-brand", name: "Клеймо 100 дней", description: "Mythic marker for long-term consistency.", type: "badge", rarity: "mythic", icon: "100", unlockCondition: { kind: "activeDays", target: 100, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "streak" }),

  item({ id: "cloak-recovery", name: "Плащ восстановления", description: "+5% Adventure XP для recovery/light day наград.", type: "cloak", rarity: "epic", icon: "RC", unlockCondition: { kind: "recoveryDays", target: 1 }, effect: { kind: "recoveryBoost", value: 5 }, source: "recovery" }),
  item({ id: "moon-amulet", name: "Лунный амулет", description: "Recovery cosmetic.", type: "amulet", rarity: "rare", icon: "MA", unlockCondition: { kind: "lightDays", target: 1 }, effect: { kind: "recoveryBoost", value: 3 }, source: "recovery" }),
  item({ id: "balance-shield", name: "Щит баланса", description: "Награда за здоровый ритм.", type: "artifact", rarity: "epic", icon: "BS", unlockCondition: { kind: "all", conditions: [{ kind: "activeDays", target: 5, period: "week" }, { kind: "journalNotes", target: 3, period: "week" }] }, effect: { kind: "recoveryBoost", value: 6 }, source: "balance" }),
  item({ id: "quiet-campfire", name: "Тихий костер", description: "Light day cosmetic.", type: "cosmetic", rarity: "common", icon: "QC", unlockCondition: { kind: "codingMinutes", target: 15, period: "day" }, effect: { kind: "cosmeticOnly" }, source: "recovery" }),
  item({ id: "rest-rune", name: "Руна отдыха", description: "Break-focused recovery item.", type: "artifact", rarity: "rare", icon: "RR", unlockCondition: { kind: "pomodoroBreak", target: 10, period: "all" }, effect: { kind: "recoveryBoost", value: 4 }, source: "recovery" }),
  item({ id: "soft-rhythm-frame", name: "Рамка мягкого ритма", description: "Frame for balanced weeks.", type: "frame", rarity: "rare", icon: "SR", unlockCondition: { kind: "recoveryDays", target: 3 }, effect: { kind: "cosmeticOnly" }, source: "recovery" }),

  item({ id: "dictionary-trophy", name: "Трофей словарей", description: "Boss trophy.", type: "artifact", rarity: "epic", icon: "DT", unlockCondition: { kind: "bossDefeated", target: 1, bossId: "dictionary-lord" }, effect: { kind: "cosmeticOnly" }, source: "boss" }),
  item({ id: "debug-lens", name: "Линза отладки", description: "Debug boss item.", type: "artifact", rarity: "epic", icon: "DL", unlockCondition: { kind: "bossDefeated", target: 1, bossId: "debug-labyrinth" }, effect: { kind: "cosmeticOnly" }, source: "boss" }),
  item({ id: "first-api-key", name: "Ключ первого API", description: "API boss reward.", type: "artifact", rarity: "rare", icon: "AK", unlockCondition: { kind: "bossProgress", target: 1 }, effect: { kind: "cosmeticOnly" }, source: "boss" }),
  item({ id: "boss-slayer-crown", name: "Корона Boss Slayer", description: "Legendary boss crown.", type: "crown", rarity: "legendary", icon: "BC", unlockCondition: { kind: "bossDefeated", target: 3 }, effect: { kind: "cosmeticOnly" }, source: "boss" }),
  item({ id: "raider-seal", name: "Печать рейдера", description: "Raid marker.", type: "badge", rarity: "rare", icon: "RS", unlockCondition: { kind: "bossDefeated", target: 1 }, effect: { kind: "cosmeticOnly" }, source: "raid" }),
  item({ id: "legendary-boss-mark", name: "Метка легендарного босса", description: "Mythic trophy for legendary bosses.", type: "badge", rarity: "mythic", icon: "LB", unlockCondition: { kind: "bossDefeated", target: 1, difficulty: "legendary" }, effect: { kind: "cosmeticOnly" }, source: "boss" }),

  item({ id: "season-frame", name: "Сезонная рамка", description: "Season cosmetic frame.", type: "frame", rarity: "rare", icon: "SF", unlockCondition: { kind: "seasonLevel", target: 1 }, effect: { kind: "cosmeticOnly" }, source: "season" }),
  item({ id: "backend-initiation-token", name: "Backend Initiation Token", description: "Backend season marker.", type: "themeToken", rarity: "rare", icon: "BI", unlockCondition: { kind: "topicLevel", topic: "http", target: 2 }, effect: { kind: "cosmeticOnly" }, source: "season" }),
  item({ id: "gold-forge-theme", name: "Gold Forge Theme Token", description: "Gold theme token.", type: "themeToken", rarity: "legendary", icon: "GF", unlockCondition: { kind: "seasonLevel", target: 10 }, effect: { kind: "cosmeticOnly" }, source: "season" }),
  item({ id: "emerald-engineer-token", name: "Emerald Engineer Token", description: "Emerald theme token.", type: "themeToken", rarity: "epic", icon: "EE", unlockCondition: { kind: "codingXp", target: 2500, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "season" }),
  item({ id: "season-pass-badge", name: "Season Pass Badge", description: "Badge за season XP.", type: "badge", rarity: "rare", icon: "SP", unlockCondition: { kind: "seasonXp", target: 500 }, effect: { kind: "cosmeticOnly" }, source: "season" }),
  item({ id: "season-hero-frame", name: "Season Hero Frame", description: "Frame за высокий season level.", type: "frame", rarity: "epic", icon: "HF", unlockCondition: { kind: "seasonLevel", target: 5 }, effect: { kind: "cosmeticOnly" }, source: "season" }),

  item({ id: "crown-codefire", name: "Корона CodeFire", description: "Legendary rank reward.", type: "crown", rarity: "legendary", icon: "CC", unlockCondition: { kind: "rankReached", rankId: "zolotoy-razrabotchik", rankName: "Золотой разработчик" }, effect: { kind: "cosmeticOnly" }, source: "rank" }),
  item({ id: "mythic-core", name: "Мифическое ядро", description: "Mythic late-game artifact.", type: "artifact", rarity: "mythic", icon: "MC", unlockCondition: { kind: "codingXp", target: 10000, period: "all" }, effect: { kind: "cosmeticOnly" }, source: "rank" }),
  item({ id: "eternal-flame", name: "Вечное пламя", description: "Highest-rank flame.", type: "artifact", rarity: "mythic", icon: "EF", unlockCondition: { kind: "rankReached", rankId: "vechnoe-plamya", rankName: "Вечное пламя" }, effect: { kind: "cosmeticOnly" }, source: "rank" }),
  item({ id: "architect-seal", name: "Архитекторская печать", description: "Mythic architecture marker.", type: "artifact", rarity: "mythic", icon: "AS", unlockCondition: { kind: "rankReached", rankId: "arkhitektor-plameni", rankName: "Архитектор пламени" }, effect: { kind: "cosmeticOnly" }, source: "rank" }),
  item({ id: "developer-eye", name: "Око разработчика", description: "Mythic inspection cosmetic.", type: "cosmetic", rarity: "mythic", icon: "DE", unlockCondition: { kind: "achievementsUnlocked", target: 75 }, effect: { kind: "cosmeticOnly" }, source: "achievements" }),
  item({ id: "legend-frame", name: "Легендарная рамка", description: "Frame for top CodeFire ranks.", type: "frame", rarity: "legendary", icon: "LF", unlockCondition: { kind: "rankReached", rankId: "legenda-codefire", rankName: "Легенда CodeFire" }, effect: { kind: "cosmeticOnly" }, source: "rank" }),
  item({ id: "mythic-theme-token", name: "Mythic Theme Token", description: "Mythic cosmetic theme token.", type: "themeToken", rarity: "mythic", icon: "MT", unlockCondition: { kind: "achievementsUnlocked", target: 100 }, effect: { kind: "cosmeticOnly" }, source: "achievements" }),
];
