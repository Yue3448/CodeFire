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
        progression: data.progression,
        quests: data.rpg?.quests ?? [],
        weeklyQuests: data.rpg?.weeklyQuests ?? [],
        achievements: data.rpg?.achievements ?? [],
        todayRaid: data.rpg?.todayRaid ?? null,
        events: data.rpg?.events ?? [],
        learning: data.rpg?.learning ?? null,
      },
      {
        headers: {
          "X-CodeFire-Cache": cache,
        },
      },
    );
  } catch (error) {
    console.error("[rpg] GET error", error);
    return jsonError(error, "Failed to load RPG data.", {
      status: 502,
      extra: { configured: true },
    });
  }
}
