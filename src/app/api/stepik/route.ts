import { NextRequest, NextResponse } from "next/server";
import { deleteStepikEntry, getStepikEntries, saveStepikEntry } from "@/lib/stepik";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  console.log("[stepik] GET start");
  try {
    const entries = await getStepikEntries(500);
    console.log("[stepik] GET success");
    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Stepik entries.";
    console.error("[stepik] GET error", message);
    return NextResponse.json({ error: message, entries: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("[stepik] POST start");
  try {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const entry = await saveStepikEntry(payload);

    console.log("[stepik] POST success");
    return NextResponse.json({ entry, entries: await getStepikEntries(500) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save Stepik entry.";
    console.error("[stepik] POST error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  console.log("[stepik] DELETE start");
  try {
    const id = request.nextUrl.searchParams.get("id") ?? "";

    const result = await deleteStepikEntry(id);
    console.log("[stepik] DELETE success");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete Stepik entry.";
    console.error("[stepik] DELETE error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
