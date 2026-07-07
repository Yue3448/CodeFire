import type { CodeFireCondition } from "@/content/conditions";

export type QuestCategory =
  | "time"
  | "language"
  | "consistency"
  | "pomodoro"
  | "journal"
  | "studyTasks"
  | "stepik"
  | "topic"
  | "recovery"
  | "bossPrep";

export type QuestDifficulty = "easy" | "normal" | "hard" | "epic";

export type QuestUnit = "minutes" | "xp" | "tasks" | "sessions" | "notes" | "percent" | "count";

export type QuestDefinition = {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  target: number;
  unit: QuestUnit;
  rewardAdventureXp: number;
  condition: CodeFireCondition;
};

function quest(definition: QuestDefinition): QuestDefinition {
  return definition;
}

const timeDailyQuests: QuestDefinition[] = [
  ["first-spark", "Первая искра", 5, "easy", 8],
  ["light-fire", "Разжечь костер", 15, "easy", 12],
  ["small-warmup", "Малый прогрев", 30, "normal", 18],
  ["practice-hour", "Час практики", 60, "normal", 30],
  ["deep-entry", "Глубокий заход", 90, "hard", 44],
  ["day-forge", "Кузница дня", 120, "hard", 60],
  ["fire-march", "Огненный марш", 180, "epic", 90],
  ["focus-raid", "Рейд фокуса", 240, "epic", 120],
].map(([id, title, target, difficulty, reward]) =>
  quest({
    id: `daily-time-${id}`,
    title: String(title),
    description: `${target} минут реального кодинга по WakaTime.`,
    category: "time",
    difficulty: difficulty as QuestDifficulty,
    target: Number(target),
    unit: "minutes",
    rewardAdventureXp: Number(reward),
    condition: { kind: "codingMinutes", target: Number(target), period: "day" },
  }),
);

const pythonDailyQuests: QuestDefinition[] = [
  quest({
    id: "daily-python-snake-path",
    title: "Змеиная тропа",
    description: "30 минут Python-практики.",
    category: "language",
    difficulty: "normal",
    target: 30,
    unit: "minutes",
    rewardAdventureXp: 24,
    condition: { kind: "languageMinutes", language: "Python", target: 30, period: "day" },
  }),
  quest({
    id: "daily-python-warmup",
    title: "Python-разминка",
    description: "45 минут Python без бонусов к Coding XP.",
    category: "language",
    difficulty: "normal",
    target: 45,
    unit: "minutes",
    rewardAdventureXp: 32,
    condition: { kind: "languageMinutes", language: "Python", target: 45, period: "day" },
  }),
  quest({
    id: "daily-python-bite",
    title: "Укус питона",
    description: "60 минут Python за день.",
    category: "language",
    difficulty: "hard",
    target: 60,
    unit: "minutes",
    rewardAdventureXp: 42,
    condition: { kind: "languageMinutes", language: "Python", target: 60, period: "day" },
  }),
  quest({
    id: "daily-python-dictionaries",
    title: "Башня словарей",
    description: "60 минут Python и прогресс по теме словарей.",
    category: "topic",
    difficulty: "hard",
    target: 2,
    unit: "count",
    rewardAdventureXp: 55,
    condition: {
      kind: "all",
      conditions: [
        { kind: "languageMinutes", language: "Python", target: 60, period: "day" },
        { kind: "topicXp", topic: "dictionaries", target: 1 },
      ],
    },
  }),
  quest({
    id: "daily-python-loops",
    title: "Пещера циклов",
    description: "45 минут Python и задача по циклам.",
    category: "topic",
    difficulty: "normal",
    target: 2,
    unit: "count",
    rewardAdventureXp: 40,
    condition: {
      kind: "all",
      conditions: [
        { kind: "languageMinutes", language: "Python", target: 45, period: "day" },
        { kind: "studyTasks", target: 1, period: "day", topic: "loops" },
      ],
    },
  }),
  quest({
    id: "daily-python-functions",
    title: "Кузница функций",
    description: "60 минут Python и практика функций.",
    category: "topic",
    difficulty: "hard",
    target: 2,
    unit: "count",
    rewardAdventureXp: 55,
    condition: {
      kind: "all",
      conditions: [
        { kind: "languageMinutes", language: "Python", target: 60, period: "day" },
        { kind: "studyTasks", target: 1, period: "day", topic: "functions" },
      ],
    },
  }),
];

