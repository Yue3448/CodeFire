"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  CheckCircle2,
  Coffee,
  Flame,
  History,
  Pause,
  Play,
  RotateCcw,
  Save,
  SkipForward,
  SlidersHorizontal,
  TimerReset,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { PomodoroSession, PomodoroStats } from "@/lib/pomodoro";
import {
  defaultPomodoroSettings,
  getPomodoroModeMinutes,
  pomodoroSettingRanges,
  sanitizePomodoroSettings,
  type PomodoroMode,
  type PomodoroSettings,
} from "@/lib/pomodoro-settings";
import { cn } from "@/lib/utils";

type PomodoroResponse = {
  settings?: PomodoroSettings | null;
  sessions?: PomodoroSession[];
  stats?: PomodoroStats | null;
  error?: string;
};

type TimerSnapshot = {
  mode: PomodoroMode;
  remainingSeconds: number;
  isRunning: boolean;
  targetEndAt: number | null;
  startedAt?: string;
  activeSessionId?: string;
  activePlannedMinutes?: number;
  cycleFocusCount: number;
};

type ModeMeta = {
  label: string;
  shortLabel: string;
  hint: string;
  icon: ReactNode;
  accent: string;
  ring: string;
};

const storageKey = "codefire:pomodoro:timer";
const modeOrder: PomodoroMode[] = ["focus", "shortBreak", "longBreak"];

const modeMeta: Record<PomodoroMode, ModeMeta> = {
  focus: {
    label: "Focus",
    shortLabel: "Фокус",
    hint: "Фокус-сессия",
    icon: <Flame className="h-4 w-4" />,
    accent: "text-orange-100",
    ring: "#fb923c",
  },
  shortBreak: {
    label: "Short Break",
    shortLabel: "Пауза",
    hint: "Короткий отдых",
    icon: <Coffee className="h-4 w-4" />,
    accent: "text-emerald-100",
    ring: "#6ee7b7",
  },
  longBreak: {
    label: "Long Break",
    shortLabel: "Длинная пауза",
    hint: "Длинный отдых",
    icon: <TimerReset className="h-4 w-4" />,
    accent: "text-sky-100",
    ring: "#38bdf8",
  },
};

const emptyStats: PomodoroStats = {
  todayFocusMinutes: 0,
  todayStartedFocusSessions: 0,
  todayCompletedFocusSessions: 0,
  todayStartedBreakSessions: 0,
  todayCompletedBreakSessions: 0,
  todayInterruptedSessions: 0,
  weekFocusMinutes: 0,
  weekCompletedFocusSessions: 0,
  last30DaysFocusMinutes: 0,
  last30DaysCompletedFocusSessions: 0,
  totalCompletedFocusSessions: 0,
  totalStartedFocusSessions: 0,
  totalCompletedSessions: 0,
  bestDay: null,
  currentPomodoroStreak: 0,
  averageFocusMinutes: 0,
  completionRate: 0,
};

function secondsForMode(mode: PomodoroMode, settings: PomodoroSettings) {
  return getPomodoroModeMinutes(mode, settings) * 60;
}

