import { NextRequest, NextResponse } from "next/server";
import { deleteManualStudyEntry, getManualStudyEntries, saveManualStudyEntry } from "@/lib/manual-study";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  console.log("[manual-study] GET start");
  try {
    const entries = await getManualStudyEntries(500);
    console.log("[manual-study] GET success");
    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load manual study entries.";
    console.error("[manual-study] GET error", message);
    return NextResponse.json({ error: message, entries: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("[manual-study] POST start");
  try {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const entry = await saveManualStudyEntry(payload);

    console.log("[manual-study] POST success");
    return NextResponse.json({ entry, entries: await getManualStudyEntries(500) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save manual study entry.";
    console.error("[manual-study] POST error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  console.log("[manual-study] DELETE start");
  try {
    const id = request.nextUrl.searchParams.get("id") ?? "";

    const result = await deleteManualStudyEntry(id);
    console.log("[manual-study] DELETE success");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete manual study entry.";
    console.error("[manual-study] DELETE error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
