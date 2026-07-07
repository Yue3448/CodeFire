import type { CodeFireCondition } from "@/content/conditions";

export type AchievementCategory =
  | "start"
  | "daily"
  | "streak"
  | "language"
  | "pomodoro"
  | "journal"
  | "studyTasks"
  | "stepik"
  | "topic"
  | "boss"
  | "inventory"
  | "season"
  | "balance"
  | "rank";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  condition: CodeFireCondition;
};

function achievement(definition: AchievementDefinition): AchievementDefinition {
  return definition;
}

const startAchievements: AchievementDefinition[] = [
  achievement({ id: "first-xp", title: "Первый XP", description: "Получить первый WakaTime Coding XP.", category: "start", rarity: "common", icon: "FX", condition: { kind: "codingXp", target: 1, period: "all" } }),
  achievement({ id: "first-codefire-day", title: "Первый день CodeFire", description: "Первый активный день в CodeFire.", category: "start", rarity: "common", icon: "CD", condition: { kind: "activeDays", target: 1, period: "all" } }),
  achievement({ id: "first-python-day", title: "Первый Python-день", description: "Первый день с Python.", category: "start", rarity: "common", icon: "PY", condition: { kind: "languageMinutes", language: "Python", target: 1, period: "all" } }),
  achievement({ id: "first-note", title: "Первая заметка", description: "Сохранить первую заметку.", category: "start", rarity: "common", icon: "NT", condition: { kind: "journalNotes", target: 1, period: "all" } }),
  achievement({ id: "first-pomodoro", title: "Первый Pomodoro", description: "Завершить первую focus-сессию.", category: "start", rarity: "common", icon: "PO", condition: { kind: "pomodoroFocus", target: 1, period: "all" } }),
  achievement({ id: "first-study-task", title: "Первая задача", description: "Добавить первую учебную задачу.", category: "start", rarity: "common", icon: "TS", condition: { kind: "studyTasks", target: 1, period: "all" } }),
  achievement({ id: "first-item", title: "Первый предмет", description: "Открыть первый предмет.", category: "start", rarity: "common", icon: "IT", condition: { kind: "inventoryItems", target: 1 } }),
  achievement({ id: "first-quest", title: "Первый квест", description: "Закрыть первый квест.", category: "start", rarity: "common", icon: "QU", condition: { kind: "achievementsUnlocked", target: 1 } }),
  achievement({ id: "first-raid", title: "Первый рейд", description: "Закрыть первый рейд.", category: "start", rarity: "rare", icon: "RD", condition: { kind: "bossDefeated", target: 1 } }),
  achievement({ id: "first-boss-progress", title: "Первый boss progress", description: "Сделать первый прогресс по боссу.", category: "start", rarity: "rare", icon: "BS", condition: { kind: "bossProgress", target: 1 } }),
];

const dailyAchievements: AchievementDefinition[] = [
  ...[15, 60, 120, 180, 240, 360, 500].map((target) =>
    achievement({
      id: `daily-xp-${target}`,
      title: `${target} XP за день`,
      description: `Достичь ${target} Coding XP за один день.`,
      category: "daily",
      rarity: target >= 500 ? "legendary" : target >= 240 ? "epic" : target >= 120 ? "rare" : "common",
      icon: "XP",
      condition: { kind: "codingXp", target, period: "day" },
    }),
  ),
  ...[120, 240, 360].map((target) =>
    achievement({
      id: `daily-minutes-${target}`,
      title: `${target / 60} ч кодинга`,
      description: `${target} минут реальной WakaTime-активности за день.`,
      category: "daily",
      rarity: target >= 360 ? "legendary" : target >= 240 ? "epic" : "rare",
      icon: "TM",
      condition: { kind: "codingMinutes", target, period: "day" },
    }),
  ),
];

const streakAchievements: AchievementDefinition[] = [
  ...[3, 7, 14, 30, 60, 100].map((target) =>
    achievement({
      id: `streak-${target}`,
      title: `${target} дней подряд`,
      description: `Поддержать серию ${target} активных дней.`,
      category: "streak",
      rarity: target >= 100 ? "mythic" : target >= 30 ? "legendary" : target >= 14 ? "epic" : "rare",
      icon: "ST",
      condition: { kind: "activeDays", target, period: "all" },
    }),
  ),
  achievement({ id: "streak-recovered", title: "Серия восстановлена", description: "Вернуться к практике после нулевого дня.", category: "streak", rarity: "rare", icon: "SR", condition: { kind: "activeDays", target: 2, period: "all" } }),
  achievement({ id: "streak-light-5", title: "5 легких дней", description: "Пять мягких активных дней без срыва.", category: "balance", rarity: "rare", icon: "LD", condition: { kind: "lightDays", target: 5 } }),
];

