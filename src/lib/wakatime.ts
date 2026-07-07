import { addDays, eachDayOfInterval, format, subDays } from "date-fns";
import type {
  CodeFireData,
  CodeFireOverviewData,
  CodingLanguageActivity,
  DailyCodingActivity,
  LanguageStat,
  ProjectActivity,
} from "@/lib/types";
import { getProductivityStatus, getProgression, secondsToXP } from "@/lib/xp";
import { isExcludedLanguage } from "@/lib/activity-filters";
import { updateCodeFireHistory } from "@/lib/codefire-history";
import { getAchievements, getFeaturedAchievements } from "@/lib/achievements";
import { getBalanceAdvice } from "@/lib/burnout";
import { getDailyTitle } from "@/lib/daily-title";
import { getDailyNote, getDailyNotes } from "@/lib/daily-notes.server";
import { getGoalProgress } from "@/lib/goals";
import { getLanguageLevels } from "@/lib/language-levels";
import { getLearningRpg } from "@/lib/learning-rpg";
import { getPomodoroData } from "@/lib/pomodoro";
import { getProjectZones } from "@/lib/project-zones";
import { getDailyQuests, getWeeklyQuests } from "@/lib/quests";
import { getRecords } from "@/lib/records";
import { getActiveEvents, getTodayRaid } from "@/lib/raids";
import { getStreakStats } from "@/lib/streaks";
import {
  getCurrentWeekDays,
  getPreviousWeekDays,
  getWeekComparison,
  getWeeklyReport,
} from "@/lib/weekly-report";

const WAKATIME_API_BASE = "https://wakatime.com/api/v1";

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

type WakaTimeLanguage = {
  name: string;
  total_seconds?: number;
  percent?: number;
  text?: string;
};

type WakaTimeProject = {
  name: string;
  total_seconds?: number;
  percent?: number;
  text?: string;
};

type WakaTimeSummaryDay = {
  grand_total?: {
    total_seconds?: number;
  };
  languages?: WakaTimeLanguage[];
  projects?: WakaTimeProject[];
  range?: {
    date?: string;
  };
};

type WakaTimeSummariesResponse = {
  data?: WakaTimeSummaryDay[];
};

function getAuthHeader(apiKey: string) {
  return `Basic ${Buffer.from(apiKey).toString("base64")}`;
}

