import { NextRequest, NextResponse } from "next/server";
import { deleteStepikEntry, getStepikEntries, saveStepikEntry } from "@/lib/stepik";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const entries = await getStepikEntries(500);
    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Stepik entries.";
    console.error("[stepik] GET error", message);
    return NextResponse.json({ error: message, entries: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const entry = await saveStepikEntry(payload);

    return NextResponse.json({ entry, entries: await getStepikEntries(500) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save Stepik entry.";
    console.error("[stepik] POST error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id") ?? "";

    const result = await deleteStepikEntry(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete Stepik entry.";
    console.error("[stepik] DELETE error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