const languageDailyQuests: QuestDefinition[] = [
  quest({
    id: "daily-main-language-60",
    title: "Главный язык дня",
    description: "60 минут в основном языке дня.",
    category: "language",
    difficulty: "normal",
    target: 60,
    unit: "minutes",
    rewardAdventureXp: 35,
    condition: { kind: "mainLanguageMinutes", target: 60, period: "day" },
  }),
  quest({
    id: "daily-clean-focus-80",
    title: "Чистый фокус",
    description: "80% времени в одном языке.",
    category: "language",
    difficulty: "normal",
    target: 80,
    unit: "percent",
    rewardAdventureXp: 35,
    condition: { kind: "focusPercent", target: 80, period: "day" },
  }),
  quest({
    id: "daily-deep-focus-90",
    title: "Глубокий фокус",
    description: "90% времени в одном языке.",
    category: "language",
    difficulty: "hard",
    target: 90,
    unit: "percent",
    rewardAdventureXp: 55,
    condition: { kind: "focusPercent", target: 90, period: "day" },
  }),
  quest({
    id: "daily-new-tool",
    title: "Новый инструмент",
    description: "15 минут в неосновном языке или инструменте.",
    category: "language",
    difficulty: "easy",
    target: 15,
    unit: "minutes",
    rewardAdventureXp: 18,
    condition: { kind: "codingMinutes", target: 15, period: "day" },
  }),
  quest({
    id: "daily-typescript-forge",
    title: "TypeScript Forge",
    description: "30 минут TypeScript.",
    category: "language",
    difficulty: "normal",
    target: 30,
    unit: "minutes",
    rewardAdventureXp: 28,
    condition: { kind: "languageMinutes", language: "TypeScript", target: 30, period: "day" },
  }),
  quest({
    id: "daily-sql-gate",
    title: "SQL Gate",
    description: "30 минут SQL.",
    category: "language",
    difficulty: "normal",
    target: 30,
    unit: "minutes",
    rewardAdventureXp: 28,
    condition: { kind: "languageMinutes", language: "SQL", target: 30, period: "day" },
  }),
];

const pomodoroDailyQuests: QuestDefinition[] = [
  ["first-focus", "Первый фокус", 1, 18],
  ["double-focus", "Двойной фокус", 2, 30],
  ["four-circles", "Четыре круга", 4, 55],
].map(([id, title, target, reward]) =>
  quest({
    id: `daily-pomodoro-${id}`,
    title: String(title),
    description: `${target} завершенных Pomodoro focus-сессий.`,
    category: "pomodoro",
    difficulty: Number(target) >= 4 ? "hard" : "normal",
    target: Number(target),
    unit: "sessions",
    rewardAdventureXp: Number(reward),
    condition: { kind: "pomodoroFocus", target: Number(target), period: "day" },
  }),
);

pomodoroDailyQuests.push(
  quest({
    id: "daily-pomodoro-focus-break",
    title: "Фокус + отдых",
    description: "Завершить focus и break.",
    category: "pomodoro",
    difficulty: "easy",
    target: 1,
    unit: "sessions",
    rewardAdventureXp: 20,
    condition: { kind: "pomodoroFocusBreakPairs", target: 1, period: "day" },
  }),
  quest({
    id: "daily-pomodoro-no-skip-break",
    title: "Без пропуска отдыха",
    description: "Сделать break после focus.",
    category: "recovery",
    difficulty: "easy",
    target: 1,
    unit: "sessions",
    rewardAdventureXp: 18,
    condition: { kind: "pomodoroBreak", target: 1, period: "day" },
  }),
  quest({
    id: "daily-pomodoro-calm-rhythm",
    title: "Спокойный ритм",
    description: "2 Pomodoro с перерывами.",
    category: "pomodoro",
    difficulty: "normal",
    target: 2,
    unit: "sessions",
    rewardAdventureXp: 36,
    condition: { kind: "pomodoroFocusBreakPairs", target: 2, period: "day" },
  }),
);

