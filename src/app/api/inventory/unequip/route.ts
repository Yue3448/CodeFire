import { NextRequest, NextResponse } from "next/server";
import { getInventory, isInventorySlot, unequipSlot } from "@/lib/inventory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    slot?: string;
  };

  if (!payload.slot) {
    return NextResponse.json({ error: "slot is required." }, { status: 400 });
  }

  if (!isInventorySlot(payload.slot)) {
    return NextResponse.json({ error: "Invalid equipment slot." }, { status: 400 });
  }

  const inventory = await getInventory();

  if (!inventory.equipped[payload.slot]) {
    return NextResponse.json({ error: "Slot is already empty." }, { status: 409 });
  }

  return NextResponse.json({ inventory: await unequipSlot(payload.slot), slot: payload.slot });
}
