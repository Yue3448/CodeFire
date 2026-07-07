import { NextRequest, NextResponse } from "next/server";
import { getLightDay, saveLightDay } from "@/lib/light-day";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  return NextResponse.json({ lightDay: await getLightDay(date) });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const lightDay = await saveLightDay(payload);

  return NextResponse.json({ lightDay });
}
