import { NextRequest, NextResponse } from "next/server";
import { deleteStudyTask, getStudyTasks, saveStudyTask } from "@/lib/study-tasks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ tasks: await getStudyTasks(500) });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const task = await saveStudyTask(payload);

  return NextResponse.json({ task, tasks: await getStudyTasks(500) });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";

  return NextResponse.json(await deleteStudyTask(id));
}
