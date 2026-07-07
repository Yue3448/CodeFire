import type { Achievement } from "@/lib/achievements";
import { getAdventureXpBreakdown, type XpBreakdown } from "@/lib/adventure-xp";
import { getCodeFireAvatar, type CodeFireAvatar } from "@/lib/avatar";
import { bossPresets, getBossFights, type BossFight, type BossFightPreset } from "@/lib/boss-fights";
import type { DailyNote } from "@/lib/daily-notes";
import { getDailyDifficulties, type DailyDifficulty } from "@/lib/difficulty";
import { getCustomGoalProgress, getUserGoals, type UserGoal, type UserGoalProgress } from "@/lib/custom-goals";
import { getDayDetails, type DayDetails } from "@/lib/day-details";
import { getDeveloperProfile, type DeveloperProfile } from "@/lib/developer-profile";
import { getHallOfFame, type HallOfFame } from "@/lib/hall-of-fame";
import { getInventory, syncInventoryUnlocks, type InventoryState } from "@/lib/inventory";
import type { LanguageLevel } from "@/lib/language-levels";
import { getLightDay, type LightDay } from "@/lib/light-day";
import { getLearningTimeline, type LearningTimelineEvent } from "@/lib/learning-timeline";
import { getManualStudyEntries, getManualStudyStats, type ManualStudyEntry, type ManualStudyStats } from "@/lib/manual-study";
import type { PomodoroData } from "@/lib/pomodoro";
import { getRecoveryState, type RecoveryState } from "@/lib/recovery";
import { getSeasonPassProgress, type SeasonPassProgress } from "@/lib/season-pass";
import { getSeasonDaysLeft, getSeasons, hydrateSeasonProgress, type Season } from "@/lib/seasons";
import { getStepikEntries, getStepikStats, type StepikEntry, type StepikStats } from "@/lib/stepik";
import { getStudyTasks, getStudyTaskStats, type StudyTask, type StudyTaskStats } from "@/lib/study-tasks";
import { getThemeState, type ThemeState } from "@/lib/themes";
import { getTopicTracker, type TopicProgress } from "@/lib/topics";
import type { DailyCodingActivity, Progression } from "@/lib/types";
import { getWeeklyStudyJournal, type WeeklyStudyJournal } from "@/lib/weekly-journal";

async function timed<T>(label: string, run: () => Promise<T>): Promise<T> {
  console.time(label);
  try {
    return await run();
  } finally {
    console.timeEnd(label);
  }
}

function timedSync<T>(label: string, run: () => T): T {
  console.time(label);
  try {
    return run();
  } finally {
    console.timeEnd(label);
  }
}

export type LearningRpg = {
  xp: XpBreakdown;
  bossPresets: BossFightPreset[];
  bossFights: BossFight[];
  activeBoss: BossFight | null;
  completedBosses: BossFight[];
  inventory: InventoryState;
  studyTasks: {
    items: StudyTask[];
    stats: StudyTaskStats;
  };
  stepik: {
    entries: StepikEntry[];
    stats: StepikStats;
  };
  manualStudy: {
    entries: ManualStudyEntry[];
    stats: ManualStudyStats;
  };
  topics: TopicProgress[];
  difficulties: Record<string, DailyDifficulty>;
  todayDifficulty: DailyDifficulty | null;
  lightDay: LightDay;
  recovery: RecoveryState;
  goals: {
    items: UserGoal[];
    progress: UserGoalProgress[];
  };
  weeklyJournal: WeeklyStudyJournal;
  seasons: Season[];
  activeSeason: Season | null;
  seasonDaysLeft: number;
  seasonPass: SeasonPassProgress | null;
  themes: ThemeState;
  profile: DeveloperProfile;
  avatar: CodeFireAvatar;
  hallOfFame: HallOfFame;
  timeline: LearningTimelineEvent[];
  dayDetails: DayDetails[];
};

