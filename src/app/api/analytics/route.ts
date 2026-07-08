import { getCachedFullCodeFireData } from "@/lib/codefire-cache.server";
import { jsonError, jsonResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.WAKATIME_API_KEY;

  if (!apiKey) {
    return jsonResponse({ configured: false, message: "WAKATIME_API_KEY not found." });
  }

  try {
    const { data, cache } = await getCachedFullCodeFireData(apiKey);

    return jsonResponse(
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
  } catch (error) {
    console.error("[analytics] GET error", error);
    return jsonError(error, "Failed to load analytics data.", {
      status: 502,
      extra: { configured: true },
    });
  }
}