const journalDailyQuests: QuestDefinition[] = [
  ["daily-note", "Заметка дня", "Записать дневную заметку.", { kind: "journalNotes", target: 1, field: "any", period: "day" } as const],
  ["before-plan", "Before-план", "Заполнить Before note.", { kind: "journalNotes", target: 1, field: "before", period: "day" } as const],
  ["after-summary", "After-итог", "Заполнить After note.", { kind: "journalNotes", target: 1, field: "after", period: "day" } as const],
  ["practice-insight", "Что я понял", "Написать итог практики.", { kind: "journalNotes", target: 1, field: "text", period: "day" } as const],
  ["bug-note", "Ошибка дня", "Записать проблему или ошибку.", { kind: "journalNotes", target: 1, field: "text", period: "day" } as const],
  ["small-win", "Победа дня", "Записать маленькую победу.", { kind: "journalNotes", target: 1, field: "any", period: "day" } as const],
].map(([id, title, description, condition]) =>
  quest({
    id: `daily-journal-${id}`,
    title: String(title),
    description: String(description),
    category: "journal",
    difficulty: "easy",
    target: 1,
    unit: "notes",
    rewardAdventureXp: 14,
    condition: condition as CodeFireCondition,
  }),
);

const studyDailyQuests: QuestDefinition[] = [
  quest({ id: "daily-study-one-task", title: "Одна задача", description: "Добавить или решить 1 учебную задачу.", category: "studyTasks", difficulty: "easy", target: 1, unit: "tasks", rewardAdventureXp: 18, condition: { kind: "studyTasks", target: 1, period: "day" } }),
  quest({ id: "daily-study-three-tasks", title: "Три задачи", description: "Решить 3 задачи за день.", category: "studyTasks", difficulty: "normal", target: 3, unit: "tasks", rewardAdventureXp: 40, condition: { kind: "studyTasks", target: 3, period: "day", status: "solved" } }),
  quest({ id: "daily-study-hard-task", title: "Трудная задача", description: "Решить задачу сложности 4+.", category: "studyTasks", difficulty: "hard", target: 1, unit: "tasks", rewardAdventureXp: 38, condition: { kind: "studyTasks", target: 1, period: "day", status: "solved", minDifficulty: 4 } }),
  quest({ id: "daily-study-almost", title: "Почти решил", description: "Отметить almost без штрафа.", category: "studyTasks", difficulty: "easy", target: 1, unit: "tasks", rewardAdventureXp: 12, condition: { kind: "studyTasks", target: 1, period: "day", status: "almost" } }),
  quest({ id: "daily-study-review", title: "Разбор ошибки", description: "Сделать reviewed task.", category: "studyTasks", difficulty: "normal", target: 1, unit: "tasks", rewardAdventureXp: 22, condition: { kind: "studyTasks", target: 1, period: "day", status: "reviewed" } }),
  quest({ id: "daily-study-topic", title: "Тема дня", description: "3 задачи по одной теме.", category: "studyTasks", difficulty: "hard", target: 3, unit: "tasks", rewardAdventureXp: 45, condition: { kind: "studyTasks", target: 3, period: "day", status: "solved" } }),
];

const stepikDailyQuests: QuestDefinition[] = [
  quest({ id: "daily-stepik-warmup", title: "Stepik-разминка", description: "1 задача Stepik.", category: "stepik", difficulty: "easy", target: 1, unit: "tasks", rewardAdventureXp: 18, condition: { kind: "stepikTasks", target: 1, period: "day" } }),
  quest({ id: "daily-stepik-marathon", title: "Stepik-марафон", description: "3 задачи Stepik.", category: "stepik", difficulty: "normal", target: 3, unit: "tasks", rewardAdventureXp: 42, condition: { kind: "stepikTasks", target: 3, period: "day" } }),
  quest({ id: "daily-stepik-heavy", title: "Stepik-тяжеловес", description: "Stepik задача difficulty 5.", category: "stepik", difficulty: "hard", target: 1, unit: "tasks", rewardAdventureXp: 45, condition: { kind: "stepikTasks", target: 1, period: "day", minDifficulty: 5 } }),
  quest({ id: "daily-stepik-streak", title: "Stepik streak", description: "Stepik 3 дня подряд.", category: "stepik", difficulty: "hard", target: 3, unit: "count", rewardAdventureXp: 55, condition: { kind: "stepikStreak", target: 3 } }),
  quest({ id: "daily-stepik-block", title: "Закрыть блок", description: "10 задач Stepik по теме за неделю.", category: "stepik", difficulty: "epic", target: 10, unit: "tasks", rewardAdventureXp: 80, condition: { kind: "stepikTasks", target: 10, period: "week" } }),
];

