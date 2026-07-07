"use client";

import { useEffect, useState } from "react";
import { Clock3, NotebookPen, Save } from "lucide-react";
import type { DailyNote, DailyNoteDifficulty, DailyNoteMood } from "@/lib/daily-notes.types";
import type { PomodoroStats } from "@/lib/pomodoro";
import { cn } from "@/lib/utils";

type NotesResponse = {
  note: DailyNote | null;
  notes: DailyNote[];
  error?: string;
};

type PomodoroResponse = {
  stats?: PomodoroStats | null;
};

type DaySummary = {
  codingXp: number;
  mainLanguage: string;
};

const emptyPomodoroSummary = {
  focusSessions: 0,
  focusMinutes: 0,
};

const moodOptions: Array<{
  mood: DailyNoteMood;
  label: string;
  className: string;
}> = [
  {
    mood: "easy",
    label: "Легко",
    className: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
  },
  {
    mood: "normal",
    label: "Нормально",
    className: "border-sky-300/30 bg-sky-300/10 text-sky-100",
  },
  {
    mood: "hard",
    label: "Тяжело",
    className: "border-orange-300/35 bg-orange-300/10 text-orange-100",
  },
  {
    mood: "max",
    label: "Максимум",
    className:
      "border-yellow-300/45 bg-gradient-to-r from-red-400/15 to-yellow-300/15 text-yellow-50 shadow-[0_0_18px_rgba(250,204,21,0.16)]",
  },
];

const difficultyOptions: Array<{
  difficulty: DailyNoteDifficulty;
  label: string;
  className: string;
}> = [
  {
    difficulty: "easy",
    label: "Легко",
    className: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
  },
  {
    difficulty: "normal",
    label: "Нормально",
    className: "border-sky-300/30 bg-sky-300/10 text-sky-100",
  },
  {
    difficulty: "hard",
    label: "Трудно",
    className: "border-orange-300/35 bg-orange-300/10 text-orange-100",
  },
  {
    difficulty: "veryHard",
    label: "Очень трудно",
    className: "border-red-300/40 bg-red-400/10 text-red-100",
  },
];

function createEmptyNote(date: string): DailyNote {
  return {
    date,
    mood: "normal",
    difficulty: "normal",
    beforeText: "",
    afterText: "",
    text: "",
    updatedAt: "",
  };
}

function moodClassName(mood: DailyNoteMood) {
  return moodOptions.find((option) => option.mood === mood)?.className ?? moodOptions[1].className;
}

function moodLabel(mood: DailyNoteMood) {
  return moodOptions.find((option) => option.mood === mood)?.label ?? "Нормально";
}

function difficultyClassName(difficulty?: DailyNoteDifficulty) {
  return difficultyOptions.find((option) => option.difficulty === difficulty)?.className ?? difficultyOptions[1].className;
}

function difficultyLabel(difficulty?: DailyNoteDifficulty) {
  return difficultyOptions.find((option) => option.difficulty === difficulty)?.label ?? "Нормально";
}

