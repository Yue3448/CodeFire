"use client";

import { X } from "lucide-react";
import type React from "react";
import type { DayDetails } from "@/lib/day-details";
import { cn } from "@/lib/utils";

export function DayDetailsDrawer({
  details,
  onClose,
}: {
  details: DayDetails | null;
  onClose: () => void;
}) {
  if (!details) {
    return null;
  }

  const hasActivity =
    details.codingXp > 0 ||
    details.tasks.length > 0 ||
    details.stepikEntries.length > 0 ||
    details.manualStudyEntries.length > 0 ||
    Boolean(details.note) ||
    details.replay.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm">
      <button className="absolute inset-0 cursor-default" type="button" onClick={onClose} aria-label="Close" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-emerald-300/20 bg-zinc-950/95 p-5 shadow-[0_0_36px_rgba(89,255,145,0.18)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-200">Day Details</div>
            <h2 className="mt-2 text-3xl font-black text-white">{details.date}</h2>
            {details.title ? <p className="mt-1 text-sm font-bold text-emerald-100">{details.title}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-white"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!hasActivity ? (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-400">
            Нет активности за день.
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniDetail label="Coding XP" value={`${details.codingXp}`} />
          <MiniDetail label="Coding minutes" value={`${details.codingMinutes}`} />
          <MiniDetail label="Main language" value={details.mainLanguage ?? "нет"} />
          <MiniDetail label="Pomodoro" value={`${details.pomodoroSummary?.completedFocusSessions ?? 0}`} />
        </div>

        <DetailSection title="Languages">
          {details.languages.length === 0 ? (
            <EmptyLine>Нет WakaTime-языков за день.</EmptyLine>
          ) : (
            details.languages.slice(0, 8).map((language) => (
              <div key={language.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-white">{language.name}</span>
                <span className="text-zinc-400">{language.minutes} мин · {language.xp} XP</span>
              </div>
            ))
          )}
        </DetailSection>

        <DetailSection title="Study">
          {[...details.tasks, ...details.stepikEntries, ...details.manualStudyEntries].length === 0 ? (
            <EmptyLine>Учебных задач за день нет.</EmptyLine>
          ) : (
            <>
              {details.tasks.map((task) => (
                <StudyLine key={task.id} title={task.title || task.topic} meta={`${task.source} · ${task.status} · d${task.difficulty}`} />
              ))}
              {details.stepikEntries.map((entry) => (
                <StudyLine key={entry.id} title={`Stepik: ${entry.topic}`} meta={`${entry.tasksSolved} задач`} />
              ))}
              {details.manualStudyEntries.map((entry) => (
                <StudyLine key={entry.id} title={entry.topic || "Manual study"} meta={`${entry.minutes} мин · ${entry.type}`} />
              ))}
            </>
          )}
        </DetailSection>

        <DetailSection title="Note & Difficulty">
          <div className="grid gap-2 sm:grid-cols-2">
            <MiniDetail label="Difficulty" value={details.difficulty?.difficulty ?? details.note?.difficulty ?? "не отмечено"} />
            <MiniDetail label="Mood" value={details.note?.mood ?? "нет"} />
          </div>
          <NoteBlock label="Цель дня" value={details.note?.beforeText} />
          <NoteBlock label="Итог дня" value={details.note?.afterText} />
          <NoteBlock label="Заметка" value={details.note?.text} />
        </DetailSection>

        <DetailSection title="Rewards">
          <div className="grid grid-cols-2 gap-2">
            <MiniDetail label="Quests" value={`${details.questsCompleted}`} />
            <MiniDetail label="Achievements" value={`${details.achievementsUnlocked.length}`} />
            <MiniDetail label="Items" value={`${details.itemsUnlocked.length}`} />
            <MiniDetail label="Bosses" value={`${details.bossesCompleted.length}`} />
          </div>
          <RewardList title="Achievements" items={details.achievementsUnlocked} />
          <RewardList title="Items" items={details.itemsUnlocked} />
          <RewardList title="Bosses" items={details.bossesCompleted} />
        </DetailSection>

        <DetailSection title="Replay дня">
          {details.replay.length === 0 ? (
            <EmptyLine>Для этого дня пока нет событий replay.</EmptyLine>
          ) : (
            <div className="space-y-2">
              {details.replay.map((event) => (
                <div key={`${event.type}-${event.id}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-white">
                      {event.icon ? `${event.icon} · ` : ""}{event.title}
                    </span>
                    <span className="text-xs font-bold text-zinc-500">{event.time ?? event.type}</span>
                  </div>
                  {event.description ? <p className="mt-1 text-xs leading-5 text-zinc-400">{event.description}</p> : null}
                </div>
              ))}
            </div>
          )}
        </DetailSection>
      </aside>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-1 break-words text-lg font-black text-white">{value}</div>
    </div>
  );
}

function StudyLine({ title, meta }: { title: string; meta: string }) {
  return (
    <div className={cn("rounded-lg border border-white/10 bg-black/20 p-3")}>
      <div className="text-sm font-black text-white">{title}</div>
      <div className="mt-1 text-xs text-zinc-500">{meta}</div>
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{value}</p>
    </div>
  );
}

function RewardList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{title}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-orange-300/25 bg-orange-300/10 px-2 py-1 text-[11px] font-black text-orange-100">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-zinc-500">{children}</div>;
}
