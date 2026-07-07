"use client";

import { Timer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PomodoroPanel } from "@/components/pomodoro-panel";
import { Card, CardTitle, ErrorState, LoadingState, Metric, useRemoteData } from "@/components/pages/page-kit";
import type { PomodoroData } from "@/lib/pomodoro";

export function FocusPage() {
  const state = useRemoteData<PomodoroData>("/api/pomodoro");

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Focus" title="Pomodoro Forge" description="Timer, settings, focus stats, and local Pomodoro history." />

      {state.status === "loading" ? (
        <LoadingState label="Loading Pomodoro stats..." />
      ) : state.status === "error" ? (
        <ErrorState message={state.message} />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Today focus" value={`${state.data.stats.todayFocusMinutes}m`} />
          <Metric label="Today sessions" value={`${state.data.stats.todayCompletedFocusSessions}`} />
          <Metric label="Week sessions" value={`${state.data.stats.weekCompletedFocusSessions}`} />
          <Metric label="Completion" value={`${state.data.stats.completionRate}%`} />
        </section>
      )}

      <PomodoroPanel />

      {state.status === "ready" ? (
        <Card>
          <CardTitle icon={Timer} label="Recent Focus History" />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {state.data.sessions.slice(0, 12).map((session) => (
              <div key={session.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-black text-white">{session.mode}</div>
                <div className="mt-1 text-xs text-zinc-500">{session.date} · {session.completedMinutes}/{session.plannedMinutes}m</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
