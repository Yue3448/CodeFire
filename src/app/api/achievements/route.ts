import { NextRequest } from "next/server";
import { getCachedFullCodeFireData } from "@/lib/codefire-cache.server";
import { jsonError, jsonResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const apiKey = process.env.WAKATIME_API_KEY;

  if (!apiKey) {
    return jsonResponse({ configured: false, message: "WAKATIME_API_KEY not found." });
  }

  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 12)));
  try {
    const { data, cache } = await getCachedFullCodeFireData(apiKey);

    return jsonResponse(
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
  } catch (error) {
    console.error("[achievements] GET error", error);
    return jsonError(error, "Failed to load achievements.", {
      status: 502,
      extra: { configured: true, achievements: [] },
    });
  }
}
