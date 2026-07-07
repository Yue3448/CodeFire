"use client";

import { useMemo, useState } from "react";
import { Route } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, useRemoteData } from "@/components/pages/page-kit";
import { LearningTimeline } from "@/components/timeline/learning-timeline";
import type { LearningTimelineEvent } from "@/lib/learning-timeline";

type TimelinePayload = {
  timeline: LearningTimelineEvent[];
  source?: string;
};

const filters = ["all", "rank", "achievement", "item", "boss", "season", "note", "stepik", "pomodoro"] as const;

export function TimelinePage() {
  const state = useRemoteData<TimelinePayload>("/api/timeline?limit=200&refresh=1");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const sourceEvents = useMemo(() => (state.status === "ready" ? state.data.timeline : []), [state]);
  const events = useMemo(
    () => (filter === "all" ? sourceEvents : sourceEvents.filter((event) => event.type === filter)),
    [filter, sourceEvents],
  );
  const counts = sourceEvents.reduce<Record<string, number>>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {});

  if (state.status === "loading") return <LoadingState label="Loading timeline..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Timeline" title="Learning Path" description="Rank events, achievement unlocks, item drops, boss victories, season milestones, notes, and Stepik milestones." />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Events" value={`${sourceEvents.length}`} />
        <Metric label="Achievements" value={`${counts.achievement ?? 0}`} />
        <Metric label="Items" value={`${counts.item ?? 0}`} />
        <Metric label="Bosses" value={`${counts.boss ?? 0}`} />
      </section>

      <Card>
        <CardTitle icon={Route} label="Filters" />
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={
                filter === item
                  ? "rounded-full border border-orange-300/45 bg-orange-300/15 px-3 py-1.5 text-xs font-black text-orange-100"
                  : "rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-black text-zinc-500 hover:text-zinc-200"
              }
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      {events.length ? (
        <LearningTimeline events={events} limit={200} grouped />
      ) : (
        <EmptyState>No timeline events for this filter.</EmptyState>
      )}
    </div>
  );
}
