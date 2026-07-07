import { isExcludedLanguage } from "@/lib/activity-filters";
import type { DailyCodingActivity } from "@/lib/types";

export type AnalyticsPeriod = 7 | 30 | 60 | 90 | 365 | "all";
export type AnalyticsMetric = "time" | "xp";

export type AnalyticsSummary = {
  totalSeconds: number;
  totalXp: number;
  activeDays: number;
  totalDays: number;
  averageSecondsPerDay: number;
  averageSecondsPerActiveDay: number;
  bestDay: DailyCodingActivity | null;
  mainLanguage: string | null;
  consistencyScore: number;
};

export type LanguageStat = {
  language: string;
  seconds: number;
  xp: number;
  share: number;
  activeDays: number;
  bestDay: DailyCodingActivity | null;
};

export type ProjectStat = {
  project: string;
  seconds: number;
  xp: number;
  share: number;
  activeDays: number;
  lastActive: string | null;
};

export type WeekdayStat = {
  weekday: string;
  weekdayIndex: number;
  seconds: number;
  xp: number;
  averageSeconds: number;
  activeDays: number;
};

export type ActivityDistributionItem = {
  key: "zero" | "light" | "steady" | "productive" | "intense";
  label: string;
  days: number;
  share: number;
};

export type AnalyticsRecord = {
  label: string;
  value: string;
  detail?: string;
};

export type WeeklyComparison = {
  currentWeekSeconds: number;
  previousWeekSeconds: number;
  diffSeconds: number;
  diffPercent: number | null;
  activeDaysThisWeek: number;
  bestDayThisWeek: DailyCodingActivity | null;
  mainLanguageThisWeek: string | null;
  insight: string;
  hasEnoughData: boolean;
};

export type AnalyticsInsight = {
  title: string;
  detail: string;
};

export type YearSummary = AnalyticsSummary & {
  currentStreak: number;
  bestStreak: number;
  bestMonth: {
    label: string;
    seconds: number;
  } | null;
};

export type HeatmapInsight = {
  activityDensity: {
    activeDays: number;
    totalDays: number;
    percent: number;
  };
  mostActiveWeekday: {
    day: string;
    seconds: number;
  } | null;
  weekendVsWeekdays: {
    weekdaysSeconds: number;
    weekendSeconds: number;
  };
  lastActiveDate: string | null;
  currentMonth: {
    activeDays: number;
    seconds: number;
  } | null;
  longestInactiveGapDays: number;
  consistencyScore: number;
};

export type TopDay = {
  date: string;
  seconds: number;
  xp: number;
  mainLanguage: string | null;
  project: string | null;
};

