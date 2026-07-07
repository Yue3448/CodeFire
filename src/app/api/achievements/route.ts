import { NextRequest, NextResponse } from "next/server";
import { getCachedFullCodeFireData } from "@/lib/codefire-cache.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const apiKey = process.env.WAKATIME_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ configured: false, message: "WAKATIME_API_KEY not found." });
  }

  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 12)));
  const { data, cache } = await getCachedFullCodeFireData(apiKey);

  return NextResponse.json(
    {
      configured: true,
      generatedAt: data.generatedAt,
      achievements: data.rpg?.achievements.slice(0, limit) ?? [],
    },
    {
      headers: {
        "X-CodeFire-Cache": cache,
      },
    },
  );
}
