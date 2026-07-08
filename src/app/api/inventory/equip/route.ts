import { NextRequest } from "next/server";
import { jsonError, jsonResponse } from "@/lib/api-response";
import { equipItem, getInventory, getSlotForItem } from "@/lib/inventory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      itemId?: string;
    };

    if (!payload.itemId) {
      return jsonResponse({ error: "itemId is required." }, { status: 400 });
    }

    const inventory = await getInventory();
    const item = inventory.items.find((entry) => entry.id === payload.itemId);
    const slot = item ? getSlotForItem(item) : null;

    if (!item) {
      return jsonResponse({ error: "Item not found." }, { status: 404 });
    }

    if (!slot) {
      return jsonResponse({ error: "This item cannot be equipped." }, { status: 400 });
    }

    if (!item.unlocked) {
      return jsonResponse({ error: "Locked items cannot be equipped." }, { status: 409 });
    }

    return jsonResponse({ inventory: await equipItem(item.id), slot });
  } catch (error) {
    console.error("[inventory/equip] POST error", error);
    return jsonError(error, "Failed to equip item.", { status: 500 });
  }
}