const languageAchievements: AchievementDefinition[] = [
  ...[100, 500, 1000, 2500, 5000].map((target) =>
    achievement({
      id: `python-xp-${target}`,
      title: `Python ${target} XP`,
      description: `Накопить ${target} Coding XP в Python.`,
      category: "language",
      rarity: target >= 5000 ? "legendary" : target >= 1000 ? "epic" : target >= 500 ? "rare" : "common",
      icon: "PY",
      condition: { kind: "languageXp", language: "Python", target, period: "all" },
    }),
  ),
  achievement({ id: "typescript-xp-100", title: "TypeScript 100 XP", description: "Накопить 100 XP в TypeScript.", category: "language", rarity: "common", icon: "TS", condition: { kind: "languageXp", language: "TypeScript", target: 100, period: "all" } }),
  achievement({ id: "typescript-xp-500", title: "TypeScript 500 XP", description: "Накопить 500 XP в TypeScript.", category: "language", rarity: "rare", icon: "TS", condition: { kind: "languageXp", language: "TypeScript", target: 500, period: "all" } }),
  achievement({ id: "sql-xp-100", title: "SQL 100 XP", description: "Накопить 100 XP в SQL.", category: "language", rarity: "common", icon: "SQ", condition: { kind: "languageXp", language: "SQL", target: 100, period: "all" } }),
  achievement({ id: "language-focus-90", title: "Deep focus 90%", description: "Один день с 90% фокуса на одном языке.", category: "language", rarity: "rare", icon: "FC", condition: { kind: "focusPercent", target: 90, period: "all" } }),
  achievement({ id: "python-main-7", title: "7 Python-дней", description: "Семь дней с Python как главным языком.", category: "language", rarity: "epic", icon: "P7", condition: { kind: "languageMinutes", language: "Python", target: 7, period: "all" } }),
];

const pomodoroAchievements: AchievementDefinition[] = [
  ...[1, 10, 50, 100].map((target) =>
    achievement({
      id: `pomodoro-total-${target}`,
      title: `${target} Pomodoro`,
      description: `Завершить ${target} focus-сессий.`,
      category: "pomodoro",
      rarity: target >= 100 ? "legendary" : target >= 50 ? "epic" : target >= 10 ? "rare" : "common",
      icon: "PO",
      condition: { kind: "pomodoroFocus", target, period: "all" },
    }),
  ),
  achievement({ id: "pomodoro-day-4", title: "4 Pomodoro за день", description: "Четыре focus-сессии за день.", category: "pomodoro", rarity: "epic", icon: "P4", condition: { kind: "pomodoroFocus", target: 4, period: "day" } }),
  achievement({ id: "pomodoro-streak-7", title: "7 дней с Pomodoro", description: "Семь дней Pomodoro-практики.", category: "pomodoro", rarity: "rare", icon: "P7", condition: { kind: "pomodoroFocus", target: 7, period: "all" } }),
  achievement({ id: "pomodoro-break-pairs-10", title: "10 focus+break", description: "Десять пар focus и break.", category: "pomodoro", rarity: "rare", icon: "PB", condition: { kind: "pomodoroFocusBreakPairs", target: 10, period: "all" } }),
  achievement({ id: "pomodoro-minutes-1000", title: "1000 focus minutes", description: "1000 минут Pomodoro-фокуса.", category: "pomodoro", rarity: "epic", icon: "PM", condition: { kind: "pomodoroFocusMinutes", target: 1000, period: "all" } }),
];

