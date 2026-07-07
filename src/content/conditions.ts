export type CodeFirePeriod = "day" | "week" | "all";

export type CodeFireCondition =
  | { kind: "codingMinutes"; target: number; period?: CodeFirePeriod }
  | { kind: "codingXp"; target: number; period?: CodeFirePeriod }
  | { kind: "activeDays"; target: number; period?: "week" | "all" }
  | { kind: "languageMinutes"; language: string; target: number; period?: CodeFirePeriod }
  | { kind: "languageXp"; language: string; target: number; period?: CodeFirePeriod }
  | { kind: "mainLanguageMinutes"; target: number; period?: CodeFirePeriod }
  | { kind: "focusPercent"; target: number; period?: "day" | "week" | "all" }
  | { kind: "focusDays"; target: number; minPercent: number; period?: "week" | "all" }
  | { kind: "pomodoroFocus"; target: number; period?: CodeFirePeriod }
  | { kind: "pomodoroBreak"; target: number; period?: CodeFirePeriod }
  | { kind: "pomodoroFocusBreakPairs"; target: number; period?: CodeFirePeriod }
  | { kind: "pomodoroFocusMinutes"; target: number; period?: CodeFirePeriod }
  | { kind: "journalNotes"; target: number; field?: "any" | "before" | "after" | "text"; period?: CodeFirePeriod }
  | { kind: "studyTasks"; target: number; period?: CodeFirePeriod; status?: "solved" | "almost" | "failed" | "reviewed"; source?: string; topic?: string; minDifficulty?: number }
  | { kind: "stepikTasks"; target: number; period?: CodeFirePeriod; topic?: string; minDifficulty?: number }
  | { kind: "stepikStreak"; target: number }
  | { kind: "topicLevel"; topic: string; target: number }
  | { kind: "topicXp"; topic: string; target: number }
  | { kind: "bossActive"; target?: number }
  | { kind: "bossProgress"; target: number }
  | { kind: "bossDefeated"; target: number; difficulty?: "easy" | "normal" | "hard" | "epic" | "legendary"; bossId?: string }
  | { kind: "inventoryItems"; target: number; rarity?: "common" | "rare" | "epic" | "legendary" | "mythic"; equipped?: boolean }
  | { kind: "achievementsUnlocked"; target: number; rarity?: "common" | "rare" | "epic" | "legendary" | "mythic" }
  | { kind: "seasonLevel"; target: number }
  | { kind: "seasonXp"; target: number }
  | { kind: "rankReached"; rankId: string; rankName: string }
  | { kind: "recoveryDays"; target: number }
  | { kind: "lightDays"; target: number }
  | { kind: "all"; conditions: CodeFireCondition[] }
  | { kind: "any"; conditions: CodeFireCondition[]; target?: number };