export async function getLearningRpg({
  days,
  weekDays,
  today,
  todayDate,
  totalCodingXp,
  progression,
  mainLanguage,
  languageLevels,
  streak,
  achievements,
  pomodoroData,
  notes,
  todayNote,
  dailyTitle,
}: {
  days: DailyCodingActivity[];
  weekDays: DailyCodingActivity[];
  today: DailyCodingActivity;
  todayDate: string;
  totalCodingXp: number;
  progression: Progression;
  mainLanguage: string;
  languageLevels: LanguageLevel[];
  streak: number;
  achievements: Achievement[];
  pomodoroData: PomodoroData;
  notes: DailyNote[];
  todayNote: DailyNote | null;
  dailyTitle: string;
}): Promise<LearningRpg> {
  const [tasks, stepikEntries, manualStudy, difficulties, initialInventory, lightDay, goals, seasons, themes] =
    await timed("[CodeFire] local json read", () =>
      Promise.all([
        getStudyTasks(500),
        getStepikEntries(500),
        getManualStudyEntries(500),
        getDailyDifficulties(),
        getInventory(),
        getLightDay(todayDate),
        getUserGoals(),
        getSeasons(todayDate),
        getThemeState(),
      ]),
    );
  const topics = await getTopicTracker({
    tasks,
    stepikEntries,
    manualStudy,
    notes,
    todayDate,
  });
  const bossFights = await getBossFights({
    days,
    today,
    tasks,
    stepikEntries,
    topics,
    notes,
    pomodoroStats: pomodoroData.stats,
  });
  const completedBosses = bossFights.filter((boss) => boss.completed);
  const xp = getAdventureXpBreakdown({
    codingXp: totalCodingXp,
    tasks,
    stepikEntries,
    manualStudy,
    notes,
    bosses: completedBosses,
  });
  const hydratedSeasons = seasons.map((season) =>
    hydrateSeasonProgress({
      season,
      days,
      tasks,
      stepikEntries,
      topics,
      pomodoroStats: pomodoroData.stats,
      seasonXp: xp.seasonXp,
      noteCount: notes.length,
      manualStudyMinutes: manualStudy.reduce((sum, entry) => sum + entry.minutes, 0),
    }),
  );
  const activeSeason =
    hydratedSeasons.find((season) => season.active && todayDate >= season.startDate && todayDate <= season.endDate) ??
    hydratedSeasons.find((season) => season.active) ??
    null;
  const seasonPass = activeSeason ? getSeasonPassProgress(xp.seasonXp, activeSeason.rewards) : null;
  const weeklyJournal = getWeeklyStudyJournal({
    weekDays,
    tasks,
    stepikEntries,
    notes,
    topics,
    difficulties,
    pomodoroStats: pomodoroData.stats,
  });
  const recovery = getRecoveryState({
    days,
    today,
    difficulties,
    pomodoroStats: pomodoroData.stats,
    lightDay,
  });
  const goalProgress = getCustomGoalProgress({
    goals,
    days,
    todayDate,
    tasks,
    stepikEntries,
    notes,
    topics,
    manualStudy,
    pomodoroStats: pomodoroData.stats,
  });
  const rank = progression.rank?.currentRank ?? progression.rankProgress?.currentRank;
  const inventory = await timed("[CodeFire] inventory unlocks", () =>
    syncInventoryUnlocks({
      scope: "history",
      date: todayDate,
      today,
      days,
      weekDays,
      mainLanguage,
      totalCodingXp,
      pomodoroStats: pomodoroData.stats,
      notes,
      todayNote,
      studyTasks: tasks,
      stepikEntries,
      topics,
      bosses: bossFights,
      achievements,
      inventoryItems: initialInventory.items,
      seasonLevel: seasonPass?.level ?? 0,
      seasonXp: xp.seasonXp,
      lightDays: lightDay.enabled ? 1 : 0,
    }),
  );
  const profile = getDeveloperProfile({
    progression,
    xp,
    mainLanguage,
    languageLevels,
    days,
    streak,
    achievements,
    inventory,
    currentSeason: activeSeason?.title,
    title: dailyTitle,
    topics,
  });
  const avatar = getCodeFireAvatar({
    level: progression.level,
    rank: rank ?? {
      id: "spark",
      name: "Искра",
      minXp: 0,
      medalIcon: "🔥",
      shortDescription: "",
      gradient: "",
      accentColor: "#ff8a2a",
      glowColor: "rgba(255, 138, 42, 0.45)",
      nextRank: null,
    },
    inventory,
    backgroundThemeId: themes.selectedThemeId,
  });
  const hallOfFame = getHallOfFame({
    days,
    progression,
    inventory,
    bosses: bossFights,
    season: activeSeason ?? undefined,
    pomodoroStats: pomodoroData.stats,
    stepikEntries,
    achievements,
    languageLevels,
    bestStreak: streak,
  });
  const timeline = timedSync("[CodeFire] timeline", () =>
    getLearningTimeline({
      days,
      achievements,
      bosses: bossFights,
      items: inventory.items,
      notes,
      topics,
      stepikEntries,
      pomodoroStats: pomodoroData.stats,
      rankName: rank?.name,
      seasonTitle: activeSeason?.title,
    }),
  );
  const notesByDate = new Map(notes.map((note) => [note.date, note]));
  const dayDetails = timedSync("[CodeFire] calculate day details", () =>
    days.map((day) =>
      getDayDetails({
        date: day.date,
        days,
        tasks,
        stepikEntries,
        manualStudy,
        pomodoroSessions: pomodoroData.sessions,
        note: day.date === todayDate ? todayNote : notesByDate.get(day.date) ?? null,
        difficulty: difficulties[day.date],
        quests: [],
        achievements,
        items: inventory.items,
        bosses: bossFights,
        title: day.date === todayDate ? dailyTitle : undefined,
      }),
    ),
  );

  return {
    xp,
    bossPresets,
    bossFights,
    activeBoss: bossFights.find((boss) => !boss.completed) ?? null,
    completedBosses,
    inventory,
    studyTasks: {
      items: tasks,
      stats: getStudyTaskStats(tasks, todayDate),
    },
    stepik: {
      entries: stepikEntries,
      stats: getStepikStats(stepikEntries, todayDate),
    },
    manualStudy: {
      entries: manualStudy,
      stats: getManualStudyStats(manualStudy, todayDate),
    },
    topics,
    difficulties,
    todayDifficulty: difficulties[todayDate] ?? null,
    lightDay,
    recovery,
    goals: {
      items: goals,
      progress: goalProgress,
    },
    weeklyJournal,
    seasons: hydratedSeasons,
    activeSeason,
    seasonDaysLeft: activeSeason ? getSeasonDaysLeft(activeSeason, todayDate) : 0,
    seasonPass,
    themes,
    profile,
    avatar,
    hallOfFame,
    timeline,
    dayDetails,
  };
}
