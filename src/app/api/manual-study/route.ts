import { NextRequest, NextResponse } from "next/server";
import { deleteManualStudyEntry, getManualStudyEntries, saveManualStudyEntry } from "@/lib/manual-study";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ entries: await getManualStudyEntries(500) });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const entry = await saveManualStudyEntry(payload);

  return NextResponse.json({ entry, entries: await getManualStudyEntries(500) });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";

  return NextResponse.json(await deleteManualStudyEntry(id));
}
