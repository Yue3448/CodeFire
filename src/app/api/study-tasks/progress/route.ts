import { NextRequest, NextResponse } from "next/server";
import { addStudyTaskProgress, getStudyTasks } from "@/lib/study-tasks.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      taskId?: string;
      amount?: number;
    };

    if (!payload.taskId) {
      return NextResponse.json({ error: "taskId is required." }, { status: 400 });
    }

    const task = await addStudyTaskProgress(payload.taskId, payload.amount ?? 1);

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ task, tasks: await getStudyTasks(500) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update study task progress.";
    console.error("[study-tasks] progress POST error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