const topicDailyQuests: QuestDefinition[] = [
  ["dictionaries", "Словари +1", "Задача по словарям."],
  ["char-count", "Частоты символов", "Задача по подсчету частот."],
  ["anagrams", "Анаграммы", "Практика анаграмм."],
  ["functions", "Функции", "Практика функций."],
  ["files", "Файлы", "Практика файлов."],
  ["oop", "ООП", "Практика ООП."],
  ["http", "HTTP", "Практика HTTP."],
  ["sql", "SQL", "Практика SQL."],
].map(([topic, title, description]) =>
  quest({
    id: `daily-topic-${topic}`,
    title,
    description,
    category: "topic",
    difficulty: topic === "sql" || topic === "http" ? "normal" : "easy",
    target: 1,
    unit: "tasks",
    rewardAdventureXp: 24,
    condition: { kind: "studyTasks", target: 1, period: "day", topic },
  }),
);

const recoveryDailyQuests: QuestDefinition[] = [
  quest({ id: "daily-recovery-light-day", title: "Легкий день", description: "15 минут мягкой практики.", category: "recovery", difficulty: "easy", target: 15, unit: "minutes", rewardAdventureXp: 12, condition: { kind: "codingMinutes", target: 15, period: "day" } }),
  quest({ id: "daily-recovery-keep-fire", title: "Сохранить огонь", description: "1 короткая сессия.", category: "recovery", difficulty: "easy", target: 1, unit: "xp", rewardAdventureXp: 10, condition: { kind: "codingXp", target: 1, period: "day" } }),
  quest({ id: "daily-recovery-note", title: "Восстановление", description: "Заметка и 15 минут практики.", category: "recovery", difficulty: "easy", target: 2, unit: "count", rewardAdventureXp: 20, condition: { kind: "all", conditions: [{ kind: "codingMinutes", target: 15, period: "day" }, { kind: "journalNotes", target: 1, period: "day" }] } }),
  quest({ id: "daily-recovery-no-overload", title: "Без перегруза", description: "Не превышать тяжелый дневной порог после перегруза.", category: "recovery", difficulty: "normal", target: 240, unit: "minutes", rewardAdventureXp: 18, condition: { kind: "codingMinutes", target: 240, period: "day" } }),
  quest({ id: "daily-recovery-soft-rhythm", title: "Мягкий ритм", description: "Pomodoro и break.", category: "recovery", difficulty: "easy", target: 1, unit: "sessions", rewardAdventureXp: 18, condition: { kind: "pomodoroFocusBreakPairs", target: 1, period: "day" } }),
];

const bossPrepDailyQuests: QuestDefinition[] = [
  quest({ id: "daily-boss-prep-topic", title: "Подготовка к боссу", description: "30 минут по теме босса.", category: "bossPrep", difficulty: "normal", target: 30, unit: "minutes", rewardAdventureXp: 36, condition: { kind: "codingMinutes", target: 30, period: "day" } }),
  quest({ id: "daily-boss-scouting", title: "Разведка босса", description: "Заметка о сложной теме.", category: "bossPrep", difficulty: "easy", target: 1, unit: "notes", rewardAdventureXp: 18, condition: { kind: "journalNotes", target: 1, period: "day" } }),
  quest({ id: "daily-boss-first-hit", title: "Первый удар", description: "1 requirement boss progress.", category: "bossPrep", difficulty: "normal", target: 1, unit: "count", rewardAdventureXp: 35, condition: { kind: "bossProgress", target: 1 } }),
  quest({ id: "daily-boss-finish", title: "Добить босса", description: "Завершить последний requirement.", category: "bossPrep", difficulty: "epic", target: 1, unit: "count", rewardAdventureXp: 90, condition: { kind: "bossDefeated", target: 1 } }),
];

