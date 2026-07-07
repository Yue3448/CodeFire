"use client";

import { BookOpen, Flag, GraduationCap, ListChecks, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, ProgressBar, useRemoteData } from "@/components/pages/page-kit";
import type { LearningRpg } from "@/lib/learning-rpg";

type StudyPayload = {
  todayDate: string;
  studyTasks: LearningRpg["studyTasks"] | null;
  stepik: LearningRpg["stepik"] | null;
  manualStudy: LearningRpg["manualStudy"] | null;
  topics: LearningRpg["topics"];
  goals: LearningRpg["goals"] | null;
  weeklyJournal: LearningRpg["weeklyJournal"] | null;
};

export function StudyPage() {
  const state = useRemoteData<StudyPayload>("/api/study");

  if (state.status === "loading") return <LoadingState label="Loading study center..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const data = state.data;

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Study" title="Learning Center" description="Study tasks, Stepik, manual study, topic tracker, goals, and difficulty signals." />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tasks today" value={`${data.studyTasks?.stats.todayTasks ?? 0}`} />
        <Metric label="Stepik week" value={`${data.stepik?.stats.weekTasks ?? 0}`} />
        <Metric label="Manual week" value={`${data.manualStudy?.stats.weekMinutes ?? 0}m`} />
        <Metric label="Top topics" value={`${data.topics.length}`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardTitle icon={GraduationCap} label="Study Tasks" />
          {data.studyTasks?.items.length ? (
            <div className="grid gap-2">
              {data.studyTasks.items.slice(0, 10).map((task) => (
                <div key={task.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words text-sm font-black text-white">{task.title || task.topic}</div>
                      <div className="mt-1 text-xs text-zinc-500">{task.source} · {task.status} · difficulty {task.difficulty}</div>
                    </div>
                    <span className="text-xs font-bold text-zinc-500">{task.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No study tasks yet.</EmptyState>
          )}
        </Card>

        <Card>
          <CardTitle icon={BookOpen} label="Stepik" />
          {data.stepik?.entries.length ? (
            <div className="grid gap-2">
              {data.stepik.entries.slice(0, 8).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="break-words text-sm font-black text-white">{entry.topic}</div>
                  <div className="mt-1 text-xs text-zinc-500">{entry.tasksSolved} tasks · difficulty {entry.difficulty} · {entry.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No Stepik entries yet.</EmptyState>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle icon={Target} label="Topic Tracker" />
          <div className="grid gap-3">
            {data.topics.slice(0, 12).map((topic) => (
              <ProgressBar key={topic.id} percent={Math.min(100, (topic.xp % 240) / 2.4)} label={`${topic.name} · level ${topic.level}`} meta={`${topic.xp} XP`} />
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle icon={Flag} label="Goals" />
          {data.goals?.progress.length ? (
            <div className="grid gap-3">
              {data.goals.progress.slice(0, 8).map((goal) => (
                <ProgressBar key={goal.id} percent={goal.percent} label={goal.title} meta={`${goal.progress} / ${goal.target}`} />
              ))}
            </div>
          ) : (
            <EmptyState>No custom goals yet.</EmptyState>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle icon={ListChecks} label="Manual Study" />
          {data.manualStudy?.entries.length ? (
            <div className="grid gap-2">
              {data.manualStudy.entries.slice(0, 8).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="break-words text-sm font-black text-white">{entry.description || entry.topic || entry.type}</div>
                  <div className="mt-1 text-xs text-zinc-500">{entry.minutes}m · {entry.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No manual study entries yet.</EmptyState>
          )}
        </Card>

        <Card>
          <CardTitle icon={BookOpen} label="Weekly Journal" />
          {data.weeklyJournal ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Metric label="Coding XP" value={`${data.weeklyJournal.codingXp}`} />
              <Metric label="Solved tasks" value={`${data.weeklyJournal.solvedTasks}`} />
              <Metric label="Notes" value={`${data.weeklyJournal.notesCount}`} />
              <Metric label="Focus sessions" value={`${data.weeklyJournal.pomodoroSessions}`} />
            </div>
          ) : (
            <EmptyState>No weekly journal yet.</EmptyState>
          )}
        </Card>
      </section>
    </div>
  );
}