const journalAchievements: AchievementDefinition[] = [
  ...[1, 7, 30, 100].map((target) =>
    achievement({
      id: `journal-notes-${target}`,
      title: `${target} заметок`,
      description: `Собрать ${target} дневниковых заметок.`,
      category: "journal",
      rarity: target >= 100 ? "legendary" : target >= 30 ? "epic" : target >= 7 ? "rare" : "common",
      icon: "JN",
      condition: { kind: "journalNotes", target, period: "all" },
    }),
  ),
  achievement({ id: "journal-before-first", title: "Первый Before note", description: "Записать первый план перед практикой.", category: "journal", rarity: "common", icon: "BF", condition: { kind: "journalNotes", target: 1, field: "before", period: "all" } }),
  achievement({ id: "journal-after-first", title: "Первый After note", description: "Записать первый итог после практики.", category: "journal", rarity: "common", icon: "AF", condition: { kind: "journalNotes", target: 1, field: "after", period: "all" } }),
  achievement({ id: "journal-before-after-7", title: "7 Before/After notes", description: "Семь заметок с планом или итогом.", category: "journal", rarity: "rare", icon: "BA", condition: { kind: "journalNotes", target: 7, period: "all" } }),
  achievement({ id: "journal-hard-day", title: "Заметка после hard day", description: "Рефлексия после тяжелого дня.", category: "journal", rarity: "rare", icon: "HD", condition: { kind: "journalNotes", target: 1, period: "all" } }),
  achievement({ id: "journal-max-survived", title: "Выжил максимум", description: "Заметка с самым тяжелым настроением.", category: "journal", rarity: "rare", icon: "MX", condition: { kind: "journalNotes", target: 1, period: "all" } }),
];

const studyAchievements: AchievementDefinition[] = [
  ...[1, 10, 50, 100].map((target) =>
    achievement({
      id: `study-tasks-${target}`,
      title: `${target} задач`,
      description: `Решить или разобрать ${target} учебных задач.`,
      category: "studyTasks",
      rarity: target >= 100 ? "legendary" : target >= 50 ? "epic" : target >= 10 ? "rare" : "common",
      icon: "TK",
      condition: { kind: "studyTasks", target, period: "all" },
    }),
  ),
  achievement({ id: "study-day-3", title: "3 задачи за день", description: "Три учебные задачи за один день.", category: "studyTasks", rarity: "rare", icon: "T3", condition: { kind: "studyTasks", target: 3, period: "day" } }),
  achievement({ id: "study-day-5", title: "5 задач за день", description: "Пять учебных задач за один день.", category: "studyTasks", rarity: "epic", icon: "T5", condition: { kind: "studyTasks", target: 5, period: "day" } }),
  achievement({ id: "study-difficulty-5", title: "Первая difficulty 5", description: "Решить задачу сложности 5.", category: "studyTasks", rarity: "epic", icon: "D5", condition: { kind: "studyTasks", target: 1, period: "all", minDifficulty: 5 } }),
  achievement({ id: "study-topic-10", title: "10 задач по теме", description: "Десять задач по одной теме.", category: "studyTasks", rarity: "rare", icon: "TT", condition: { kind: "studyTasks", target: 10, period: "all" } }),
  achievement({ id: "study-python-core-50", title: "50 задач Python Core", description: "Пятьдесят задач по Python Core.", category: "studyTasks", rarity: "legendary", icon: "PC", condition: { kind: "studyTasks", target: 50, period: "all", topic: "python core" } }),
];

const stepikAchievements: AchievementDefinition[] = [
  ...[1, 10, 50, 100].map((target) =>
    achievement({
      id: `stepik-tasks-${target}`,
      title: `${target} Stepik-задач`,
      description: `${target} задач Stepik.`,
      category: "stepik",
      rarity: target >= 100 ? "legendary" : target >= 50 ? "epic" : target >= 10 ? "rare" : "common",
      icon: "SK",
      condition: { kind: "stepikTasks", target, period: "all" },
    }),
  ),
  achievement({ id: "stepik-day-3", title: "3 Stepik за день", description: "Три Stepik-задачи за день.", category: "stepik", rarity: "rare", icon: "S3", condition: { kind: "stepikTasks", target: 3, period: "day" } }),
  achievement({ id: "stepik-streak-7", title: "7 дней со Stepik", description: "Stepik-практика семь дней подряд.", category: "stepik", rarity: "epic", icon: "S7", condition: { kind: "stepikStreak", target: 7 } }),
  achievement({ id: "stepik-dictionaries-topic", title: "Тема словарей закрыта", description: "Значимый прогресс по словарям.", category: "stepik", rarity: "rare", icon: "SD", condition: { kind: "stepikTasks", target: 10, topic: "dictionaries", period: "all" } }),
  achievement({ id: "stepik-hard-win", title: "Тяжелая Stepik-победа", description: "Stepik difficulty 5.", category: "stepik", rarity: "epic", icon: "SH", condition: { kind: "stepikTasks", target: 1, minDifficulty: 5, period: "all" } }),
];