async function fetchWakaTime<T>(path: string, apiKey: string): Promise<T> {
  const response = await fetch(`${WAKATIME_API_BASE}${path}`, {
    headers: {
      Authorization: getAuthHeader(apiKey),
      "User-Agent": "CodeFire local dashboard",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `WakaTime API вернул ${response.status}. ${
        details ? details.slice(0, 180) : "Проверь API key и доступность сервиса."
      }`,
    );
  }

  return response.json() as Promise<T>;
}

async function fetchWakaTimeSummaries(startDate: string, endDate: string, apiKey: string) {
  const end = new Date(`${endDate}T00:00:00`);
  let cursor = new Date(`${startDate}T00:00:00`);
  const ranges: Array<{ chunkStart: string; chunkEnd: string }> = [];

  while (cursor <= end) {
    const chunkStart = format(cursor, "yyyy-MM-dd");
    const chunkEndDate = addDays(cursor, 30) > end ? end : addDays(cursor, 30);
    const chunkEnd = format(chunkEndDate, "yyyy-MM-dd");

    ranges.push({ chunkStart, chunkEnd });

    cursor = addDays(chunkEndDate, 1);
  }

  const responses = await Promise.all(
    ranges.map(({ chunkStart, chunkEnd }) =>
      fetchWakaTime<WakaTimeSummariesResponse>(
        `/users/current/summaries?start=${chunkStart}&end=${chunkEnd}`,
        apiKey,
      ),
    ),
  );

  return {
    data: responses.flatMap((response) => response.data ?? []),
  } satisfies WakaTimeSummariesResponse;
}

function normalizeDay(date: string, summary?: WakaTimeSummaryDay): DailyCodingActivity {
  const languages = getCodingLanguages(summary);
  const projects = getProjects(summary);
  const codingSeconds = languages.reduce((sum, language) => sum + language.seconds, 0);

  return {
    date,
    label: format(new Date(`${date}T00:00:00`), "dd.MM"),
    totalSeconds: codingSeconds,
    codingSeconds,
    xp: secondsToXP(codingSeconds),
    languages,
    projects,
    source: "wakatime",
  };
}

function getCodingLanguages(summary?: WakaTimeSummaryDay): CodingLanguageActivity[] {
  return (summary?.languages ?? [])
    .map((language) => ({
      name: language.name,
      seconds: Math.round(language.total_seconds ?? 0),
      xp: secondsToXP(Math.round(language.total_seconds ?? 0)),
    }))
    .filter((language) => language.seconds > 0)
    .filter((language) => !isExcludedLanguage(language.name))
    .sort((a, b) => b.seconds - a.seconds);
}

function getProjects(summary?: WakaTimeSummaryDay): ProjectActivity[] {
  return (summary?.projects ?? [])
    .map((project) => ({
      name: project.name || "Unknown",
      seconds: Math.round(project.total_seconds ?? 0),
      xp: secondsToXP(Math.round(project.total_seconds ?? 0)),
    }))
    .filter((project) => project.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds);
}

function normalizeLanguages(summary?: WakaTimeSummaryDay): LanguageStat[] {
  return [...(summary?.languages ?? [])]
    .map((language) => ({
      name: language.name,
      totalSeconds: Math.round(language.total_seconds ?? 0),
      percent: Math.round((language.percent ?? 0) * 10) / 10,
      text: language.text ?? "",
    }))
    .filter((language) => language.totalSeconds > 0)
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
}

function getMainCodingLanguage(languages: LanguageStat[]) {
  const mainLanguage = languages.find((language) => !isExcludedLanguage(language.name));

  return mainLanguage?.name ?? "Нет кода";
}

export async function getCodeFireData(apiKey: string): Promise<CodeFireData> {
  const today = new Date();
  const yearStart = subDays(today, 364);
  const last30Start = subDays(today, 29);
  const startDate = format(yearStart, "yyyy-MM-dd");
  const endDate = format(today, "yyyy-MM-dd");

  const summaries = await timed("[CodeFire] wakatime fetch", () =>
    fetchWakaTimeSummaries(startDate, endDate, apiKey),
  );

  const summariesByDate = new Map(
    (summaries.data ?? [])
      .filter((summary) => summary.range?.date)
      .map((summary) => [summary.range?.date as string, summary]),
  );

  const wakaTimeDailyActivityLast365Days = eachDayOfInterval({ start: yearStart, end: today }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    return normalizeDay(date, summariesByDate.get(date));
  });

  const todayStat = wakaTimeDailyActivityLast365Days.at(-1) ?? normalizeDay(endDate);
  const todaySummary = summariesByDate.get(endDate);
  const allLanguages = normalizeLanguages(todaySummary);
  const languages = allLanguages.slice(0, 8);
  const todayXP = todayStat.xp;
  const history = await timed("[CodeFire] local json read", () =>
    updateCodeFireHistory(wakaTimeDailyActivityLast365Days, endDate),
  );
  const historyByDate = new Map(history.days.map((day) => [day.date, day]));
  const dailyCodingActivityLast365Days = eachDayOfInterval({ start: yearStart, end: today }).map((day) => {
    const date = format(day, "yyyy-MM-dd");

    if (date === endDate) {
      return todayStat;
    }

    return historyByDate.get(date) ?? normalizeDay(date);
  });
  const dailyCodingActivityLast30Days = dailyCodingActivityLast365Days.filter(
    (day) => day.date >= format(last30Start, "yyyy-MM-dd") && day.date <= endDate,
  );
  const totalXP = history.totalXP;
  const activeDays = dailyCodingActivityLast30Days.filter((day) => day.xp > 0);
  const activeDays365 = dailyCodingActivityLast365Days.filter((day) => day.xp > 0);
  const bestDay =
    activeDays.toSorted((a, b) => b.xp - a.xp || b.date.localeCompare(a.date))[0] ?? todayStat;
  const bestDay365 =
    activeDays365.toSorted((a, b) => b.xp - a.xp || b.date.localeCompare(a.date))[0] ?? todayStat;
  const weekDays = getCurrentWeekDays(dailyCodingActivityLast365Days, endDate);
  const previousWeekDays = getPreviousWeekDays(dailyCodingActivityLast365Days, endDate);
  const streak = getStreakStats(dailyCodingActivityLast365Days, endDate);
  const mainLanguage = getMainCodingLanguage(allLanguages);
  const [pomodoroData, todayNote, notes] = await timed("[CodeFire] local json read", () =>
    Promise.all([getPomodoroData(), getDailyNote(endDate), getDailyNotes(60)]),
  );
  const yesterday = dailyCodingActivityLast365Days.at(-2);
  const quests = timedSync("[CodeFire] calculate quests", () =>
    getDailyQuests(todayStat, endDate, mainLanguage, {
      yesterday,
      streakCurrent: streak.current,
      pomodoroStats: pomodoroData.stats,
      todayNote,
      notes,
    }),
  );
  const weeklyQuests = timedSync("[CodeFire] calculate weekly quests", () =>
    getWeeklyQuests({
      today: todayStat,
      date: endDate,
      mainLanguage,
      weekDays,
      days: dailyCodingActivityLast365Days,
      options: {
        yesterday,
        streakCurrent: streak.current,
        pomodoroStats: pomodoroData.stats,
        todayNote,
        notes,
      },
    }),
  );
  const completedQuests = quests.filter((quest) => quest.completed);
  const todayRaid = getTodayRaid(todayStat, endDate, mainLanguage, {
    weekDays,
    pomodoroStats: pomodoroData.stats,
  });
  const events = getActiveEvents({
    today: todayStat,
    date: endDate,
    mainLanguage,
    weekDays,
    yesterday,
    completedQuests,
    pomodoroStats: pomodoroData.stats,
  });
  const focusPercent =
    todayStat.codingSeconds > 0
      ? Math.round(((todayStat.languages[0]?.seconds ?? 0) / todayStat.codingSeconds) * 100)
      : 0;
  const focusDay = {
    percent: focusPercent,
    language: todayStat.languages[0]?.name ?? null,
    title:
      focusPercent >= 90
        ? "Глубокий фокус"
        : focusPercent >= 70
          ? "Хороший фокус"
          : focusPercent >= 40
            ? "Смешанный фокус"
            : "Разбросанный день",
    description:
      focusPercent >= 90
        ? "Почти вся практика ушла в один навык."
        : focusPercent >= 70
          ? "Основной навык дня выражен достаточно чётко."
          : focusPercent >= 40
            ? "Сегодня практика распределилась между несколькими навыками."
            : "Фокус пока рассеян или данных мало.",
  };
  const progression = getProgression(totalXP, todayXP);
  const languageLevels = timedSync("[CodeFire] heatmap", () =>
    getLanguageLevels(dailyCodingActivityLast365Days),
  );
  const allAchievements = timedSync("[CodeFire] achievements", () =>
    getAchievements(dailyCodingActivityLast365Days, totalXP, {
      pomodoroStats: pomodoroData.stats,
      notes,
    }),
  );
  const achievements = getFeaturedAchievements(allAchievements);
  const dailyTitle = getDailyTitle({
    date: endDate,
    mainLanguage,
    todayXP,
    focusPercent,
    completedQuests,
    pomodoroFocusSessions: pomodoroData.stats.todayCompletedFocusSessions,
    streak: streak.current,
    mood: todayNote?.mood,
  });
  const learning = await timed("[CodeFire] seasons", () =>
    getLearningRpg({
      days: dailyCodingActivityLast365Days,
      weekDays,
      today: todayStat,
      todayDate: endDate,
      totalCodingXp: totalXP,
      progression,
      mainLanguage,
      languageLevels,
      streak: streak.current,
      achievements: allAchievements,
      pomodoroData,
      notes,
      todayNote,
      dailyTitle: dailyTitle.title,
    }),
  );

  return {
    configured: true,
    generatedAt: new Date().toISOString(),
    today: {
      date: endDate,
      totalSeconds: todayStat.totalSeconds,
      hours: todayStat.totalSeconds / 3600,
      xp: todayXP,
      languages,
      mainLanguage,
      status: getProductivityStatus(todayXP, endDate),
    },
    progression,
    last30Days: {
      days: dailyCodingActivityLast30Days,
      dailyCodingActivityLast30Days,
      bestDay,
      activeDays: activeDays.length,
      totalXP: dailyCodingActivityLast30Days.reduce((sum, day) => sum + day.xp, 0),
    },
    last365Days: {
      days: dailyCodingActivityLast365Days,
      bestDay: bestDay365,
      activeDays: activeDays365.length,
      totalXP: dailyCodingActivityLast365Days.reduce((sum, day) => sum + day.xp, 0),
    },
    rpg: {
      streak,
      quests,
      weeklyQuests,
      achievements,
      goals: getGoalProgress(todayStat, weekDays),
      weeklyReport: getWeeklyReport(weekDays),
      weekComparison: getWeekComparison(weekDays, previousWeekDays),
      languageLevels,
      projectZones: getProjectZones(weekDays),
      focusDay,
      records: getRecords(dailyCodingActivityLast365Days, streak.best, {
        tasks: learning.studyTasks.items,
        pomodoroStats: pomodoroData.stats,
        bosses: learning.bossFights,
        notes,
      }),
      dailyTitle,
      balance: getBalanceAdvice(dailyCodingActivityLast365Days, todayStat, streak.current, {
        pomodoroStats: pomodoroData.stats,
        todayNote,
      }),
      todayRaid,
      events,
      learning,
    },
  };
}