function formatTimer(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readSnapshot(): TimerSnapshot | null {
  try {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<TimerSnapshot>;

    if (!parsed.mode || !modeOrder.includes(parsed.mode)) {
      return null;
    }

    const maxSeconds = secondsForMode(parsed.mode, defaultPomodoroSettings);

    return {
      mode: parsed.mode,
      remainingSeconds:
        typeof parsed.remainingSeconds === "number"
          ? Math.max(0, Math.min(maxSeconds, Math.round(parsed.remainingSeconds)))
          : maxSeconds,
      isRunning: Boolean(parsed.isRunning),
      targetEndAt: typeof parsed.targetEndAt === "number" ? parsed.targetEndAt : null,
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : undefined,
      activeSessionId:
        typeof parsed.activeSessionId === "string" ? parsed.activeSessionId : undefined,
      activePlannedMinutes:
        typeof parsed.activePlannedMinutes === "number" ? parsed.activePlannedMinutes : undefined,
      cycleFocusCount:
        typeof parsed.cycleFocusCount === "number"
          ? Math.max(0, Math.round(parsed.cycleFocusCount))
          : 0,
    };
  } catch {
    return null;
  }
}

function playCompletionSound(enabled: boolean) {
  if (!enabled) {
    return;
  }

  try {
    const audioWindow = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextConstructor = window.AudioContext ?? audioWindow.webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
    window.setTimeout(() => void context.close(), 300);
  } catch {
    // Sound is a comfort feature; unsupported audio should never break the timer.
  }
}

function formatSessionTime(value?: string) {
  if (!value) {
    return "--:--";
  }

  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PomodoroPanel() {
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [settings, setSettings] = useState<PomodoroSettings>(defaultPomodoroSettings);
  const [settingsDraft, setSettingsDraft] = useState<PomodoroSettings>(defaultPomodoroSettings);
  const [remainingSeconds, setRemainingSeconds] = useState(
    secondsForMode("focus", defaultPomodoroSettings),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [targetEndAt, setTargetEndAt] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<string | undefined>();
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [activePlannedMinutes, setActivePlannedMinutes] = useState<number>(
    defaultPomodoroSettings.focusMinutes,
  );
  const [cycleFocusCount, setCycleFocusCount] = useState(0);
  const [stats, setStats] = useState<PomodoroStats>(emptyStats);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [statusMessage, setStatusMessage] = useState("Готов к фокусу");
  const [settingsStatus, setSettingsStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const finishingRef = useRef(false);

  const currentMeta = modeMeta[mode];
  const plannedMinutes = startedAt ? activePlannedMinutes : getPomodoroModeMinutes(mode, settings);
  const totalSeconds = plannedMinutes * 60;
  const progressPercent = totalSeconds ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const focusSessionNumber = stats.todayCompletedFocusSessions + (mode === "focus" ? 1 : 0);
  const timerBackground = useMemo(
    () =>
      `conic-gradient(${currentMeta.ring} ${progressPercent * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
    [currentMeta.ring, progressPercent],
  );

  const loadPomodoro = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const response = await fetch("/api/pomodoro", { cache: "no-store" });
      const payload = (await response.json()) as PomodoroResponse;

      const loadedSettings = payload.settings;
      const loadedStats = payload.stats;

      if (loadedSettings) {
        setSettings(loadedSettings);
        setSettingsDraft(loadedSettings);
        setRemainingSeconds((current) =>
          current === secondsForMode("focus", defaultPomodoroSettings)
            ? secondsForMode("focus", loadedSettings)
            : current,
        );
        setActivePlannedMinutes((current) =>
          current === defaultPomodoroSettings.focusMinutes ? loadedSettings.focusMinutes : current,
        );
      }

      if (loadedStats) {
        setStats(loadedStats);
        setCycleFocusCount((current) =>
          current === 0
            ? loadedStats.todayCompletedFocusSessions %
              (loadedSettings?.longBreakEvery ?? defaultPomodoroSettings.longBreakEvery)
            : current,
        );
      }

      if (payload.sessions) {
        setSessions(payload.sessions);
      }

      if (payload.error) {
        setStatusMessage(payload.error);
      }
    } catch {
      setStatusMessage("Pomodoro-статистика временно недоступна");
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      const snapshot = readSnapshot();

      if (snapshot) {
        const liveRemaining =
          snapshot.isRunning && snapshot.targetEndAt
            ? Math.max(0, Math.ceil((snapshot.targetEndAt - Date.now()) / 1000))
            : snapshot.remainingSeconds;

        setMode(snapshot.mode);
        setRemainingSeconds(liveRemaining);
        setIsRunning(snapshot.isRunning);
        setTargetEndAt(snapshot.targetEndAt);
        setStartedAt(snapshot.startedAt);
        setActiveSessionId(snapshot.activeSessionId);
        setActivePlannedMinutes(
          snapshot.activePlannedMinutes ?? getPomodoroModeMinutes(snapshot.mode, defaultPomodoroSettings),
        );
        setCycleFocusCount(snapshot.cycleFocusCount);
      }

      setIsHydrated(true);
      void loadPomodoro();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadPomodoro]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const snapshot: TimerSnapshot = {
      mode,
      remainingSeconds,
      isRunning,
      targetEndAt,
      startedAt,
      activeSessionId,
      activePlannedMinutes,
      cycleFocusCount,
    };

    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  }, [
    activePlannedMinutes,
    activeSessionId,
    cycleFocusCount,
    isHydrated,
    isRunning,
    mode,
    remainingSeconds,
    startedAt,
    targetEndAt,
  ]);

  useEffect(() => {
    if (!isRunning || !targetEndAt) {
      return;
    }

    const tick = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((targetEndAt - Date.now()) / 1000)));
    };
    const interval = window.setInterval(tick, 1000);

    tick();

    return () => window.clearInterval(interval);
  }, [isRunning, targetEndAt]);

  const persistSession = useCallback(async (session: PomodoroSession) => {
    const response = await fetch("/api/pomodoro/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    const payload = (await response.json()) as PomodoroResponse;

    if (!response.ok || payload.error) {
      throw new Error(payload.error ?? "save failed");
    }

    if (payload.stats) {
      setStats(payload.stats);
    }

    if (payload.sessions) {
      setSessions(payload.sessions);
    }
  }, []);

  const moveToPhase = useCallback(
    (
      nextMode: PomodoroMode,
      options: {
        autoStart: boolean;
        message: string;
        nextCycleFocusCount: number;
      },
    ) => {
      const nextPlannedMinutes = getPomodoroModeMinutes(nextMode, settings);
      const nextSeconds = nextPlannedMinutes * 60;
      const nextStartedAt = options.autoStart ? new Date().toISOString() : undefined;

      setMode(nextMode);
      setRemainingSeconds(nextSeconds);
      setActivePlannedMinutes(nextPlannedMinutes);
      setCycleFocusCount(options.nextCycleFocusCount);
      setStartedAt(nextStartedAt);
      setActiveSessionId(options.autoStart ? createSessionId() : undefined);
      setTargetEndAt(options.autoStart ? Date.now() + nextSeconds * 1000 : null);
      setIsRunning(options.autoStart);
      setStatusMessage(options.message);
    },
    [settings],
  );

  const finishPhase = useCallback(
    async (completed: boolean) => {
      if (finishingRef.current) {
        return;
      }

      finishingRef.current = true;
      const finishedMode = mode;
      const finishedPlannedMinutes = activePlannedMinutes;
      const finishedTotalSeconds = finishedPlannedMinutes * 60;
      const elapsedSeconds = Math.max(0, finishedTotalSeconds - remainingSeconds);
      const completedMinutes = completed
        ? finishedPlannedMinutes
        : Math.min(finishedPlannedMinutes, Math.floor(elapsedSeconds / 60));
      const endedAt = new Date();
      const shouldPersist = Boolean(startedAt) && (completed || completedMinutes > 0);
      const session: PomodoroSession | null = shouldPersist
        ? {
            id: activeSessionId ?? createSessionId(),
            date: getLocalDateKey(endedAt),
            mode: finishedMode,
            plannedMinutes: finishedPlannedMinutes,
            completedMinutes,
            completed,
            interrupted: !completed,
            startedAt:
              startedAt ??
              new Date(endedAt.getTime() - finishedPlannedMinutes * 60 * 1000).toISOString(),
            endedAt: endedAt.toISOString(),
          }
        : null;
      let nextCycleFocusCount = cycleFocusCount;

      if (completed && finishedMode === "focus") {
        nextCycleFocusCount += 1;
      }

      const nextMode: PomodoroMode =
        finishedMode === "focus"
          ? nextCycleFocusCount > 0 && nextCycleFocusCount % settings.longBreakEvery === 0
            ? "longBreak"
            : "shortBreak"
          : "focus";
      const autoStart =
        completed && (finishedMode === "focus" ? settings.autoStartBreaks : settings.autoStartFocus);
      const message = completed
        ? finishedMode === "focus"
          ? nextMode === "longBreak"
            ? "Фокус завершён. Время длинного отдыха"
            : "Фокус завершён. Можно сделать короткий отдых"
          : "Отдых завершён. Можно возвращаться в фокус"
        : "Фаза пропущена";

      playCompletionSound(completed && settings.soundEnabled);
      setIsRunning(false);
      setTargetEndAt(null);
      moveToPhase(nextMode, {
        autoStart,
        message,
        nextCycleFocusCount,
      });

      try {
        if (session) {
          await persistSession(session);
        }
      } catch {
        setStatusMessage("Фаза переключена, но история не сохранилась");
      } finally {
        finishingRef.current = false;
      }
    },
    [
      activePlannedMinutes,
      activeSessionId,
      cycleFocusCount,
      mode,
      moveToPhase,
      persistSession,
      remainingSeconds,
      settings,
      startedAt,
    ],
  );

  useEffect(() => {
    if (isRunning && remainingSeconds <= 0 && !finishingRef.current) {
      void finishPhase(true);
    }
  }, [finishPhase, isRunning, remainingSeconds]);

  function startTimer() {
    const nextSessionId = activeSessionId ?? createSessionId();
    const nextStartedAt = startedAt ?? new Date().toISOString();
    const nextRemainingSeconds = remainingSeconds > 0 ? remainingSeconds : totalSeconds;

    setActiveSessionId(nextSessionId);
    setStartedAt(nextStartedAt);
    setActivePlannedMinutes(plannedMinutes);
    setRemainingSeconds(nextRemainingSeconds);
    setTargetEndAt(Date.now() + nextRemainingSeconds * 1000);
    setIsRunning(true);
    setStatusMessage(mode === "focus" ? "Фокус идёт" : "Отдых идёт");
  }

  function pauseTimer() {
    setIsRunning(false);
    setTargetEndAt(null);
    setStatusMessage("Таймер на паузе");
  }

  function resetTimer() {
    const nextPlannedMinutes = getPomodoroModeMinutes(mode, settings);

    finishingRef.current = false;
    setIsRunning(false);
    setTargetEndAt(null);
    setStartedAt(undefined);
    setActiveSessionId(undefined);
    setActivePlannedMinutes(nextPlannedMinutes);
    setRemainingSeconds(nextPlannedMinutes * 60);
    setStatusMessage("Таймер сброшен без записи сессии");
  }

  function changeMode(nextMode: PomodoroMode) {
    const nextPlannedMinutes = getPomodoroModeMinutes(nextMode, settings);

    finishingRef.current = false;
    setMode(nextMode);
    setIsRunning(false);
    setTargetEndAt(null);
    setStartedAt(undefined);
    setActiveSessionId(undefined);
    setActivePlannedMinutes(nextPlannedMinutes);
    setRemainingSeconds(nextPlannedMinutes * 60);
    setStatusMessage(`${modeMeta[nextMode].hint}: готово`);
  }

  async function saveSettings(nextSettings = settingsDraft) {
    const sanitized = sanitizePomodoroSettings(nextSettings);

    setSettingsStatus("saving");

    try {
      const response = await fetch("/api/pomodoro/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: sanitized }),
      });
      const payload = (await response.json()) as PomodoroResponse;

      if (!response.ok || payload.error || !payload.settings) {
        throw new Error(payload.error ?? "settings save failed");
      }

      setSettings(payload.settings);
      setSettingsDraft(payload.settings);
      setSettingsStatus("saved");

      if (!isRunning && !startedAt) {
        const nextPlannedMinutes = getPomodoroModeMinutes(mode, payload.settings);
        setActivePlannedMinutes(nextPlannedMinutes);
        setRemainingSeconds(nextPlannedMinutes * 60);
      }
    } catch {
      setSettingsStatus("error");
    }
  }

  function updateDraftNumber(
    key: "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes" | "longBreakEvery",
    value: string,
  ) {
    setSettingsDraft((current) => ({
      ...current,
      [key]: value === "" ? 0 : Number(value),
    }));
    setSettingsStatus("idle");
  }

  function updateDraftBoolean(key: "autoStartBreaks" | "autoStartFocus" | "soundEnabled") {
    setSettingsDraft((current) => ({
      ...current,
      [key]: !current[key],
    }));
    setSettingsStatus("idle");
  }

  const primaryAction = isRunning ? pauseTimer : startTimer;
  const primaryLabel = isRunning ? "Pause" : remainingSeconds === totalSeconds ? "Start" : "Resume";

  return (
    <article className="glow-card overflow-hidden rounded-lg p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">
            <TimerReset className="h-4 w-4" />
            Pomodoro Focus
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">Фокус-модуль</h2>
        </div>
        <span className="max-w-full rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold leading-5 text-emerald-100">
          {statusMessage}
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <div className="grid grid-cols-3 gap-2">
            {modeOrder.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeMode(item)}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-black transition",
                  mode === item
                    ? "border-orange-300/50 bg-orange-300/15 text-orange-50 shadow-[0_0_18px_rgba(251,146,60,0.14)]"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-emerald-300/25 hover:text-emerald-100",
                )}
                title={modeMeta[item].hint}
              >
                {modeMeta[item].icon}
                <span className="hidden sm:inline">{modeMeta[item].shortLabel}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 grid place-items-center">
            <div
              className="grid h-64 w-64 max-w-full place-items-center rounded-full p-2 shadow-[0_0_34px_rgba(251,146,60,0.1)]"
              style={{ background: timerBackground }}
            >
              <div className="grid h-full w-full place-items-center rounded-full border border-white/10 bg-[#050807] text-center">
                <div>
                  <div className={cn("text-xs font-black uppercase tracking-[0.2em]", currentMeta.accent)}>
                    {currentMeta.label}
                  </div>
                  <div className="mt-2 text-6xl font-black leading-none text-white">
                    {formatTimer(remainingSeconds)}
                  </div>
                  <div className="mt-3 text-xs font-semibold text-zinc-500">
                    #{Math.max(1, focusSessionNumber)} · {plannedMinutes} мин · {currentMeta.hint}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-3">
            <button
              type="button"
              onClick={primaryAction}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-orange-300/40 bg-orange-400/15 px-4 text-sm font-black text-orange-50 shadow-[0_0_18px_rgba(251,146,60,0.16)] transition hover:bg-orange-400/20"
              title={primaryLabel}
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {primaryLabel}
            </button>
            <button
              type="button"
              onClick={() => void finishPhase(false)}
              className="inline-grid h-11 w-11 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100 transition hover:border-emerald-300/40"
              title="Skip"
              aria-label="Skip current Pomodoro phase"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetTimer}
              className="inline-grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:border-emerald-300/30 hover:text-emerald-100"
              title="Reset"
              aria-label="Reset Pomodoro timer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          <PomodoroSettingsCard
            settings={settingsDraft}
            status={settingsStatus}
            onNumberChange={updateDraftNumber}
            onToggle={updateDraftBoolean}
            onSave={() => void saveSettings()}
            onReset={() => void saveSettings(defaultPomodoroSettings)}
          />
          <PomodoroStatsCard stats={stats} isLoading={isStatsLoading} />
        </div>
      </div>

      <PomodoroHistory sessions={sessions.slice(0, 14)} />
    </article>
  );
}

function PomodoroSettingsCard({
  settings,
  status,
  onNumberChange,
  onToggle,
  onSave,
  onReset,
}: {
  settings: PomodoroSettings;
  status: "idle" | "saving" | "saved" | "error";
  onNumberChange: (
    key: "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes" | "longBreakEvery",
    value: string,
  ) => void;
  onToggle: (key: "autoStartBreaks" | "autoStartFocus" | "soundEnabled") => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
          <SlidersHorizontal className="h-4 w-4 text-orange-300" />
          Настройки Pomodoro
        </div>
        <span className="text-xs font-semibold text-zinc-500">
          {status === "saved"
            ? "сохранено"
            : status === "saving"
              ? "сохраняю..."
              : status === "error"
                ? "ошибка"
                : "локально"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SettingNumber
          label="Focus"
          value={settings.focusMinutes}
          min={pomodoroSettingRanges.focusMinutes.min}
          max={pomodoroSettingRanges.focusMinutes.max}
          onChange={(value) => onNumberChange("focusMinutes", value)}
        />
        <SettingNumber
          label="Short break"
          value={settings.shortBreakMinutes}
          min={pomodoroSettingRanges.shortBreakMinutes.min}
          max={pomodoroSettingRanges.shortBreakMinutes.max}
          onChange={(value) => onNumberChange("shortBreakMinutes", value)}
        />
        <SettingNumber
          label="Long break"
          value={settings.longBreakMinutes}
          min={pomodoroSettingRanges.longBreakMinutes.min}
          max={pomodoroSettingRanges.longBreakMinutes.max}
          onChange={(value) => onNumberChange("longBreakMinutes", value)}
        />
        <SettingNumber
          label="Long every"
          value={settings.longBreakEvery}
          min={pomodoroSettingRanges.longBreakEvery.min}
          max={pomodoroSettingRanges.longBreakEvery.max}
          onChange={(value) => onNumberChange("longBreakEvery", value)}
        />
      </div>

      <div className="mt-3 grid gap-2">
        <ToggleRow
          checked={settings.autoStartBreaks}
          label="Auto-start breaks"
          onToggle={() => onToggle("autoStartBreaks")}
        />
        <ToggleRow
          checked={settings.autoStartFocus}
          label="Auto-start focus"
          onToggle={() => onToggle("autoStartFocus")}
        />
        <ToggleRow
          checked={settings.soundEnabled}
          icon={settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          label="Sound"
          onToggle={() => onToggle("soundEnabled")}
        />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-orange-300/35 bg-orange-300/10 px-3 text-xs font-black text-orange-100 transition hover:bg-orange-300/15"
        >
          <Save className="h-4 w-4" />
          Сохранить
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:border-emerald-300/30 hover:text-emerald-100"
          title="Сбросить по умолчанию"
          aria-label="Reset Pomodoro settings to defaults"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SettingNumber({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm font-black text-white outline-none transition focus:border-emerald-300/40"
      />
      <span className="mt-1 block text-[10px] text-zinc-600">
        {min}-{max}
      </span>
    </label>
  );
}

function ToggleRow({
  checked,
  label,
  icon,
  onToggle,
}: {
  checked: boolean;
  label: string;
  icon?: ReactNode;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex min-h-9 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 text-left text-xs font-bold text-zinc-300 transition hover:border-emerald-300/25"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "h-5 w-9 rounded-full border p-0.5 transition",
          checked ? "border-emerald-300/50 bg-emerald-300/20" : "border-white/10 bg-zinc-900",
        )}
      >
        <span
          className={cn(
            "block h-3.5 w-3.5 rounded-full transition",
            checked ? "translate-x-4 bg-emerald-200" : "bg-zinc-500",
          )}
        />
      </span>
    </button>
  );
}

function PomodoroStatsCard({ stats, isLoading }: { stats: PomodoroStats; isLoading: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
          <BarChart3 className="h-4 w-4 text-emerald-300" />
          Pomodoro статистика
        </div>
        {isLoading ? (
          <span className="text-xs font-semibold text-zinc-500">sync...</span>
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PomodoroStat label="Focus сегодня" value={`${stats.todayFocusMinutes} мин`} />
        <PomodoroStat label="Сессий сегодня" value={`${stats.todayCompletedFocusSessions}`} />
        <PomodoroStat label="Focus за неделю" value={`${stats.weekFocusMinutes} мин`} />
        <PomodoroStat label="Focus за 30 дней" value={`${stats.last30DaysFocusMinutes} мин`} />
        <PomodoroStat label="Всего focus" value={`${stats.totalCompletedFocusSessions}`} />
        <PomodoroStat label="Completion rate" value={`${stats.completionRate}%`} />
        <PomodoroStat label="Серия focus-дней" value={`${stats.currentPomodoroStreak} дн.`} />
        <PomodoroStat
          label="Лучший день"
          value={stats.bestDay ? `${stats.bestDay.focusMinutes} мин` : "нет данных"}
          hint={stats.bestDay ? `${stats.bestDay.date} · ${stats.bestDay.completedSessions} сесс.` : undefined}
        />
      </div>

      <div className="mt-4 rounded-lg border border-emerald-300/15 bg-emerald-300/5 px-3 py-2 text-xs leading-5 text-zinc-400">
        Pomodoro показывает фокусный прогресс отдельно от WakaTime XP.
      </div>
    </div>
  );
}

function PomodoroStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="break-words text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 break-words text-xl font-black leading-tight text-white">{value}</div>
      {hint ? <div className="mt-1 break-words text-[11px] text-zinc-500">{hint}</div> : null}
    </div>
  );
}

function PomodoroHistory({ sessions }: { sessions: PomodoroSession[] }) {
  const groupedSessions = sessions.reduce<Array<{ date: string; items: PomodoroSession[] }>>(
    (groups, session) => {
      const existing = groups.find((group) => group.date === session.date);

      if (existing) {
        existing.items.push(session);
      } else {
        groups.push({ date: session.date, items: [session] });
      }

      return groups;
    },
    [],
  );

  return (
    <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
        <History className="h-4 w-4 text-orange-300" />
        История Pomodoro
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-400">
          История появится после завершённых или прерванных Pomodoro-сессий.
        </div>
      ) : (
        <div className="max-h-[460px] space-y-4 overflow-y-auto pr-1">
          {groupedSessions.map((group) => (
            <div key={group.date}>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                {group.date}
              </div>
              <div className="grid gap-2">
                {group.items.map((session) => (
                  <PomodoroHistoryItem key={session.id} session={session} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PomodoroHistoryItem({ session }: { session: PomodoroSession }) {
  const isFocus = session.mode === "focus";

  return (
    <div
      className={cn(
        "grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_auto]",
        isFocus
          ? "border-emerald-300/20 bg-emerald-300/5"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-white">{modeMeta[session.mode].hint}</span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]",
              session.completed
                ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                : "border-orange-300/35 bg-orange-300/10 text-orange-100",
            )}
          >
            {session.completed ? "завершено" : "прервано"}
          </span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {formatSessionTime(session.startedAt)} · {session.completedMinutes}/{session.plannedMinutes} мин
        </div>
      </div>
      <div className="text-left text-xs font-semibold text-zinc-400 sm:text-right">
        {session.endedAt ? formatSessionTime(session.endedAt) : "--:--"}
      </div>
    </div>
  );
}
