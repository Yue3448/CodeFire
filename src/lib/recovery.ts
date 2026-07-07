import type { DailyDifficulty } from "@/lib/difficulty";
import type { LightDay } from "@/lib/light-day";
import type { PomodoroStats } from "@/lib/pomodoro";
import type { DailyCodingActivity } from "@/lib/types";

export type RecoveryState = {
  active: boolean;
  status: "normal" | "intense" | "recoverySuggested" | "overloadRisk";
  title: string;
  description: string;
  tips: string[];
};

function hardDifficultyStreak(days: DailyCodingActivity[], difficulties: Record<string, DailyDifficulty>) {
  let streak = 0;

  for (const day of [...days].sort((a, b) => b.date.localeCompare(a.date))) {
    const difficulty = difficulties[day.date]?.difficulty;

    if (difficulty !== "hard" && difficulty !== "veryHard") {
      break;
    }

    streak += 1;
  }

  return streak;
}

function heavyCodingStreak(days: DailyCodingActivity[]) {
  let streak = 0;

  for (const day of [...days].sort((a, b) => b.date.localeCompare(a.date))) {
    if (day.xp < 240) break;
    streak += 1;
  }

  return streak;
}

export function getRecoveryState({
  days,
  today,
  difficulties,
  pomodoroStats,
  lightDay,
}: {
  days: DailyCodingActivity[];
  today: DailyCodingActivity;
  difficulties: Record<string, DailyDifficulty>;
  pomodoroStats?: PomodoroStats;
  lightDay?: LightDay;
}): RecoveryState {
  const yesterday = days.at(-2);
  const heavyStreak = heavyCodingStreak(days.slice(-5));
  const hardStreak = hardDifficultyStreak(days.slice(-5), difficulties);
  const focusWithoutBreaks =
    (pomodoroStats?.todayCompletedFocusSessions ?? 0) >= 3 &&
    (pomodoroStats?.todayCompletedBreakSessions ?? 0) === 0;

  if (today.xp >= 360 || heavyStreak >= 3 || hardStreak >= 3 || focusWithoutBreaks) {
    return {
      active: true,
      status: "overloadRisk",
      title: "Риск перегруза",
      description: "Система видит высокий темп. Лучше завершить день мягко и оставить ресурс на завтра.",
      tips: ["Закрой ближайшую маленькую точку.", "Добавь перерыв или заметку о состоянии.", "Light Day завтра будет честным режимом сохранения привычки."],
    };
  }

  if ((yesterday?.xp ?? 0) >= 240 || hardStreak >= 2) {
    return {
      active: true,
      status: "recoverySuggested",
      title: "Восстановление рекомендовано",
      description: "После сильного дня короткая практика помогает сохранить ритм без давления.",
      tips: ["15–30 минут достаточно.", "Можно включить лёгкий день.", "Заметка дня поможет заметить усталость раньше."],
    };
  }

  if (today.xp >= 240) {
    return {
      active: true,
      status: "intense",
      title: "Интенсивный режим",
      description: "Практики уже много. Сохраняй темп, но не забывай про отдых.",
      tips: ["Сделай break после следующего блока.", "Не добавляй цели только ради цифры.", "Завершение дня тоже навык."],
    };
  }

  if (lightDay?.enabled) {
    return {
      active: true,
      status: "recoverySuggested",
      title: "Лёгкий день активен",
      description: "Это не чит, а режим сохранения привычки в реальной жизни.",
      tips: [`Минимальная цель: ${lightDay.minimumGoalMinutes} мин.`, "Главная задача — мягко удержать ритм."],
    };
  }

  return {
    active: false,
    status: "normal",
    title: "Ритм в норме",
    description: "Признаков перегруза сейчас нет.",
    tips: ["Можно работать в обычном темпе."],
  };
}
