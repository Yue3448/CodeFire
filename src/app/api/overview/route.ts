import { NextRequest, NextResponse } from "next/server";
import { getCachedOverviewData, getStaleOverviewData } from "@/lib/codefire-cache.server";
import type { CodeFireOverviewApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isForceRefresh(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("refresh") ?? request.nextUrl.searchParams.get("force");
  return ["1", "true", "yes"].includes(value?.toLowerCase() ?? "");
}

export async function GET(request: NextRequest) {
  console.time("[CodeFire] overview api total");
  const apiKey = process.env.WAKATIME_API_KEY;

  if (!apiKey) {
    console.timeEnd("[CodeFire] overview api total");
    return NextResponse.json<CodeFireOverviewApiResponse>({
      configured: false,
      message:
        "WAKATIME_API_KEY not found. Create .env.local from .env.example and restart the dev server.",
    });
  }

  try {
    const { data, cache } = await getCachedOverviewData(apiKey, isForceRefresh(request));
    console.timeEnd("[CodeFire] overview api total");
    return NextResponse.json<CodeFireOverviewApiResponse>(data, {
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=0",
        "X-CodeFire-Cache": cache,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load CodeFire overview.";
    const stale = getStaleOverviewData();

    if (stale) {
      console.warn(`[CodeFire] returning stale /api/overview cache: ${message}`);
      console.timeEnd("[CodeFire] overview api total");
      return NextResponse.json<CodeFireOverviewApiResponse>(stale, {
        headers: {
          "Cache-Control": "private, max-age=0, s-maxage=0",
          "X-CodeFire-Cache": "STALE",
          "X-CodeFire-Warning": message.slice(0, 180),
        },
      });
    }

    console.timeEnd("[CodeFire] overview api total");
    return NextResponse.json<CodeFireOverviewApiResponse>(
      {
        configured: true,
        error: message,
      },
      { status: 502 },
    );
  }
}
