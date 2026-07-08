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
    const learning = data.rpg?.learning;

    return jsonResponse(
      {
        configured: true,
        generatedAt: data.generatedAt,
        seasons: learning?.seasons ?? [],
        activeSeason: learning?.activeSeason ?? null,
        seasonDaysLeft: learning?.seasonDaysLeft ?? 0,
        seasonPass: learning?.seasonPass ?? null,
        themes: learning?.themes ?? null,
        xp: learning?.xp ?? null,
      },
      {
        headers: {
          "X-CodeFire-Cache": cache,
        },
      },
    );
  } catch (error) {
    console.error("[seasons/overview] GET error", error);
    return jsonError(error, "Failed to load seasons overview.", {
      status: 502,
      extra: { configured: true, seasons: [] },
    });
  }
}
