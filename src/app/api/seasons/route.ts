import { NextRequest } from "next/server";
import { jsonError, jsonResponse } from "@/lib/api-response";
import { completeSeason, createSeason, getActiveSeason, getSeasons, saveSeason, updateSeason } from "@/lib/seasons";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const activeOnly = request.nextUrl.searchParams.get("active") === "1";

    if (activeOnly) {
      return jsonResponse({ season: await getActiveSeason() });
    }

    return jsonResponse({ seasons: await getSeasons() });
  } catch (error) {
    console.error("[seasons] GET error", error);
    return jsonError(error, "Failed to load seasons.", {
      status: 500,
      extra: { seasons: [] },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: "create" | "update" | "complete" | "save";
      id?: string;
    } & Parameters<typeof saveSeason>[0];

    if (payload.action === "complete" && payload.id) {
      const season = await completeSeason(payload.id);
      return jsonResponse({ season, seasons: await getSeasons() });
    }

    if (payload.action === "create") {
      const season = await createSeason(payload);
      return jsonResponse({ season, seasons: await getSeasons() });
    }

    if (payload.action === "update" && payload.id) {
      const season = await updateSeason({ ...payload, id: payload.id });
      return jsonResponse({ season, seasons: await getSeasons() });
    }

    const season = await saveSeason(payload);
    return jsonResponse({ season, seasons: await getSeasons() });
  } catch (error) {
    console.error("[seasons] POST error", error);
    return jsonError(error, "Failed to update seasons.", { status: 500 });
  }
}