function formatUpdatedAt(value: string) {
  if (!value) {
    return "еще не сохранено";
  }

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotesPanel({
  date,
  summary,
}: {
  date: string;
  summary: DaySummary;
}) {
  const [note, setNote] = useState<DailyNote>(() => createEmptyNote(date));
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [pomodoroSummary, setPomodoroSummary] = useState(emptyPomodoroSummary);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let mounted = true;

    async function loadNotes() {
      try {
        const [notesResponse, pomodoroResponse] = await Promise.all([
          fetch(`/api/notes?date=${date}&limit=14`, { cache: "no-store" }),
          fetch("/api/pomodoro", { cache: "no-store" }),
        ]);
        const notesPayload = (await notesResponse.json()) as NotesResponse;
        const pomodoroPayload = (await pomodoroResponse.json()) as PomodoroResponse;

        if (!mounted) {
          return;
        }

        setNote(notesPayload.note ?? createEmptyNote(date));
        setNotes(notesPayload.notes ?? []);

        if (pomodoroPayload.stats) {
          setPomodoroSummary({
            focusSessions: pomodoroPayload.stats.todayCompletedFocusSessions,
            focusMinutes: pomodoroPayload.stats.todayFocusMinutes,
          });
        }
      } catch {
        if (mounted) {
          setStatus("error");
        }
      }
    }

    void loadNotes();

    return () => {
      mounted = false;
    };
  }, [date]);

  async function save() {
    setStatus("saving");

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      });

      if (!response.ok) {
        throw new Error("save failed");
      }

      if (note.difficulty) {
        await fetch("/api/difficulty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: note.date, difficulty: note.difficulty }),
        });
      }

      const payload = (await response.json()) as NotesResponse;
      setNote(payload.note ?? note);
      setNotes(payload.notes ?? []);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <article className="glow-card rounded-lg p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">
            <NotebookPen className="h-4 w-4" />
            Дневник прогресса
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">Заметка дня</h2>
        </div>
        <span className="text-xs font-semibold text-zinc-500">{date}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryTile label="Coding XP" value={`${summary.codingXp} XP`} />
            <SummaryTile
              label="Pomodoro focus"
              value={`${pomodoroSummary.focusSessions} / ${pomodoroSummary.focusMinutes} мин`}
            />
            <SummaryTile label="Главный язык" value={summary.mainLanguage} />
          </div>

          <SelectorGroup label="Настроение">
            {moodOptions.map((option) => (
              <button
                key={option.mood}
                type="button"
                onClick={() => setNote((current) => ({ ...current, mood: option.mood }))}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs font-bold transition",
                  note.mood === option.mood
                    ? option.className
                    : "border-white/10 bg-black/20 text-zinc-400 hover:border-emerald-300/25",
                )}
              >
                {option.label}
              </button>
            ))}
          </SelectorGroup>

          <SelectorGroup label="Трудность дня">
            {difficultyOptions.map((option) => (
              <button
                key={option.difficulty}
                type="button"
                onClick={() => setNote((current) => ({ ...current, difficulty: option.difficulty }))}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs font-bold transition",
                  note.difficulty === option.difficulty
                    ? option.className
                    : "border-white/10 bg-black/20 text-zinc-400 hover:border-emerald-300/25",
                )}
              >
                {option.label}
              </button>
            ))}
          </SelectorGroup>

          <div className="mt-4 grid gap-3">
            <JournalTextarea
              label="Перед практикой"
              value={note.beforeText ?? ""}
              placeholder="Что хочу сегодня понять или сделать?"
              onChange={(beforeText) => setNote((current) => ({ ...current, beforeText }))}
            />
            <JournalTextarea
              label="После практики"
              value={note.afterText ?? ""}
              placeholder="Что получилось, что стало понятнее, что осталось сложным?"
              onChange={(afterText) => setNote((current) => ({ ...current, afterText }))}
            />
            <JournalTextarea
              label="Дополнительно"
              value={note.text ?? ""}
              placeholder="Короткая заметка для совместимости со старым дневником."
              onChange={(text) => setNote((current) => ({ ...current, text }))}
              compact
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">
              {status === "saved"
                ? "Сохранено локально"
                : status === "error"
                  ? "Не удалось сохранить"
                  : "Одна заметка на дату, без дублей"}
            </span>
            <button
              type="button"
              onClick={save}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-orange-300/35 bg-orange-300/10 px-4 text-sm font-black text-orange-100 transition hover:bg-orange-300/15"
            >
              <Save className="h-4 w-4" />
              {status === "saving" ? "Сохраняю..." : "Сохранить"}
            </button>
          </div>
        </div>

        <NotesHistory notes={notes} />
      </div>
    </article>
  );
}

function SelectorGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function JournalTextarea({
  label,
  value,
  placeholder,
  onChange,
  compact,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/40",
          compact ? "min-h-20" : "min-h-28",
        )}
        placeholder={placeholder}
      />
    </label>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="break-words text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 break-words text-lg font-black leading-tight text-white">{value}</div>
    </div>
  );
}

function NotesHistory({ notes }: { notes: DailyNote[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
        <Clock3 className="h-4 w-4 text-emerald-300" />
        История заметок
      </div>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-zinc-400">
          История появится после первой сохраненной заметки. Это локальный дневник прогресса.
        </div>
      ) : (
        <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {notes.map((item) => (
            <div key={item.date} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-black text-white">{item.date}</div>
                <div className="flex flex-wrap gap-1.5">
                  <HistoryPill className={moodClassName(item.mood ?? "normal")}>{moodLabel(item.mood ?? "normal")}</HistoryPill>
                  <HistoryPill className={difficultyClassName(item.difficulty)}>
                    {difficultyLabel(item.difficulty)}
                  </HistoryPill>
                </div>
              </div>
              <HistoryBlock label="Цель дня" value={item.beforeText} />
              <HistoryBlock label="Итог дня" value={item.afterText} />
              <HistoryBlock label="Заметка" value={item.text} />
              <div className="mt-2 text-[11px] text-zinc-500">
                обновлено: {formatUpdatedAt(item.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryPill({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", className)}>
      {children}
    </span>
  );
}

function HistoryBlock({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">{value}</p>
    </div>
  );
}
