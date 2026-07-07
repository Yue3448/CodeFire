import { NextRequest, NextResponse } from "next/server";
import { deleteUserGoal, getUserGoals, saveUserGoal, toggleGoal } from "@/lib/custom-goals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ goals: await getUserGoals() });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = typeof payload.action === "string" ? payload.action : "";

  if (action === "toggle" && typeof payload.id === "string") {
    await toggleGoal(payload.id);
    return NextResponse.json({ goals: await getUserGoals() });
  }

  const goal = await saveUserGoal(payload);

  return NextResponse.json({ goal, goals: await getUserGoals() });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";

  return NextResponse.json(await deleteUserGoal(id));
}
