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
        records: data.rpg?.records ?? null,
      },
      {
        headers: {
          "X-CodeFire-Cache": cache,
        },
      },
    );
  } catch (error) {
    console.error("[records] GET error", error);
    return jsonError(error, "Failed to load records.", {
      status: 502,
      extra: { configured: true },
    });
  }
}
