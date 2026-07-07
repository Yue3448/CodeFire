export type PomodoroMode = "focus" | "shortBreak" | "longBreak";

export type PomodoroSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
};

export const defaultPomodoroSettings: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: false,
};

export const pomodoroSettingRanges = {
  focusMinutes: { min: 5, max: 180 },
  shortBreakMinutes: { min: 1, max: 60 },
  longBreakMinutes: { min: 5, max: 120 },
  longBreakEvery: { min: 2, max: 10 },
};

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

export function sanitizePomodoroSettings(input: Partial<PomodoroSettings> = {}): PomodoroSettings {
  return {
    focusMinutes: clampInteger(
      input.focusMinutes,
      pomodoroSettingRanges.focusMinutes.min,
      pomodoroSettingRanges.focusMinutes.max,
      defaultPomodoroSettings.focusMinutes,
    ),
    shortBreakMinutes: clampInteger(
      input.shortBreakMinutes,
      pomodoroSettingRanges.shortBreakMinutes.min,
      pomodoroSettingRanges.shortBreakMinutes.max,
      defaultPomodoroSettings.shortBreakMinutes,
    ),
    longBreakMinutes: clampInteger(
      input.longBreakMinutes,
      pomodoroSettingRanges.longBreakMinutes.min,
      pomodoroSettingRanges.longBreakMinutes.max,
      defaultPomodoroSettings.longBreakMinutes,
    ),
    longBreakEvery: clampInteger(
      input.longBreakEvery,
      pomodoroSettingRanges.longBreakEvery.min,
      pomodoroSettingRanges.longBreakEvery.max,
      defaultPomodoroSettings.longBreakEvery,
    ),
    autoStartBreaks: Boolean(input.autoStartBreaks),
    autoStartFocus: Boolean(input.autoStartFocus),
    soundEnabled: Boolean(input.soundEnabled),
  };
}

export function getPomodoroModeMinutes(mode: PomodoroMode, settings: PomodoroSettings) {
  if (mode === "shortBreak") {
    return settings.shortBreakMinutes;
  }

  if (mode === "longBreak") {
    return settings.longBreakMinutes;
  }

  return settings.focusMinutes;
}
