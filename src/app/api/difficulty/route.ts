import { NextRequest } from "next/server";
import { jsonError, jsonResponse } from "@/lib/api-response";
import { getDailyDifficulties, saveDailyDifficulty } from "@/lib/difficulty";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return jsonResponse({ difficulties: await getDailyDifficulties() });
  } catch (error) {
    console.error("[difficulty] GET error", error);
    return jsonError(error, "Failed to load difficulties.", {
      status: 500,
      extra: { difficulties: {} },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const difficulty = await saveDailyDifficulty(payload);

    return jsonResponse({ difficulty, difficulties: await getDailyDifficulties() });
  } catch (error) {
    console.error("[difficulty] POST error", error);
    return jsonError(error, "Failed to save difficulty.", { status: 500 });
  }
}
