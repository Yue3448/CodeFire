import { NextRequest } from "next/server";
import { jsonError, jsonResponse } from "@/lib/api-response";
import { deleteUserGoal, getUserGoals, saveUserGoal, toggleGoal } from "@/lib/custom-goals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return jsonResponse({ goals: await getUserGoals() });
  } catch (error) {
    console.error("[goals] GET error", error);
    return jsonError(error, "Failed to load goals.", {
      status: 500,
      extra: { goals: [] },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof payload.action === "string" ? payload.action : "";

    if (action === "toggle" && typeof payload.id === "string") {
      await toggleGoal(payload.id);
      return jsonResponse({ goals: await getUserGoals() });
    }

    const goal = await saveUserGoal(payload);

    return jsonResponse({ goal, goals: await getUserGoals() });
  } catch (error) {
    console.error("[goals] POST error", error);
    return jsonError(error, "Failed to update goals.", { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id") ?? "";

    return jsonResponse(await deleteUserGoal(id));
  } catch (error) {
    console.error("[goals] DELETE error", error);
    return jsonError(error, "Failed to delete goal.", { status: 500 });
  }
}
