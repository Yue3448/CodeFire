import { NextRequest, NextResponse } from "next/server";
import { deleteStudyTask, getStudyTasks, saveStudyTask, updateStudyTask } from "@/lib/study-tasks.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isModernTaskPayload(payload: Record<string, unknown>) {
  return Boolean(payload.type || payload.target || payload.unit || payload.period || payload.language || payload.description);
}

function validationError(payload: Record<string, unknown>) {
  if (!isModernTaskPayload(payload)) return null;

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const target = typeof payload.target === "number" ? payload.target : Number(payload.target);
  const topic = typeof payload.topic === "string" ? payload.topic : "";
  const customTopic = typeof payload.customTopic === "string" ? payload.customTopic.trim() : "";

  if (!title) return "Enter a task title.";
  if (!Number.isFinite(target) || target <= 0) return "Target must be greater than 0.";
  if (topic === "custom" && !customTopic) return "Enter a custom topic.";

  return null;
}

export async function GET() {
  console.log("[study-tasks] GET start");
  try {
    const tasks = await getStudyTasks(500);
    console.log("[study-tasks] GET success");
    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load study tasks.";
    console.error("[study-tasks] GET error", message);
    return NextResponse.json({ error: message, tasks: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("[study-tasks] POST start");
  try {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const error = validationError(payload);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const task = await saveStudyTask(payload);

    console.log("[study-tasks] POST success");
    return NextResponse.json({ task, tasks: await getStudyTasks(500) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create study task.";
    console.error("[study-tasks] POST error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  console.log("[study-tasks] PATCH start");
  try {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof payload.id === "string" ? payload.id : request.nextUrl.searchParams.get("id") ?? "";

    if (!id) {
      return NextResponse.json({ error: "Task id is required." }, { status: 400 });
    }

    const error = validationError(payload);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const task = await updateStudyTask(id, payload);

    console.log("[study-tasks] PATCH success");
    return NextResponse.json({ task, tasks: await getStudyTasks(500) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update study task.";
    console.error("[study-tasks] PATCH error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  console.log("[study-tasks] DELETE start");
  try {
    const id = request.nextUrl.searchParams.get("id") ?? "";

    if (!id) {
      return NextResponse.json({ error: "Task id is required." }, { status: 400 });
    }

    const result = await deleteStudyTask(id);

    console.log("[study-tasks] DELETE success");
    return NextResponse.json({ ...result, tasks: await getStudyTasks(500) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete study task.";
    console.error("[study-tasks] DELETE error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