export const dailyQuestCatalog: QuestDefinition[] = [
  ...timeDailyQuests,
  ...pythonDailyQuests,
  ...languageDailyQuests,
  ...pomodoroDailyQuests,
  ...journalDailyQuests,
  ...studyDailyQuests,
  ...stepikDailyQuests,
  ...topicDailyQuests,
  ...recoveryDailyQuests,
  ...bossPrepDailyQuests,
];

export const weeklyQuestCatalog: QuestDefinition[] = [
  quest({ id: "weekly-active-5", title: "5 активных дней", description: "5 дней с Coding XP за неделю.", category: "consistency", difficulty: "normal", target: 5, unit: "count", rewardAdventureXp: 120, condition: { kind: "activeDays", target: 5, period: "week" } }),
  quest({ id: "weekly-coding-xp-600", title: "600 Coding XP", description: "600 честного WakaTime XP за неделю.", category: "time", difficulty: "hard", target: 600, unit: "xp", rewardAdventureXp: 160, condition: { kind: "codingXp", target: 600, period: "week" } }),
  quest({ id: "weekly-python-300", title: "300 минут Python", description: "300 минут Python за неделю.", category: "language", difficulty: "hard", target: 300, unit: "minutes", rewardAdventureXp: 150, condition: { kind: "languageMinutes", language: "Python", target: 300, period: "week" } }),
  quest({ id: "weekly-stepik-10", title: "10 задач Stepik", description: "10 Stepik-задач за неделю.", category: "stepik", difficulty: "hard", target: 10, unit: "tasks", rewardAdventureXp: 150, condition: { kind: "stepikTasks", target: 10, period: "week" } }),
  quest({ id: "weekly-pomodoro-5", title: "5 Pomodoro", description: "5 focus-сессий за неделю.", category: "pomodoro", difficulty: "normal", target: 5, unit: "sessions", rewardAdventureXp: 90, condition: { kind: "pomodoroFocus", target: 5, period: "week" } }),
  quest({ id: "weekly-notes-3", title: "3 заметки", description: "3 дневниковые заметки за неделю.", category: "journal", difficulty: "easy", target: 3, unit: "notes", rewardAdventureXp: 70, condition: { kind: "journalNotes", target: 3, period: "week" } }),
  quest({ id: "weekly-deep-focus-2", title: "2 дня deep focus", description: "2 дня с фокусом 80%+.", category: "language", difficulty: "normal", target: 2, unit: "count", rewardAdventureXp: 110, condition: { kind: "focusDays", target: 2, minPercent: 80, period: "week" } }),
  quest({ id: "weekly-boss-progress", title: "1 boss progress", description: "Продвинуть активного босса.", category: "bossPrep", difficulty: "normal", target: 1, unit: "count", rewardAdventureXp: 120, condition: { kind: "bossProgress", target: 1 } }),
  quest({ id: "weekly-recovery-after-heavy", title: "Recovery после сильного дня", description: "Легкий день после высокой нагрузки.", category: "recovery", difficulty: "normal", target: 1, unit: "count", rewardAdventureXp: 80, condition: { kind: "recoveryDays", target: 1 } }),
  quest({ id: "weekly-topic-100", title: "100 XP по теме недели", description: "Набрать 100 Topic XP в выбранной теме.", category: "topic", difficulty: "normal", target: 100, unit: "xp", rewardAdventureXp: 100, condition: { kind: "topicXp", topic: "dictionaries", target: 100 } }),
  quest({ id: "weekly-study-12", title: "12 учебных задач", description: "12 задач любых учебных источников.", category: "studyTasks", difficulty: "hard", target: 12, unit: "tasks", rewardAdventureXp: 160, condition: { kind: "studyTasks", target: 12, period: "week" } }),
  quest({ id: "weekly-balanced-rhythm", title: "Здоровый ритм", description: "5 активных дней и 3 заметки.", category: "recovery", difficulty: "epic", target: 2, unit: "count", rewardAdventureXp: 190, condition: { kind: "all", conditions: [{ kind: "activeDays", target: 5, period: "week" }, { kind: "journalNotes", target: 3, period: "week" }] } }),
];
