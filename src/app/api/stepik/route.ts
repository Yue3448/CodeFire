import { NextRequest, NextResponse } from "next/server";
import { deleteStepikEntry, getStepikEntries, saveStepikEntry } from "@/lib/stepik";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ entries: await getStepikEntries(500) });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const entry = await saveStepikEntry(payload);

  return NextResponse.json({ entry, entries: await getStepikEntries(500) });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";

  return NextResponse.json(await deleteStepikEntry(id));
}
