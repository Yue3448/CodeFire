import "server-only";
import { readJsonStore, writeJsonStore } from "@/lib/local-json-store.server";
import {
  dedupeTimelineEvents,
  getTimelineEvents,
  groupTimelineByMonth,
  type LearningTimelineEvent,
  type TimelinePeriod,
} from "@/lib/learning-timeline";

type TimelineFile = {
  version: 1;
  events: LearningTimelineEvent[];
  updatedAt?: string;
};

const fileName = "codefire-timeline.json";

function sortEvents(events: LearningTimelineEvent[]) {
  return dedupeTimelineEvents(events);
}

export async function readStoredTimeline(limit = 25, period: TimelinePeriod = "all") {
  const data = await readJsonStore<TimelineFile>(fileName, { version: 1, events: [] });
  return getTimelineEvents(data.events, period).slice(0, limit);
}

export async function syncStoredTimeline(events: LearningTimelineEvent[]) {
  const existing = await readJsonStore<TimelineFile>(fileName, { version: 1, events: [] });
  const byId = new Map(existing.events.map((event) => [event.id, event]));

  for (const event of events) {
    byId.set(event.id, event);
  }

  const next: TimelineFile = {
    version: 1,
    events: sortEvents([...byId.values()]).slice(0, 500),
    updatedAt: new Date().toISOString(),
  };

  await writeJsonStore(fileName, next);
  return next.events;
}

export async function appendTimelineEvent(event: LearningTimelineEvent) {
  return syncStoredTimeline([event]);
}

export async function getStoredTimelineGroups(limit = 200, period: TimelinePeriod = "all") {
  const events = await readStoredTimeline(limit, period);
  return groupTimelineByMonth(events);
}
