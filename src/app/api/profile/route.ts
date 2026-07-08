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
    const learning = data.rpg?.learning ?? null;

    return jsonResponse(
      {
        configured: true,
        generatedAt: data.generatedAt,
        progression: data.progression,
        today: data.today,
        streak: data.rpg?.streak ?? null,
        achievements: data.rpg?.achievements ?? [],
        records: data.rpg?.records ?? null,
        languageLevels: data.rpg?.languageLevels ?? [],
        last365Days: data.last365Days,
        learning,
      },
      {
        headers: {
          "X-CodeFire-Cache": cache,
        },
      },
    );
  } catch (error) {
    console.error("[profile] GET error", error);
    return jsonError(error, "Failed to load profile data.", {
      status: 502,
      extra: { configured: true },
    });
  }
}