const topicAchievements: AchievementDefinition[] = [
  ["dictionaries", "Словари level 2", 2],
  ["dictionaries", "Словари level 5", 5],
  ["loops", "Циклы level 5", 5],
  ["functions", "Функции level 3", 3],
  ["git", "Git first progress", 2],
  ["sql", "SQL first progress", 2],
  ["fastapi", "FastAPI first progress", 2],
  ["docker", "Docker first progress", 2],
].map(([topic, title, target]) =>
  achievement({
    id: `topic-${topic}-level-${target}`,
    title: String(title),
    description: `Достичь уровня ${target} по теме ${topic}.`,
    category: "topic",
    rarity: Number(target) >= 5 ? "epic" : "rare",
    icon: "TP",
    condition: { kind: "topicLevel", topic: String(topic), target: Number(target) },
  }),
);

const bossAchievements: AchievementDefinition[] = [
  achievement({ id: "boss-created", title: "Первый босс создан", description: "Создать или активировать первого босса.", category: "boss", rarity: "common", icon: "BC", condition: { kind: "bossActive", target: 1 } }),
  achievement({ id: "boss-defeated-first", title: "Первый босс побежден", description: "Победить первого босса.", category: "boss", rarity: "rare", icon: "B1", condition: { kind: "bossDefeated", target: 1 } }),
  achievement({ id: "boss-defeated-3", title: "3 босса побеждено", description: "Победить трех боссов.", category: "boss", rarity: "epic", icon: "B3", condition: { kind: "bossDefeated", target: 3 } }),
  achievement({ id: "boss-hard-defeated", title: "Hard boss defeated", description: "Победить hard boss.", category: "boss", rarity: "epic", icon: "BH", condition: { kind: "bossDefeated", target: 1, difficulty: "hard" } }),
  achievement({ id: "boss-legendary-defeated", title: "Legendary boss defeated", description: "Победить legendary boss.", category: "boss", rarity: "legendary", icon: "BL", condition: { kind: "bossDefeated", target: 1, difficulty: "legendary" } }),
  achievement({ id: "boss-dictionary-lord", title: "Повелитель словарей defeated", description: "Победить босса словарей.", category: "boss", rarity: "epic", icon: "BD", condition: { kind: "bossDefeated", target: 1, bossId: "dictionary-lord" } }),
  achievement({ id: "boss-debug-labyrinth", title: "Debug Labyrinth defeated", description: "Пройти отладочный лабиринт.", category: "boss", rarity: "epic", icon: "DB", condition: { kind: "bossDefeated", target: 1, bossId: "debug-labyrinth" } }),
];

const inventoryAchievements: AchievementDefinition[] = [
  achievement({ id: "inventory-first", title: "Первый предмет", description: "Открыть первый предмет.", category: "inventory", rarity: "common", icon: "I1", condition: { kind: "inventoryItems", target: 1 } }),
  achievement({ id: "inventory-5", title: "5 предметов", description: "Открыть пять предметов.", category: "inventory", rarity: "rare", icon: "I5", condition: { kind: "inventoryItems", target: 5 } }),
  achievement({ id: "inventory-10", title: "10 предметов", description: "Открыть десять предметов.", category: "inventory", rarity: "epic", icon: "I0", condition: { kind: "inventoryItems", target: 10 } }),
  achievement({ id: "inventory-rare", title: "Первый rare item", description: "Открыть rare item.", category: "inventory", rarity: "rare", icon: "IR", condition: { kind: "inventoryItems", target: 1, rarity: "rare" } }),
  achievement({ id: "inventory-epic", title: "Первый epic item", description: "Открыть epic item.", category: "inventory", rarity: "epic", icon: "IE", condition: { kind: "inventoryItems", target: 1, rarity: "epic" } }),
  achievement({ id: "inventory-legendary", title: "Первый legendary item", description: "Открыть legendary item.", category: "inventory", rarity: "legendary", icon: "IL", condition: { kind: "inventoryItems", target: 1, rarity: "legendary" } }),
  achievement({ id: "inventory-equipped", title: "Экипировать предмет", description: "Надеть первый предмет.", category: "inventory", rarity: "common", icon: "EQ", condition: { kind: "inventoryItems", target: 1, equipped: true } }),
  achievement({ id: "inventory-equipped-3", title: "3 equipped items", description: "Собрать три экипированных предмета.", category: "inventory", rarity: "epic", icon: "E3", condition: { kind: "inventoryItems", target: 3, equipped: true } }),
];

