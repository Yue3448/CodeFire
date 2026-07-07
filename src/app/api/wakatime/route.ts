import { NextRequest, NextResponse } from "next/server";
import { getCachedFullCodeFireData, getStaleFullCodeFireData } from "@/lib/codefire-cache.server";
import type { CodeFireApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isForceRefresh(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("refresh") ?? request.nextUrl.searchParams.get("force");
  return ["1", "true", "yes"].includes(value?.toLowerCase() ?? "");
}

export async function GET(request: NextRequest) {
  const totalTimer = "[CodeFire] wakatime api total";
  console.time(totalTimer);
  const apiKey = process.env.WAKATIME_API_KEY;

  if (!apiKey) {
    console.timeEnd(totalTimer);
    return NextResponse.json<CodeFireApiResponse>({
      configured: false,
      message:
        "WAKATIME_API_KEY not found. Create .env.local from .env.example and restart the dev server.",
    });
  }

  try {
    const { data, cache } = await getCachedFullCodeFireData(apiKey, isForceRefresh(request));
    console.timeEnd(totalTimer);
    return NextResponse.json<CodeFireApiResponse>(data, {
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=0",
        "X-CodeFire-Cache": cache,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load WakaTime.";
    const stale = getStaleFullCodeFireData();

    if (stale) {
      console.warn(`[CodeFire] returning stale /api/wakatime cache: ${message}`);
      console.timeEnd(totalTimer);
      return NextResponse.json<CodeFireApiResponse>(stale, {
        headers: {
          "Cache-Control": "private, max-age=0, s-maxage=0",
          "X-CodeFire-Cache": "STALE",
          "X-CodeFire-Warning": message.slice(0, 180),
        },
      });
    }

    console.timeEnd(totalTimer);
    return NextResponse.json<CodeFireApiResponse>(
      {
        configured: true,
        error: message,
      },
      { status: 502 },
    );
  }
}
