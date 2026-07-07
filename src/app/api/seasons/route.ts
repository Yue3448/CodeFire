import { NextRequest, NextResponse } from "next/server";
import { completeSeason, createSeason, getActiveSeason, getSeasons, saveSeason, updateSeason } from "@/lib/seasons";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const activeOnly = request.nextUrl.searchParams.get("active") === "1";

  if (activeOnly) {
    return NextResponse.json({ season: await getActiveSeason() });
  }

  return NextResponse.json({ seasons: await getSeasons() });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    action?: "create" | "update" | "complete" | "save";
    id?: string;
  } & Parameters<typeof saveSeason>[0];

  if (payload.action === "complete" && payload.id) {
    const season = await completeSeason(payload.id);
    return NextResponse.json({ season, seasons: await getSeasons() });
  }

  if (payload.action === "create") {
    const season = await createSeason(payload);
    return NextResponse.json({ season, seasons: await getSeasons() });
  }

  if (payload.action === "update" && payload.id) {
    const season = await updateSeason({ ...payload, id: payload.id });
    return NextResponse.json({ season, seasons: await getSeasons() });
  }

  const season = await saveSeason(payload);
  return NextResponse.json({ season, seasons: await getSeasons() });
}