export type TopDaysSummary = {
  bestDay: TopDay | null;
  averageTopDaySeconds: number;
  topLanguage: string | null;
  topDays: TopDay[];
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const mondayFirstWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateToUtcMs(date: string) {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDays(date: string, days: number) {
  return new Date(dateToUtcMs(date) + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function getSeconds(day: DailyCodingActivity) {
  return day.codingSeconds || day.totalSeconds || 0;
}

function getXp(day: DailyCodingActivity) {
  return day.xp || Math.floor(getSeconds(day) / 60);
}

function getMainLanguageFromTotals(totals: Map<string, number>) {
  return [...totals.entries()]
    .filter(([language]) => !isExcludedLanguage(language))
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function getLanguageTotals(days: DailyCodingActivity[]) {
  const totals = new Map<string, number>();

  for (const day of days) {
    for (const language of day.languages) {
      totals.set(language.name, (totals.get(language.name) ?? 0) + language.seconds);
    }
  }

  return totals;
}

export function formatAnalyticsDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;

  return `${hours} h ${minutes} min`;
}

function calculateBestStreak(days: DailyCodingActivity[]) {
  const activeDays = days.filter((day) => getSeconds(day) > 0).sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let current = 0;
  let previous: string | null = null;

  for (const day of activeDays) {
    current = previous && addDays(previous, 1) === day.date ? current + 1 : 1;
    best = Math.max(best, current);
    previous = day.date;
  }

  return best;
}

function calculateCurrentStreak(days: DailyCodingActivity[]) {
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const lastDate = sortedDays.at(-1)?.date;

  if (!lastDate) return 0;

  const activeDates = new Set(sortedDays.filter((day) => getSeconds(day) > 0).map((day) => day.date));
  const startDate = activeDates.has(lastDate) ? lastDate : addDays(lastDate, -1);
  let streak = 0;

  for (let cursor = startDate; activeDates.has(cursor); cursor = addDays(cursor, -1)) {
    streak += 1;
  }

  return streak;
}

export function filterAnalyticsDays(days: DailyCodingActivity[], period: AnalyticsPeriod) {
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));

  if (period === "all") return sortedDays;

  return sortedDays.slice(-period);
}

export function calculateAnalyticsSummary(days: DailyCodingActivity[]): AnalyticsSummary {
  const totalSeconds = days.reduce((sum, day) => sum + getSeconds(day), 0);
  const totalXp = days.reduce((sum, day) => sum + getXp(day), 0);
  const activeDays = days.filter((day) => getSeconds(day) > 0).length;
  const bestDay = days.filter((day) => getSeconds(day) > 0).toSorted((a, b) => getSeconds(b) - getSeconds(a))[0] ?? null;
  const languageTotals = getLanguageTotals(days);

  return {
    totalSeconds,
    totalXp,
    activeDays,
    totalDays: days.length,
    averageSecondsPerDay: days.length > 0 ? totalSeconds / days.length : 0,
    averageSecondsPerActiveDay: activeDays > 0 ? totalSeconds / activeDays : 0,
    bestDay,
    mainLanguage: getMainLanguageFromTotals(languageTotals),
    consistencyScore: days.length > 0 ? Math.round((activeDays / days.length) * 100) : 0,
  };
}

export function calculateYearSummary(days: DailyCodingActivity[]): YearSummary {
  const summary = calculateAnalyticsSummary(days);
  const months = new Map<string, number>();

  for (const day of days) {
    const key = day.date.slice(0, 7);
    months.set(key, (months.get(key) ?? 0) + getSeconds(day));
  }

  const bestMonthEntry = [...months.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    ...summary,
    currentStreak: calculateCurrentStreak(days),
    bestStreak: calculateBestStreak(days),
    bestMonth: bestMonthEntry ? { label: monthLabel(bestMonthEntry[0]), seconds: bestMonthEntry[1] } : null,
  };
}

export function calculateHeatmapInsights(days: DailyCodingActivity[]): HeatmapInsight {
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const activeDays = sortedDays.filter((day) => getSeconds(day) > 0);
  const weekdayStats = calculateWeekdayStats(sortedDays);
  const mostActiveWeekday = weekdayStats.filter((day) => day.seconds > 0).toSorted((a, b) => b.seconds - a.seconds)[0] ?? null;
  const lastDay = sortedDays.at(-1) ?? null;
  const currentMonthKey = lastDay?.date.slice(0, 7) ?? null;
  const currentMonthDays = currentMonthKey ? sortedDays.filter((day) => day.date.startsWith(currentMonthKey)) : [];
  let longestInactiveGapDays = 0;
  let currentInactiveGapDays = 0;
  let weekdaysSeconds = 0;
  let weekendSeconds = 0;

  for (const day of sortedDays) {
    const seconds = getSeconds(day);
    const weekday = new Date(`${day.date}T00:00:00`).getDay();

    if (weekday === 0 || weekday === 6) {
      weekendSeconds += seconds;
    } else {
      weekdaysSeconds += seconds;
    }

    if (seconds > 0) {
      longestInactiveGapDays = Math.max(longestInactiveGapDays, currentInactiveGapDays);
      currentInactiveGapDays = 0;
    } else {
      currentInactiveGapDays += 1;
    }
  }

  longestInactiveGapDays = Math.max(longestInactiveGapDays, currentInactiveGapDays);

  return {
    activityDensity: {
      activeDays: activeDays.length,
      totalDays: sortedDays.length,
      percent: sortedDays.length > 0 ? Math.round((activeDays.length / sortedDays.length) * 100) : 0,
    },
    mostActiveWeekday: mostActiveWeekday ? { day: mostActiveWeekday.weekday, seconds: mostActiveWeekday.seconds } : null,
    weekendVsWeekdays: {
      weekdaysSeconds,
      weekendSeconds,
    },
    lastActiveDate: activeDays.at(-1)?.date ?? null,
    currentMonth: currentMonthKey
      ? {
          activeDays: currentMonthDays.filter((day) => getSeconds(day) > 0).length,
          seconds: currentMonthDays.reduce((sum, day) => sum + getSeconds(day), 0),
        }
      : null,
    longestInactiveGapDays,
    consistencyScore: sortedDays.length > 0 ? Math.round((activeDays.length / sortedDays.length) * 100) : 0,
  };
}

export function calculateTopDays(days: DailyCodingActivity[], limit = 7): TopDaysSummary {
  const topDays = [...days]
    .filter((day) => getSeconds(day) > 0)
    .sort((a, b) => getSeconds(b) - getSeconds(a) || b.date.localeCompare(a.date))
    .slice(0, limit)
    .map<TopDay>((day) => ({
      date: day.date,
      seconds: getSeconds(day),
      xp: getXp(day),
      mainLanguage: day.languages.find((language) => !isExcludedLanguage(language.name))?.name ?? day.languages[0]?.name ?? null,
      project: day.projects?.[0]?.name ?? null,
    }));
  const languageTotals = new Map<string, number>();

  for (const day of topDays) {
    if (!day.mainLanguage) continue;
    languageTotals.set(day.mainLanguage, (languageTotals.get(day.mainLanguage) ?? 0) + day.seconds);
  }

  return {
    bestDay: topDays[0] ?? null,
    averageTopDaySeconds: topDays.length > 0 ? topDays.reduce((sum, day) => sum + day.seconds, 0) / topDays.length : 0,
    topLanguage: getMainLanguageFromTotals(languageTotals) ?? topDays[0]?.mainLanguage ?? null,
    topDays,
  };
}

export function calculateLanguageBreakdown(days: DailyCodingActivity[]): LanguageStat[] {
  const totals = new Map<string, { seconds: number; xp: number; activeDates: Set<string>; bestDay: DailyCodingActivity | null }>();
  let totalLanguageSeconds = 0;

  for (const day of days) {
    for (const language of day.languages) {
      const current = totals.get(language.name) ?? {
        seconds: 0,
        xp: 0,
        activeDates: new Set<string>(),
        bestDay: null,
      };
      current.seconds += language.seconds;
      current.xp += language.xp || Math.floor(language.seconds / 60);
      current.activeDates.add(day.date);

      const currentBestSeconds = current.bestDay?.languages.find((item) => item.name === language.name)?.seconds ?? 0;
      if (!current.bestDay || language.seconds > currentBestSeconds) {
        current.bestDay = day;
      }

      totals.set(language.name, current);
      totalLanguageSeconds += language.seconds;
    }
  }

  return [...totals.entries()]
    .map(([language, value]) => ({
      language,
      seconds: value.seconds,
      xp: value.xp,
      share: totalLanguageSeconds > 0 ? Math.round((value.seconds / totalLanguageSeconds) * 1000) / 10 : 0,
      activeDays: value.activeDates.size,
      bestDay: value.bestDay,
    }))
    .sort((a, b) => b.seconds - a.seconds);
}

export function calculateProjectBreakdown(days: DailyCodingActivity[]): ProjectStat[] {
  const totals = new Map<string, { seconds: number; xp: number; activeDates: Set<string>; lastActive: string | null }>();
  let totalProjectSeconds = 0;

  for (const day of days) {
    for (const project of day.projects ?? []) {
      const current = totals.get(project.name) ?? {
        seconds: 0,
        xp: 0,
        activeDates: new Set<string>(),
        lastActive: null,
      };
      current.seconds += project.seconds;
      current.xp += project.xp || Math.floor(project.seconds / 60);
      current.activeDates.add(day.date);
      current.lastActive = !current.lastActive || day.date > current.lastActive ? day.date : current.lastActive;
      totals.set(project.name, current);
      totalProjectSeconds += project.seconds;
    }
  }

  return [...totals.entries()]
    .map(([project, value]) => ({
      project,
      seconds: value.seconds,
      xp: value.xp,
      share: totalProjectSeconds > 0 ? Math.round((value.seconds / totalProjectSeconds) * 1000) / 10 : 0,
      activeDays: value.activeDates.size,
      lastActive: value.lastActive,
    }))
    .sort((a, b) => b.seconds - a.seconds);
}

export function calculateWeekdayStats(days: DailyCodingActivity[]): WeekdayStat[] {
  return mondayFirstWeekdays.map((weekday) => {
    const weekdayIndex = weekdayLabels.indexOf(weekday);
    const matchingDays = days.filter((day) => new Date(`${day.date}T00:00:00`).getDay() === weekdayIndex);
    const seconds = matchingDays.reduce((sum, day) => sum + getSeconds(day), 0);

    return {
      weekday,
      weekdayIndex,
      seconds,
      xp: Math.floor(seconds / 60),
      averageSeconds: matchingDays.length > 0 ? seconds / matchingDays.length : 0,
      activeDays: matchingDays.filter((day) => getSeconds(day) > 0).length,
    };
  });
}

export function calculateActivityDistribution(days: DailyCodingActivity[]): ActivityDistributionItem[] {
  const buckets: ActivityDistributionItem[] = [
    { key: "zero", label: "Zero days", days: 0, share: 0 },
    { key: "light", label: "Light 1-30m", days: 0, share: 0 },
    { key: "steady", label: "Steady 30-90m", days: 0, share: 0 },
    { key: "productive", label: "Productive 90-180m", days: 0, share: 0 },
    { key: "intense", label: "Intense 180m+", days: 0, share: 0 },
  ];

  for (const day of days) {
    const minutes = getSeconds(day) / 60;
    const bucket = minutes <= 0 ? buckets[0] : minutes <= 30 ? buckets[1] : minutes <= 90 ? buckets[2] : minutes <= 180 ? buckets[3] : buckets[4];
    bucket.days += 1;
  }

  return buckets.map((bucket) => ({
    ...bucket,
    share: days.length > 0 ? Math.round((bucket.days / days.length) * 1000) / 10 : 0,
  }));
}

export function calculateRecords(days: DailyCodingActivity[]): AnalyticsRecord[] {
  const activeDays = days.filter((day) => getSeconds(day) > 0);
  const bestDay = activeDays.toSorted((a, b) => getSeconds(b) - getSeconds(a))[0] ?? null;
  const languageStats = calculateLanguageBreakdown(days);
  const projectStats = calculateProjectBreakdown(days);
  const weekdayStats = calculateWeekdayStats(days);
  const weeks = new Map<string, number>();
  const months = new Map<string, number>();
  const weekEntries: Array<{ key: string; seconds: number }> = [];

  for (const day of days) {
    const date = new Date(`${day.date}T00:00:00`);
    const mondayOffset = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const monday = addDays(day.date, -mondayOffset);
    weeks.set(monday, (weeks.get(monday) ?? 0) + getSeconds(day));
    months.set(day.date.slice(0, 7), (months.get(day.date.slice(0, 7)) ?? 0) + getSeconds(day));
  }

  for (const [key, seconds] of weeks.entries()) {
    weekEntries.push({ key, seconds });
  }

  const bestWeek = weekEntries.toSorted((a, b) => b.seconds - a.seconds)[0];
  const bestMonth = [...months.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestLanguageDay = languageStats
    .map((language) => ({
      language: language.language,
      day: language.bestDay,
      seconds: language.bestDay?.languages.find((item) => item.name === language.language)?.seconds ?? 0,
    }))
    .toSorted((a, b) => b.seconds - a.seconds)[0];
  const highestFocusDay = activeDays
    .map((day) => ({
      day,
      language: day.languages[0]?.name ?? null,
      percent: getSeconds(day) > 0 ? Math.round(((day.languages[0]?.seconds ?? 0) / getSeconds(day)) * 100) : 0,
    }))
    .filter((item) => item.language)
    .toSorted((a, b) => b.percent - a.percent || getSeconds(b.day) - getSeconds(a.day))[0];
  const biggestGrowth = weekEntries
    .map((week, index) => {
      const previous = weekEntries[index - 1];
      return previous ? { week: week.key, diff: week.seconds - previous.seconds } : null;
    })
    .filter((week): week is { week: string; diff: number } => week !== null)
    .toSorted((a, b) => b.diff - a.diff)[0];

  return [
    { label: "Best coding day", value: bestDay ? formatAnalyticsDuration(getSeconds(bestDay)) : "No data", detail: bestDay?.date },
    { label: "Best week", value: bestWeek ? formatAnalyticsDuration(bestWeek.seconds) : "No data", detail: bestWeek?.key },
    { label: "Best month", value: bestMonth ? formatAnalyticsDuration(bestMonth[1]) : "No data", detail: bestMonth ? monthLabel(bestMonth[0]) : undefined },
    {
      label: "Best language day",
      value: bestLanguageDay?.seconds ? formatAnalyticsDuration(bestLanguageDay.seconds) : "No data",
      detail: bestLanguageDay?.day ? `${bestLanguageDay.language} on ${bestLanguageDay.day.date}` : undefined,
    },
    { label: "Longest streak", value: `${calculateBestStreak(days)} days` },
    {
      label: "Highest focus language day",
      value: highestFocusDay ? `${highestFocusDay.percent}%` : "No data",
      detail: highestFocusDay?.day ? `${highestFocusDay.language} on ${highestFocusDay.day.date}` : undefined,
    },
    { label: "Most active project", value: projectStats[0]?.project ?? "No data", detail: projectStats[0] ? formatAnalyticsDuration(projectStats[0].seconds) : undefined },
    {
      label: "Biggest week-over-week growth",
      value: biggestGrowth && biggestGrowth.diff > 0 ? `+${formatAnalyticsDuration(biggestGrowth.diff)}` : "No growth yet",
      detail: biggestGrowth?.week,
    },
    {
      label: "Best weekday",
      value: weekdayStats.toSorted((a, b) => b.seconds - a.seconds)[0]?.weekday ?? "No data",
      detail: formatAnalyticsDuration(weekdayStats.toSorted((a, b) => b.seconds - a.seconds)[0]?.seconds ?? 0),
    },
  ];
}

export function calculateWeeklyComparison(days: DailyCodingActivity[]): WeeklyComparison {
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const endDate = sortedDays.at(-1)?.date;

  if (!endDate) {
    return {
      currentWeekSeconds: 0,
      previousWeekSeconds: 0,
      diffSeconds: 0,
      diffPercent: null,
      activeDaysThisWeek: 0,
      bestDayThisWeek: null,
      mainLanguageThisWeek: null,
      insight: "Not enough data for comparison.",
      hasEnoughData: false,
    };
  }

  const currentWeekStart = addDays(endDate, -6);
  const previousWeekStart = addDays(endDate, -13);
  const previousWeekEnd = addDays(endDate, -7);
  const currentWeek = sortedDays.filter((day) => day.date >= currentWeekStart && day.date <= endDate);
  const previousWeek = sortedDays.filter((day) => day.date >= previousWeekStart && day.date <= previousWeekEnd);
  const currentWeekSeconds = currentWeek.reduce((sum, day) => sum + getSeconds(day), 0);
  const previousWeekSeconds = previousWeek.reduce((sum, day) => sum + getSeconds(day), 0);
  const diffSeconds = currentWeekSeconds - previousWeekSeconds;
  const mainLanguageThisWeek = getMainLanguageFromTotals(getLanguageTotals(currentWeek));

  return {
    currentWeekSeconds,
    previousWeekSeconds,
    diffSeconds,
    diffPercent: previousWeekSeconds > 0 ? Math.round((diffSeconds / previousWeekSeconds) * 100) : null,
    activeDaysThisWeek: currentWeek.filter((day) => getSeconds(day) > 0).length,
    bestDayThisWeek: currentWeek.filter((day) => getSeconds(day) > 0).toSorted((a, b) => getSeconds(b) - getSeconds(a))[0] ?? null,
    mainLanguageThisWeek,
    insight:
      previousWeekSeconds > 0
        ? `This week is ${diffSeconds >= 0 ? "ahead by" : "behind by"} ${formatAnalyticsDuration(Math.abs(diffSeconds))}. Main focus: ${mainLanguageThisWeek ?? "mixed"}.`
        : "Not enough data for comparison with the previous week.",
    hasEnoughData: previousWeek.some((day) => getSeconds(day) > 0) || currentWeek.some((day) => getSeconds(day) > 0),
  };
}

export function generateAnalyticsInsights(input: {
  days: DailyCodingActivity[];
  summary: AnalyticsSummary;
  languageStats: LanguageStat[];
  weekdayStats: WeekdayStat[];
  weeklyComparison: WeeklyComparison;
}): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  const bestWeekday = input.weekdayStats.toSorted((a, b) => b.seconds - a.seconds)[0] ?? null;
  const weekendSeconds = input.weekdayStats
    .filter((day) => day.weekday === "Sat" || day.weekday === "Sun")
    .reduce((sum, day) => sum + day.seconds, 0);
  const topLanguage = input.languageStats.find((language) => !isExcludedLanguage(language.language)) ?? input.languageStats[0];

  if (input.summary.bestDay) {
    insights.push({
      title: "Strongest day",
      detail: `${input.summary.bestDay.date} led the period with ${formatAnalyticsDuration(getSeconds(input.summary.bestDay))}.`,
    });
  }

  if (topLanguage) {
    insights.push({
      title: "Main language",
      detail: `${topLanguage.language} accounts for ${topLanguage.share}% of tracked coding time.`,
    });
  }

  if (input.weeklyComparison.diffSeconds !== 0 && input.weeklyComparison.previousWeekSeconds > 0) {
    insights.push({
      title: input.weeklyComparison.diffSeconds > 0 ? "Weekly growth" : "Weekly cooldown",
      detail: input.weeklyComparison.insight,
    });
  }

  if (bestWeekday && bestWeekday.seconds > 0) {
    insights.push({
      title: "Best rhythm",
      detail: `${bestWeekday.weekday} is the strongest weekday in this period with ${formatAnalyticsDuration(bestWeekday.seconds)} total.`,
    });
  }

  if (input.summary.totalSeconds > 0 && weekendSeconds / input.summary.totalSeconds >= 0.5) {
    insights.push({
      title: "Weekend focus",
      detail: "Most coding time landed on the weekend in this period.",
    });
  }

  if (input.summary.consistencyScore >= 60) {
    insights.push({
      title: "Consistent period",
      detail: `${input.summary.consistencyScore}% of days had coding activity.`,
    });
  }

  return insights.slice(0, 6);
}