const seasonAchievements: AchievementDefinition[] = [
  achievement({ id: "season-first", title: "Первый сезон создан", description: "Запустить первый сезон.", category: "season", rarity: "common", icon: "S0", condition: { kind: "seasonLevel", target: 1 } }),
  achievement({ id: "season-level-1", title: "Первый season level", description: "Получить первый уровень сезона.", category: "season", rarity: "common", icon: "S1", condition: { kind: "seasonLevel", target: 1 } }),
  achievement({ id: "season-level-5", title: "Season level 5", description: "Достичь пятого уровня сезона.", category: "season", rarity: "rare", icon: "S5", condition: { kind: "seasonLevel", target: 5 } }),
  achievement({ id: "season-level-10", title: "Season level 10", description: "Достичь десятого уровня сезона.", category: "season", rarity: "epic", icon: "S10", condition: { kind: "seasonLevel", target: 10 } }),
  achievement({ id: "season-finished", title: "Сезон завершен", description: "Закрыть сезонную шкалу.", category: "season", rarity: "legendary", icon: "SF", condition: { kind: "seasonLevel", target: 20 } }),
  achievement({ id: "season-goals-all", title: "Все цели сезона", description: "Закрыть все цели сезона.", category: "season", rarity: "legendary", icon: "SG", condition: { kind: "seasonXp", target: 5000 } }),
];

const balanceAchievements: AchievementDefinition[] = [
  achievement({ id: "balance-light-day-used", title: "Light Day использован", description: "Провести легкий день.", category: "balance", rarity: "common", icon: "LD", condition: { kind: "lightDays", target: 1 } }),
  achievement({ id: "balance-recovery-after-overload", title: "Recovery Day после перегруза", description: "Восстановиться после сильного дня.", category: "balance", rarity: "rare", icon: "RC", condition: { kind: "recoveryDays", target: 1 } }),
  achievement({ id: "balance-week-no-overload", title: "Неделя без перегруза", description: "Активная неделя без 5+ часов.", category: "balance", rarity: "epic", icon: "BW", condition: { kind: "activeDays", target: 5, period: "week" } }),
  achievement({ id: "balance-5-days-no-5h", title: "5 активных дней без 5+ часов", description: "Стабильность без перегрева.", category: "balance", rarity: "rare", icon: "B5", condition: { kind: "activeDays", target: 5, period: "week" } }),
  achievement({ id: "balance-breaks-respected", title: "Pomodoro breaks respected", description: "Перерывы соблюдаются.", category: "balance", rarity: "rare", icon: "BR", condition: { kind: "pomodoroFocusBreakPairs", target: 10, period: "all" } }),
  achievement({ id: "balance-healthy-week", title: "Healthy rhythm week", description: "Неделя с активностью, заметками и отдыхом.", category: "balance", rarity: "epic", icon: "HW", condition: { kind: "all", conditions: [{ kind: "activeDays", target: 5, period: "week" }, { kind: "journalNotes", target: 3, period: "week" }] } }),
];

const rankAchievements: AchievementDefinition[] = [
  ["uchenik-kostra", "Ученик костра"],
  ["novichok-koda", "Новичок кода"],
  ["podmastere", "Подмастерье"],
  ["zheleznyy-koder", "Железный кодер"],
  ["bronzovyy-razrabotchik", "Бронзовый разработчик"],
  ["serebryanyy-razrabotchik", "Серебряный разработчик"],
  ["zolotoy-razrabotchik", "Золотой разработчик"],
  ["izumrudnyy-inzhener", "Изумрудный инженер"],
  ["almaznyy-inzhener", "Алмазный инженер"],
  ["plamennyy-inzhener", "Пламенный инженер"],
  ["mificheskiy-razrabotchik", "Мифический разработчик"],
  ["arkhitektor-plameni", "Архитектор пламени"],
  ["legenda-codefire", "Легенда CodeFire"],
  ["vechnoe-plamya", "Вечное пламя"],
].map(([rankId, rankName], index) =>
  achievement({
    id: `rank-${rankId}`,
    title: `Ранг: ${rankName}`,
    description: `Достичь ранга ${rankName}.`,
    category: "rank",
    rarity: index >= 11 ? "mythic" : index >= 8 ? "legendary" : index >= 5 ? "epic" : index >= 2 ? "rare" : "common",
    icon: "RK",
    condition: { kind: "rankReached", rankId, rankName },
  }),
);

export const achievementCatalog: AchievementDefinition[] = [
  ...startAchievements,
  ...dailyAchievements,
  ...streakAchievements,
  ...languageAchievements,
  ...pomodoroAchievements,
  ...journalAchievements,
  ...studyAchievements,
  ...stepikAchievements,
  ...topicAchievements,
  ...bossAchievements,
  ...inventoryAchievements,
  ...seasonAchievements,
  ...balanceAchievements,
  ...rankAchievements,
];
