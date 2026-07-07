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
  const learning = data.rpg?.learning;

  return NextResponse.json(
    {
      configured: true,
      generatedAt: data.generatedAt,
      todayDate: data.today.date,
      studyTasks: learning?.studyTasks ?? null,
      stepik: learning?.stepik ?? null,
      manualStudy: learning?.manualStudy ?? null,
      topics: learning?.topics ?? [],
      difficulties: learning?.difficulties ?? {},
      todayDifficulty: learning?.todayDifficulty ?? null,
      goals: learning?.goals ?? null,
      weeklyJournal: learning?.weeklyJournal ?? null,
    },
    {
      headers: {
        "X-CodeFire-Cache": cache,
      },
    },
  );
}
