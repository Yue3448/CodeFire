import { NextRequest, NextResponse } from "next/server";
import { equipItem, getInventory, getSlotForItem } from "@/lib/inventory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    itemId?: string;
  };

  if (!payload.itemId) {
    return NextResponse.json({ error: "itemId is required." }, { status: 400 });
  }

  const inventory = await getInventory();
  const item = inventory.items.find((entry) => entry.id === payload.itemId);
  const slot = item ? getSlotForItem(item) : null;

  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  if (!slot) {
    return NextResponse.json({ error: "This item cannot be equipped." }, { status: 400 });
  }

  if (!item.unlocked) {
    return NextResponse.json({ error: "Locked items cannot be equipped." }, { status: 409 });
  }

  return NextResponse.json({ inventory: await equipItem(item.id), slot });
}
