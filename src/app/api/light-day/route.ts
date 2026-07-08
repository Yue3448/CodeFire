import { NextRequest } from "next/server";
import { jsonError, jsonResponse } from "@/lib/api-response";
import { getLightDay, saveLightDay } from "@/lib/light-day";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    return jsonResponse({ lightDay: await getLightDay(date) });
  } catch (error) {
    console.error("[light-day] GET error", error);
    return jsonError(error, "Failed to load light day.", {
      status: 500,
      extra: { lightDay: null },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const lightDay = await saveLightDay(payload);

    return jsonResponse({ lightDay });
  } catch (error) {
    console.error("[light-day] POST error", error);
    return jsonError(error, "Failed to save light day.", { status: 500 });
  }
}
