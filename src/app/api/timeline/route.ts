import { NextRequest } from "next/server";
import { getCachedFullCodeFireData } from "@/lib/codefire-cache.server";
import { getStoredTimelineGroups, readStoredTimeline, syncStoredTimeline } from "@/lib/learning-timeline.server";
import { jsonError, jsonResponse } from "@/lib/api-response";
import type { TimelinePeriod } from "@/lib/learning-timeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const apiKey = process.env.WAKATIME_API_KEY;

  const limit = Math.min(200, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 25)));
  const refresh = ["1", "true", "yes"].includes(request.nextUrl.searchParams.get("refresh")?.toLowerCase() ?? "");
  const period = (request.nextUrl.searchParams.get("period") ?? "all") as TimelinePeriod;
  const grouped = request.nextUrl.searchParams.get("grouped") === "1";

  try {
    const stored = await readStoredTimeline(limit, period);

    if (!refresh && stored.length > 0) {
      return jsonResponse({
        configured: true,
        source: "stored",
        timeline: stored,
        groups: grouped ? await getStoredTimelineGroups(limit, period) : undefined,
      });
    }

    if (!apiKey) {
      return jsonResponse({
        configured: true,
        source: "stored",
        timeline: stored,
        groups: grouped ? await getStoredTimelineGroups(limit, period) : undefined,
        warning: "WAKATIME_API_KEY not found. Showing stored timeline only.",
      });
    }

    const { data, cache } = await getCachedFullCodeFireData(apiKey);
    const synced = await syncStoredTimeline(data.rpg?.learning.timeline ?? []);

    return jsonResponse(
      {
        configured: true,
        generatedAt: data.generatedAt,
        source: "calculated",
        timeline: synced.slice(0, limit),
        groups: grouped ? await getStoredTimelineGroups(limit, period) : undefined,
      },
      {
        headers: {
          "X-CodeFire-Cache": cache,
        },
      },
    );
  } catch (error) {
    console.error("[timeline] GET error", error);
    return jsonError(error, "Failed to load timeline.", {
      status: 502,
      extra: { configured: true, timeline: [] },
    });
  }
}
