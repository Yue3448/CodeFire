import { NextRequest, NextResponse } from "next/server";
import { getDailyDifficulties, saveDailyDifficulty } from "@/lib/difficulty";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ difficulties: await getDailyDifficulties() });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const difficulty = await saveDailyDifficulty(payload);

  return NextResponse.json({ difficulty, difficulties: await getDailyDifficulties() });
}
