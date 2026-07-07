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
  const learning = data.rpg?.learning ?? null;

  return NextResponse.json(
    {
      configured: true,
      generatedAt: data.generatedAt,
      progression: data.progression,
      today: data.today,
      records: data.rpg?.records ?? null,
      languageLevels: data.rpg?.languageLevels ?? [],
      learning,
    },
    {
      headers: {
        "X-CodeFire-Cache": cache,
      },
    },
  );
}
