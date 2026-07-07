"use client";

import { ScrollText } from "lucide-react";
import { groupTimelineByMonth, type LearningTimelineEvent } from "@/lib/learning-timeline";
import { cn } from "@/lib/utils";

function rarityClass(rarity?: string) {
  if (rarity === "mythic" || rarity === "legendary") return "border-yellow-300/40 bg-yellow-300/10";
  if (rarity === "epic") return "border-purple-300/35 bg-purple-300/10";
  if (rarity === "rare") return "border-sky-300/35 bg-sky-300/10";
  return "border-white/10 bg-black/20";
}

export function LearningTimeline({ events, limit = 10, grouped = false }: { events: LearningTimelineEvent[]; limit?: number; grouped?: boolean }) {
  const visible = events.slice(0, limit);
  const groups = grouped ? groupTimelineByMonth(visible) : [];

  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-orange-100">
          <ScrollText className="h-4 w-4 text-orange-300" />
          Learning Timeline
        </div>
        <span className="text-xs font-bold text-zinc-500">{events.length} events</span>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
          Timeline is empty. Real achievements, notes, bosses, items, and Stepik entries will appear here.
        </div>
      ) : grouped ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.month}>
              <div className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{group.month}</div>
              <TimelineList events={group.events} />
            </div>
          ))}
        </div>
      ) : (
        <TimelineList events={visible} />
      )}
    </article>
  );
}

function TimelineList({ events }: { events: LearningTimelineEvent[] }) {
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={`${event.type}-${event.id}`} className={cn("rounded-lg border p-3", rarityClass(event.rarity))}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="break-words text-sm font-black text-white">{event.icon ? `${event.icon} ` : ""}{event.title}</div>
              {event.description ? <p className="mt-1 text-xs leading-5 text-zinc-400">{event.description}</p> : null}
            </div>
            <span className="shrink-0 text-xs font-bold text-zinc-500">{event.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
