import type { RankProgression } from "@/lib/ranks";
import type { Achievement } from "@/lib/achievements";
import type { BalanceAdvice } from "@/lib/burnout";
import type { DailyTitle } from "@/lib/daily-title";
import type { GoalProgress } from "@/lib/goals";
import type { LanguageLevel } from "@/lib/language-levels";
import type { LearningRpg } from "@/lib/learning-rpg";
import type { ProjectZone } from "@/lib/project-zones";
import type { DailyQuest, WeeklyQuest } from "@/lib/quests";
import type { CodeFireRecords } from "@/lib/records";
import type { CodeFireEvent, TodayRaid } from "@/lib/raids";
import type { StreakStats } from "@/lib/streaks";
import type { WeekComparison, WeeklyReport } from "@/lib/weekly-report";

export type LanguageStat = {
  name: string;
  totalSeconds: number;
  percent: number;
  text: string;
};

export type CodingLanguageActivity = {
  name: string;
  seconds: number;
  xp: number;
};

export type ProjectActivity = {
  name: string;
  seconds: number;
  xp: number;
};

export type DailyCodingActivity = {
  date: string;
  label: string;
  totalSeconds: number;
  codingSeconds: number;
  xp: number;
  languages: CodingLanguageActivity[];
  projects?: ProjectActivity[];
  source: "wakatime" | "history";
};

export type DayStat = DailyCodingActivity;

export type ProductivityStatus = {
  label: string;
  tone: "rest" | "warmup" | "good" | "strong" | "fire" | "legendary";
  description: string;
};

export type Progression = {
  totalXP: number;
  todayXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpIntoLevel: number;
  xpForLevel: number;
  progressPercent: number;
  rank?: RankProgression;
  rankProgress?: RankProgression;
};

export type CodeFireData = {
  configured: true;
  generatedAt: string;
  today: {
    date: string;
    totalSeconds: number;
    hours: number;
    xp: number;
    languages: LanguageStat[];
    mainLanguage: string;
    status: ProductivityStatus;
  };
  progression: Progression;
  last30Days: {
    days: DayStat[];
    dailyCodingActivityLast30Days: DailyCodingActivity[];
    bestDay: DayStat;
    activeDays: number;
    totalXP: number;
  };
  last365Days: {
    days: DayStat[];
    bestDay: DayStat;
    activeDays: number;
    totalXP: number;
  };
  rpg?: {
    streak: StreakStats;
    quests: DailyQuest[];
    weeklyQuests: WeeklyQuest[];
    achievements: Achievement[];
    goals: GoalProgress;
    weeklyReport: WeeklyReport;
    weekComparison: WeekComparison;
    languageLevels: LanguageLevel[];
    projectZones: ProjectZone[];
    focusDay: {
      percent: number;
      language: string | null;
      title: string;
      description: string;
    };
    records: CodeFireRecords;
    dailyTitle: DailyTitle;
    balance: BalanceAdvice;
    todayRaid: TodayRaid;
    events: CodeFireEvent[];
    learning: LearningRpg;
  };
};

export type CodeFireOverviewData = {
  configured: true;
  generatedAt: string;
  today: CodeFireData["today"];
  progression: Progression;
  last30Days: CodeFireData["last30Days"];
  last365Days: Omit<CodeFireData["last365Days"], "days"> & {
    days?: DayStat[];
  };
  pomodoroToday: {
    completedFocusSessions: number;
    completedBreakSessions: number;
    focusMinutes: number;
  };
  languageLevelsPreview: LanguageLevel[];
  heatmapPreview: DayStat[];
  lastUpdatedAt: string;
  rpg: {
    streak: StreakStats;
    quests: DailyQuest[];
    weeklyQuests: WeeklyQuest[];
    goals: GoalProgress;
    focusDay: NonNullable<CodeFireData["rpg"]>["focusDay"];
    dailyTitle: DailyTitle;
    balance: BalanceAdvice;
    todayRaid: TodayRaid;
    events: CodeFireEvent[];
  };
};

export type CodeFireFallback = {
  configured: false;
  message: string;
};

export type CodeFireError = {
  configured: true;
  error: string;
};

export type CodeFireApiResponse = CodeFireData | CodeFireFallback | CodeFireError;
export type CodeFireOverviewApiResponse = CodeFireOverviewData | CodeFireFallback | CodeFireError;
