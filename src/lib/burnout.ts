import { clampPercent } from "@/lib/codefire-config";
import { hasDailyNoteContent, type DailyNote } from "@/lib/daily-notes";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { DailyCodingActivity } from "@/lib/types";

export type LearningBalance = {
  score: number;
  status: "rest" | "healthy" | "intense" | "overload" | "recovery";
  title: string;
  description: string;
  tips: string[];
};

export type BalanceAdvice = LearningBalance & {
  tone: "calm" | "warning" | "fire";
  message: string;
};

function focusPercent(today: DailyCodingActivity) {
  if (today.codingSeconds <= 0) {
    return 0;
  }

  return Math.round(((today.languages[0]?.seconds ?? 0) / today.codingSeconds) * 100);
}

function heavyStreak(days: DailyCodingActivity[]) {
  let streak = 0;

  for (const day of [...days].sort((a, b) => b.date.localeCompare(a.date))) {
    if (day.xp < 240) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function hasRestDay(days: DailyCodingActivity[]) {
  return days.some((day) => day.xp === 0);
}

function clampScore(score: number) {
  return Math.round(clampPercent(score));
}

function statusMeta(status: LearningBalance["status"]) {
  if (status === "overload") {
    return {
      tone: "fire" as const,
      title: "Риск выгорания",
      description:
        "Сегодня нагрузка высокая. Лучше завершить день мягко и восстановиться, чем добивать прогресс силой.",
    };
  }

  if (status === "intense") {
    return {
      tone: "warning" as const,
      title: "Интенсивный режим",
      description: "Много практики. Следи за отдыхом между сессиями и не превращай серию в давление.",
    };
  }

  if (status === "recovery") {
    return {
      tone: "calm" as const,
      title: "День восстановления",
      description: "После сильного дня короткая практика тоже засчитывается. Восстановление поддерживает систему.",
    };
  }

  if (status === "rest") {
    return {
      tone: "calm" as const,
      title: "День ещё не начался",
      description: "Можно сделать короткую 15-минутную сессию или спокойно отдохнуть.",
    };
  }

  return {
    tone: "calm" as const,
    title: "Здоровый ритм",
    description: "Практика идёт стабильно, без признаков перегруза.",
  };
}

function tipsForStatus({
  status,
  todayMinutes,
  breaks,
  hasNote,
  focus,
}: {
  status: LearningBalance["status"];
  todayMinutes: number;
  breaks: number;
  hasNote: boolean;
  focus: number;
}) {
  const tips: string[] = [];

  if (status === "overload") {
    tips.push("Останови день на понятной точке, даже если ещё есть силы.");
    tips.push("Запланируй лёгкий старт завтра: 15–30 минут достаточно.");
  } else if (status === "intense") {
    tips.push("После следующей focus-сессии поставь настоящий перерыв.");
    tips.push("Не добавляй цели только ради числа XP.");
  } else if (status === "recovery") {
    tips.push("Держи практику короткой и спокойной.");
    tips.push("Восстановление сегодня работает на завтрашний фокус.");
  } else if (status === "rest") {
    tips.push("Если хочется сохранить ритм, начни с одной маленькой сессии.");
    tips.push("Если нужен отдых, это тоже часть обучения.");
  } else {
    tips.push("Сохраняй текущий темп без лишнего давления.");
  }

  if (todayMinutes > 0 && breaks === 0) {
    tips.push("Добавь короткий перерыв после Pomodoro или блока кодинга.");
  }

  if (!hasNote) {
    tips.push("Короткая заметка поможет увидеть прогресс без догадок.");
  }

  if (focus < 40 && todayMinutes > 0) {
    tips.push("Можно выбрать один главный навык для следующего блока.");
  }

  return tips.slice(0, 3);
}

export function getBalanceAdvice(
  days: DailyCodingActivity[],
  today: DailyCodingActivity,
  currentStreak: number,
  options: {
    pomodoroStats?: PomodoroStats;
    todayNote?: DailyNote | null;
  } = {},
): BalanceAdvice {
  const todayMinutes = today.xp;
  const last7Days = days.slice(-7);
  const activeDaysLast7 = last7Days.filter((day) => day.xp > 0).length;
  const heavyDaysInRow = heavyStreak(last7Days);
  const yesterday = days.at(-2);
  const focus = focusPercent(today);
  const breaks = options.pomodoroStats?.todayCompletedBreakSessions ?? 0;
  const focusSessions = options.pomodoroStats?.todayCompletedFocusSessions ?? 0;
  const hasNote = Boolean(options.todayNote && hasDailyNoteContent(options.todayNote));
  const mood = options.todayNote?.mood;

  let score = 52;

  if (todayMinutes === 0) score += 10;
  else if (todayMinutes <= 29) score += 8;
  else if (todayMinutes <= 120) score += 18;
  else if (todayMinutes <= 239) score += 12;
  else if (todayMinutes <= 359) score -= 8;
  else score -= 22;

  if (activeDaysLast7 >= 3 && activeDaysLast7 <= 5) score += 14;
  else if (activeDaysLast7 > 5) score += hasRestDay(last7Days) ? 6 : -2;
  else if (activeDaysLast7 > 0) score += 6;

  if (currentStreak >= 3) score += 6;
  if (currentStreak >= 14 && !hasRestDay(last7Days)) score -= 5;

  if (focusSessions > 0 && breaks > 0) score += 10;
  if (focusSessions > 0 && breaks === 0) score -= 5;
  if (focus >= 70) score += 8;
  if (hasNote) score += 6;
  if (mood === "hard") score -= 6;
  if (mood === "max") score -= 10;
  if (heavyDaysInRow >= 3) score -= 18;

  const status: LearningBalance["status"] =
    todayMinutes >= 360 || heavyDaysInRow >= 3
      ? "overload"
      : (yesterday?.xp ?? 0) >= 240 && todayMinutes <= 60
        ? "recovery"
        : todayMinutes >= 240
          ? "intense"
          : todayMinutes === 0
            ? "rest"
            : "healthy";
  const meta = statusMeta(status);
  const tips = tipsForStatus({ status, todayMinutes, breaks, hasNote, focus });

  return {
    score: clampScore(score),
    status,
    title: meta.title,
    description: meta.description,
    tips,
    tone: meta.tone,
    message: meta.description,
  };
}
