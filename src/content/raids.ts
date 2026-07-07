import type { CodeFireCondition } from "@/content/conditions";

export type RaidCategory = "daily" | "weekly" | "boss" | "recovery" | "language" | "weekend" | "seasonal";
export type RaidDifficulty = "normal" | "hard" | "epic" | "legendary";
export type RaidReward = {
  kind: "adventureXp" | "item" | "timeline";
  value: number | string;
  label: string;
};
export type RaidRequirement = {
  id: string;
  label: string;
  condition: CodeFireCondition;
};

export type RaidDefinition = {
  id: string;
  title: string;
  description: string;
  category: RaidCategory;
  difficulty: RaidDifficulty;
  requirements: RaidRequirement[];
  rewards: RaidReward[];
};

function raid(definition: RaidDefinition): RaidDefinition {
  return definition;
}

function xp(value: number): RaidReward {
  return { kind: "adventureXp", value, label: `${value} Adventure XP` };
}

export const raidCatalog: RaidDefinition[] = [
  raid({ id: "python-dungeon", title: "Python Dungeon", description: "120 минут Python за день.", category: "language", difficulty: "hard", requirements: [{ id: "python-120", label: "120 минут Python", condition: { kind: "languageMinutes", language: "Python", target: 120, period: "day" } }], rewards: [xp(180), { kind: "item", value: "serpent-amulet", label: "Python item chance" }] }),
  raid({ id: "dictionary-tower", title: "Dictionary Tower", description: "Словари плюс Python-фокус.", category: "language", difficulty: "epic", requirements: [{ id: "dict-tasks", label: "3 задачи по словарям", condition: { kind: "studyTasks", target: 3, period: "day", topic: "dictionaries" } }, { id: "python-60", label: "60 минут Python", condition: { kind: "languageMinutes", language: "Python", target: 60, period: "day" } }], rewards: [xp(240), { kind: "item", value: "book-dictionaries", label: "Том словарей" }] }),
  raid({ id: "focus-fortress", title: "Focus Fortress", description: "4 Pomodoro за день.", category: "daily", difficulty: "hard", requirements: [{ id: "pomodoro-4", label: "4 Pomodoro", condition: { kind: "pomodoroFocus", target: 4, period: "day" } }], rewards: [xp(170), { kind: "item", value: "ring-focus", label: "Focus item chance" }] }),
  raid({ id: "weekend-forge", title: "Weekend Forge", description: "180 минут кодинга на выходных.", category: "weekend", difficulty: "hard", requirements: [{ id: "weekend-180", label: "180 минут кодинга", condition: { kind: "codingMinutes", target: 180, period: "day" } }], rewards: [xp(190)] }),
  raid({ id: "recovery-camp", title: "Recovery Camp", description: "15 минут и заметка после перегруза.", category: "recovery", difficulty: "normal", requirements: [{ id: "soft-15", label: "15 минут", condition: { kind: "codingMinutes", target: 15, period: "day" } }, { id: "note", label: "Заметка", condition: { kind: "journalNotes", target: 1, period: "day" } }], rewards: [xp(90), { kind: "timeline", value: "recovery", label: "Recovery timeline" }] }),
  raid({ id: "sql-dungeon", title: "SQL Dungeon", description: "90 минут SQL.", category: "language", difficulty: "hard", requirements: [{ id: "sql-90", label: "90 минут SQL", condition: { kind: "languageMinutes", language: "SQL", target: 90, period: "day" } }], rewards: [xp(170), { kind: "item", value: "sql-crystal", label: "SQL-кристалл" }] }),
  raid({ id: "fastapi-gate", title: "FastAPI Gate", description: "Backend-практика и endpoint.", category: "boss", difficulty: "epic", requirements: [{ id: "backend-90", label: "90 минут backend", condition: { kind: "codingMinutes", target: 90, period: "day" } }, { id: "http-topic", label: "HTTP/API задача", condition: { kind: "studyTasks", target: 1, period: "day", topic: "http" } }], rewards: [xp(240), { kind: "item", value: "fastapi-seal", label: "FastAPI seal" }] }),
  raid({ id: "debug-labyrinth", title: "Debug Labyrinth", description: "60 минут debugging и заметка ошибки.", category: "boss", difficulty: "hard", requirements: [{ id: "debug-60", label: "60 минут кодинга", condition: { kind: "codingMinutes", target: 60, period: "day" } }, { id: "bug-note", label: "Заметка ошибки", condition: { kind: "journalNotes", target: 1, field: "text", period: "day" } }], rewards: [xp(180), { kind: "item", value: "debug-lens", label: "Линза отладки" }] }),
  raid({ id: "stepik-trial", title: "Stepik Trial", description: "10 задач Stepik за неделю.", category: "weekly", difficulty: "hard", requirements: [{ id: "stepik-10", label: "10 Stepik", condition: { kind: "stepikTasks", target: 10, period: "week" } }], rewards: [xp(180)] }),
  raid({ id: "season-trial", title: "Season Trial", description: "25% цели сезона.", category: "seasonal", difficulty: "epic", requirements: [{ id: "season-25", label: "1250 Season XP", condition: { kind: "seasonXp", target: 1250 } }], rewards: [xp(220), { kind: "item", value: "season-frame", label: "Season frame" }] }),
  raid({ id: "morning-spark", title: "Morning Spark", description: "30 минут стартовой практики.", category: "daily", difficulty: "normal", requirements: [{ id: "coding-30", label: "30 минут", condition: { kind: "codingMinutes", target: 30, period: "day" } }], rewards: [xp(60)] }),
  raid({ id: "deep-work-gate", title: "Deep Work Gate", description: "90% фокуса и 60 минут кодинга.", category: "daily", difficulty: "hard", requirements: [{ id: "focus-90", label: "90% фокуса", condition: { kind: "focusPercent", target: 90, period: "day" } }, { id: "coding-60", label: "60 минут", condition: { kind: "codingMinutes", target: 60, period: "day" } }], rewards: [xp(160)] }),
  raid({ id: "typescript-ritual", title: "TypeScript Ritual", description: "90 минут TypeScript.", category: "language", difficulty: "hard", requirements: [{ id: "ts-90", label: "90 минут TypeScript", condition: { kind: "languageMinutes", language: "TypeScript", target: 90, period: "day" } }], rewards: [xp(170), { kind: "item", value: "typed-ring", label: "Typed ring" }] }),
  raid({ id: "oop-citadel", title: "OOP Citadel", description: "OOP задача и Python-фокус.", category: "language", difficulty: "hard", requirements: [{ id: "oop-task", label: "OOP задача", condition: { kind: "studyTasks", target: 1, period: "day", topic: "oop" } }, { id: "python-45", label: "45 минут Python", condition: { kind: "languageMinutes", language: "Python", target: 45, period: "day" } }], rewards: [xp(165)] }),
  raid({ id: "files-archive", title: "Files Archive", description: "Практика файлов и заметка.", category: "daily", difficulty: "normal", requirements: [{ id: "files-task", label: "Задача по файлам", condition: { kind: "studyTasks", target: 1, period: "day", topic: "files" } }, { id: "note", label: "Заметка", condition: { kind: "journalNotes", target: 1, period: "day" } }], rewards: [xp(110)] }),
  raid({ id: "http-bridge", title: "HTTP Bridge", description: "HTTP/API задача и 60 минут backend.", category: "language", difficulty: "hard", requirements: [{ id: "http-task", label: "HTTP задача", condition: { kind: "studyTasks", target: 1, period: "day", topic: "http" } }, { id: "coding-60", label: "60 минут", condition: { kind: "codingMinutes", target: 60, period: "day" } }], rewards: [xp(150)] }),
  raid({ id: "docker-harbor", title: "Docker Harbor", description: "Docker progress.", category: "language", difficulty: "epic", requirements: [{ id: "docker-topic", label: "Docker topic level 2", condition: { kind: "topicLevel", topic: "docker", target: 2 } }], rewards: [xp(200), { kind: "item", value: "docker-helm", label: "Docker-шлем" }] }),
  raid({ id: "git-bridge", title: "Git Bridge", description: "Git progress и заметка.", category: "daily", difficulty: "normal", requirements: [{ id: "git-topic", label: "Git progress", condition: { kind: "topicLevel", topic: "git", target: 2 } }, { id: "note", label: "Заметка", condition: { kind: "journalNotes", target: 1, period: "day" } }], rewards: [xp(100)] }),
  raid({ id: "weekly-flame", title: "Weekly Flame", description: "5 активных дней.", category: "weekly", difficulty: "normal", requirements: [{ id: "active-5", label: "5 активных дней", condition: { kind: "activeDays", target: 5, period: "week" } }], rewards: [xp(140)] }),
  raid({ id: "weekly-coder", title: "Weekly Coder", description: "600 Coding XP за неделю.", category: "weekly", difficulty: "hard", requirements: [{ id: "xp-600", label: "600 XP", condition: { kind: "codingXp", target: 600, period: "week" } }], rewards: [xp(180)] }),
  raid({ id: "weekly-python-forge", title: "Weekly Python Forge", description: "300 минут Python за неделю.", category: "weekly", difficulty: "hard", requirements: [{ id: "python-300", label: "300 минут Python", condition: { kind: "languageMinutes", language: "Python", target: 300, period: "week" } }], rewards: [xp(180)] }),
  raid({ id: "weekly-journal", title: "Weekly Journal", description: "3 заметки за неделю.", category: "weekly", difficulty: "normal", requirements: [{ id: "notes-3", label: "3 заметки", condition: { kind: "journalNotes", target: 3, period: "week" } }], rewards: [xp(90)] }),
  raid({ id: "weekly-focus", title: "Weekly Focus", description: "5 Pomodoro за неделю.", category: "weekly", difficulty: "normal", requirements: [{ id: "pomodoro-5", label: "5 Pomodoro", condition: { kind: "pomodoroFocus", target: 5, period: "week" } }], rewards: [xp(110)] }),
  raid({ id: "boss-first-api", title: "First API Boss", description: "Progress по API-боссу.", category: "boss", difficulty: "epic", requirements: [{ id: "boss-progress", label: "Boss progress", condition: { kind: "bossProgress", target: 1 } }, { id: "http-task", label: "HTTP/API задача", condition: { kind: "studyTasks", target: 1, period: "day", topic: "http" } }], rewards: [xp(260), { kind: "item", value: "first-api-key", label: "Ключ первого API" }] }),
  raid({ id: "boss-sql-delver", title: "SQL Delver", description: "SQL boss progress.", category: "boss", difficulty: "epic", requirements: [{ id: "boss-progress", label: "Boss progress", condition: { kind: "bossProgress", target: 1 } }, { id: "sql-60", label: "60 минут SQL", condition: { kind: "languageMinutes", language: "SQL", target: 60, period: "day" } }], rewards: [xp(260)] }),
  raid({ id: "boss-dictionary-lord", title: "Повелитель словарей", description: "Босс по словарям.", category: "boss", difficulty: "legendary", requirements: [{ id: "dict-topic", label: "Словари level 5", condition: { kind: "topicLevel", topic: "dictionaries", target: 5 } }, { id: "stepik-dict", label: "Stepik словари", condition: { kind: "stepikTasks", target: 10, topic: "dictionaries", period: "all" } }], rewards: [xp(400), { kind: "item", value: "dictionary-trophy", label: "Трофей словарей" }] }),
  raid({ id: "recovery-moon", title: "Recovery Moon", description: "Мягкий день и перерыв.", category: "recovery", difficulty: "normal", requirements: [{ id: "light", label: "15 минут", condition: { kind: "codingMinutes", target: 15, period: "day" } }, { id: "break", label: "Break", condition: { kind: "pomodoroBreak", target: 1, period: "day" } }], rewards: [xp(90)] }),
  raid({ id: "balance-week", title: "Balance Week", description: "5 активных дней и 3 заметки.", category: "recovery", difficulty: "epic", requirements: [{ id: "active-5", label: "5 активных дней", condition: { kind: "activeDays", target: 5, period: "week" } }, { id: "notes-3", label: "3 заметки", condition: { kind: "journalNotes", target: 3, period: "week" } }], rewards: [xp(220)] }),
  raid({ id: "season-gold-forge", title: "Gold Forge Trial", description: "Сезонный прогресс.", category: "seasonal", difficulty: "legendary", requirements: [{ id: "season-level-10", label: "Season level 10", condition: { kind: "seasonLevel", target: 10 } }], rewards: [xp(350), { kind: "item", value: "gold-forge-theme", label: "Gold Forge theme" }] }),
  raid({ id: "mythic-core", title: "Mythic Core", description: "Большая поздняя цель CodeFire.", category: "seasonal", difficulty: "legendary", requirements: [{ id: "coding-xp-5000", label: "5000 Coding XP", condition: { kind: "codingXp", target: 5000, period: "all" } }, { id: "achievements-50", label: "50 achievements", condition: { kind: "achievementsUnlocked", target: 50 } }], rewards: [xp(500), { kind: "item", value: "mythic-core", label: "Мифическое ядро" }] }),
];