export async function getCodeFireOverviewData(apiKey: string): Promise<CodeFireOverviewData> {
  console.time("[CodeFire] overview total");
  try {
    const today = new Date();
    const yearStart = subDays(today, 364);
    const last30Start = subDays(today, 29);
    const startDate = format(yearStart, "yyyy-MM-dd");
    const endDate = format(today, "yyyy-MM-dd");

    const summaries = await timed("[CodeFire] wakatime fetch", () =>
      fetchWakaTimeSummaries(startDate, endDate, apiKey),
    );

    const summariesByDate = new Map(
      (summaries.data ?? [])
        .filter((summary) => summary.range?.date)
        .map((summary) => [summary.range?.date as string, summary]),
    );

    const wakaTimeDailyActivityLast365Days = eachDayOfInterval({ start: yearStart, end: today }).map((day) => {
      const date = format(day, "yyyy-MM-dd");
      return normalizeDay(date, summariesByDate.get(date));
    });

    const todayStat = wakaTimeDailyActivityLast365Days.at(-1) ?? normalizeDay(endDate);
    const todaySummary = summariesByDate.get(endDate);
    const allLanguages = normalizeLanguages(todaySummary);
    const languages = allLanguages.slice(0, 8);
    const todayXP = todayStat.xp;

    const [history, pomodoroData, todayNote, notes] = await timed("[CodeFire] local json read", () =>
      Promise.all([
        updateCodeFireHistory(wakaTimeDailyActivityLast365Days, endDate),
        getPomodoroData(),
        getDailyNote(endDate),
        getDailyNotes(60),
      ]),
    );

    const historyByDate = new Map(history.days.map((day) => [day.date, day]));
    const dailyCodingActivityLast365Days = eachDayOfInterval({ start: yearStart, end: today }).map((day) => {
      const date = format(day, "yyyy-MM-dd");

      if (date === endDate) {
        return todayStat;
      }

      return historyByDate.get(date) ?? normalizeDay(date);
    });
    const dailyCodingActivityLast30Days = dailyCodingActivityLast365Days.filter(
      (day) => day.date >= format(last30Start, "yyyy-MM-dd") && day.date <= endDate,
    );

    const derived = timedSync("[CodeFire] derived calculations", () => {
      const totalXP = history.totalXP;
      const activeDays = dailyCodingActivityLast30Days.filter((day) => day.xp > 0);
      const activeDays365 = dailyCodingActivityLast365Days.filter((day) => day.xp > 0);
      const bestDay =
        activeDays.toSorted((a, b) => b.xp - a.xp || b.date.localeCompare(a.date))[0] ?? todayStat;
      const bestDay365 =
        activeDays365.toSorted((a, b) => b.xp - a.xp || b.date.localeCompare(a.date))[0] ?? todayStat;
      const weekDays = getCurrentWeekDays(dailyCodingActivityLast365Days, endDate);
      const previousWeekDays = getPreviousWeekDays(dailyCodingActivityLast365Days, endDate);
      const streak = getStreakStats(dailyCodingActivityLast365Days, endDate);
      const mainLanguage = getMainCodingLanguage(allLanguages);
      const yesterday = dailyCodingActivityLast365Days.at(-2);
      const quests = getDailyQuests(todayStat, endDate, mainLanguage, {
        yesterday,
        streakCurrent: streak.current,
        pomodoroStats: pomodoroData.stats,
        todayNote,
        notes,
      });
      const weeklyQuests = getWeeklyQuests({
        today: todayStat,
        date: endDate,
        mainLanguage,
        weekDays,
        days: dailyCodingActivityLast365Days,
        options: {
          yesterday,
          streakCurrent: streak.current,
          pomodoroStats: pomodoroData.stats,
          todayNote,
          notes,
        },
      });
      const completedQuests = quests.filter((quest) => quest.completed);
      const todayRaid = getTodayRaid(todayStat, endDate, mainLanguage, {
        weekDays,
        pomodoroStats: pomodoroData.stats,
      });
      const events = getActiveEvents({
        today: todayStat,
        date: endDate,
        mainLanguage,
        weekDays,
        yesterday,
        completedQuests,
        pomodoroStats: pomodoroData.stats,
      });
      const focusPercent =
        todayStat.codingSeconds > 0
          ? Math.round(((todayStat.languages[0]?.seconds ?? 0) / todayStat.codingSeconds) * 100)
          : 0;
      const focusDay = {
        percent: focusPercent,
        language: todayStat.languages[0]?.name ?? null,
        title:
          focusPercent >= 90
            ? "Глубокий фокус"
            : focusPercent >= 70
              ? "Хороший фокус"
              : focusPercent >= 40
                ? "Смешанный фокус"
                : "Рассеянный день",
        description:
          focusPercent >= 90
            ? "Почти вся практика ушла в один навык."
            : focusPercent >= 70
              ? "Основной навык дня выражен достаточно четко."
              : focusPercent >= 40
                ? "Сегодня практика распределилась между несколькими навыками."
                : "Фокус пока рассеян или данных мало.",
      };
      const progression = getProgression(totalXP, todayXP);
      const languageLevelsPreview = timedSync("[CodeFire] heatmap", () =>
        getLanguageLevels(dailyCodingActivityLast365Days).slice(0, 5),
      );
      const dailyTitle = getDailyTitle({
        date: endDate,
        mainLanguage,
        todayXP,
        focusPercent,
        completedQuests,
        pomodoroFocusSessions: pomodoroData.stats.todayCompletedFocusSessions,
        streak: streak.current,
        mood: todayNote?.mood,
      });

      return {
        totalXP,
        activeDays,
        activeDays365,
        bestDay,
        bestDay365,
        weekDays,
        previousWeekDays,
        streak,
        mainLanguage,
        quests,
        weeklyQuests,
        focusDay,
        progression,
        languageLevelsPreview,
        dailyTitle,
        todayRaid,
        events,
        balance: getBalanceAdvice(dailyCodingActivityLast365Days, todayStat, streak.current, {
          pomodoroStats: pomodoroData.stats,
          todayNote,
        }),
        goals: getGoalProgress(todayStat, weekDays),
      };
    });

    return {
      configured: true,
      generatedAt: new Date().toISOString(),
      today: {
        date: endDate,
        totalSeconds: todayStat.totalSeconds,
        hours: todayStat.totalSeconds / 3600,
        xp: todayXP,
        languages,
        mainLanguage: derived.mainLanguage,
        status: getProductivityStatus(todayXP, endDate),
      },
      progression: derived.progression,
      last30Days: {
        days: dailyCodingActivityLast30Days,
        dailyCodingActivityLast30Days,
        bestDay: derived.bestDay,
        activeDays: derived.activeDays.length,
        totalXP: dailyCodingActivityLast30Days.reduce((sum, day) => sum + day.xp, 0),
      },
      last365Days: {
        bestDay: derived.bestDay365,
        activeDays: derived.activeDays365.length,
        totalXP: dailyCodingActivityLast365Days.reduce((sum, day) => sum + day.xp, 0),
      },
      languageLevelsPreview: derived.languageLevelsPreview,
      heatmapPreview: dailyCodingActivityLast30Days.slice(-14),
      lastUpdatedAt: new Date().toISOString(),
      pomodoroToday: {
        completedFocusSessions: pomodoroData.stats.todayCompletedFocusSessions,
        completedBreakSessions: pomodoroData.stats.todayCompletedBreakSessions,
        focusMinutes: pomodoroData.stats.todayFocusMinutes,
      },
      rpg: {
        streak: derived.streak,
        quests: derived.quests.slice(0, 5),
        weeklyQuests: derived.weeklyQuests.slice(0, 3),
        goals: derived.goals,
        focusDay: derived.focusDay,
        dailyTitle: derived.dailyTitle,
        balance: derived.balance,
        todayRaid: derived.todayRaid,
        events: derived.events.slice(0, 2),
      },
    };
  } finally {
    console.timeEnd("[CodeFire] overview total");
  }
}
