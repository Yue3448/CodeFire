import { NextResponse } from "next/server";
import { getCachedFullCodeFireData } from "@/lib/codefire-cache.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.WAKATIME_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ configured: false, message: "WAKATIME_API_KEY not found." });
  }

  const { data, cache } = await getCachedFullCodeFireData(apiKey);

  return NextResponse.json(
    {
      configured: true,
      generatedAt: data.generatedAt,
      last365Days: data.last365Days,
      languageLevels: data.rpg?.languageLevels ?? [],
      projectZones: data.rpg?.projectZones ?? [],
      records: data.rpg?.records ?? null,
      weeklyReport: data.rpg?.weeklyReport ?? null,
      weekComparison: data.rpg?.weekComparison ?? null,
      focusDay: data.rpg?.focusDay ?? null,
      today: data.today,
    },
    {
      headers: {
        "X-CodeFire-Cache": cache,
      },
    },
  );
}
