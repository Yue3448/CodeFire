import "server-only";
import { getCodeFireData, getCodeFireOverviewData } from "@/lib/wakatime";
import { syncStoredTimeline } from "@/lib/learning-timeline.server";
import type { CodeFireData, CodeFireOverviewData } from "@/lib/types";

const OVERVIEW_CACHE_TTL_MS = 45_000;
const FULL_CACHE_TTL_MS = 90_000;

type CacheEntry<T> = {
  data: T | null;
  cachedAt: number;
  pending: Promise<T> | null;
};

const overviewCache: CacheEntry<CodeFireOverviewData> = {
  data: null,
  cachedAt: 0,
  pending: null,
};

const fullCache: CacheEntry<CodeFireData> = {
  data: null,
  cachedAt: 0,
  pending: null,
};

function isFresh<T>(entry: CacheEntry<T>) {
  return entry.data !== null;
}

async function getCached<T>(
  entry: CacheEntry<T>,
  ttlMs: number,
  forceRefresh: boolean,
  load: () => Promise<T>,
): Promise<{ data: T; cache: "HIT" | "MISS" | "REFRESH" }> {
  if (!forceRefresh && isFresh(entry) && entry.data && Date.now() - entry.cachedAt < ttlMs) {
    return { data: entry.data, cache: "HIT" };
  }

  entry.pending ??= load().then((data) => {
    entry.data = data;
    entry.cachedAt = Date.now();
    return data;
  }).finally(() => {
    entry.pending = null;
  });

  const data = await entry.pending;
  return { data, cache: forceRefresh ? "REFRESH" : "MISS" };
}

export async function getCachedOverviewData(apiKey: string, forceRefresh = false) {
  return getCached(overviewCache, OVERVIEW_CACHE_TTL_MS, forceRefresh, () => getCodeFireOverviewData(apiKey));
}

export async function getCachedFullCodeFireData(apiKey: string, forceRefresh = false) {
  return getCached(fullCache, FULL_CACHE_TTL_MS, forceRefresh, async () => {
    const data = await getCodeFireData(apiKey);

    if (data.rpg?.learning.timeline) {
      await syncStoredTimeline(data.rpg.learning.timeline);
    }

    return data;
  });
}

export function getStaleOverviewData() {
  return overviewCache.data;
}

export function getStaleFullCodeFireData() {
  return fullCache.data;
}
