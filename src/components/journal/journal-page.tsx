"use client";

import { NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NotesPanel } from "@/components/notes-panel";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, useRemoteData } from "@/components/pages/page-kit";
import type { DailyNote } from "@/lib/daily-notes.types";
import type { CodeFireOverviewData } from "@/lib/types";

type NotesPayload = {
  note: DailyNote | null;
  notes: DailyNote[];
};

export function JournalPage() {
  const overview = useRemoteData<CodeFireOverviewData>("/api/overview");
  const notes = useRemoteData<NotesPayload>("/api/notes?limit=60");

  if (overview.status === "loading") return <LoadingState label="Loading journal context..." />;
  if (overview.status === "error") return <ErrorState message={overview.message} />;

  const summary = {
    codingXp: overview.data.today.xp,
    mainLanguage: overview.data.today.mainLanguage,
  };

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Journal" title="Daily Log" description="Today note, before/after reflection, mood, difficulty, and notes history." />

      <NotesPanel date={overview.data.today.date} summary={summary} />

      {notes.status === "loading" ? (
        <LoadingState label="Loading notes history..." />
      ) : notes.status === "error" ? (
        <ErrorState message={notes.message} />
      ) : (
        <Card>
          <CardTitle icon={NotebookPen} label="Notes History" />
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <Metric label="Notes" value={`${notes.data.notes.length}`} />
            <Metric label="With before" value={`${notes.data.notes.filter((note) => note.beforeText?.trim()).length}`} />
            <Metric label="With after" value={`${notes.data.notes.filter((note) => note.afterText?.trim()).length}`} />
          </div>
          {notes.data.notes.length ? (
            <div className="grid gap-2">
              {notes.data.notes.slice(0, 20).map((note) => (
                <div key={note.date} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words text-sm font-black text-white">{note.date}</div>
                      <div className="mt-1 text-xs text-zinc-500">{note.mood ?? "normal"} · {note.difficulty ?? "not marked"}</div>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-400">
                    {note.text || note.afterText || note.beforeText || "No text"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No journal entries yet.</EmptyState>
          )}
        </Card>
      )}
    </div>
  );
}
