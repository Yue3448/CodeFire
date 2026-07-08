import { NextRequest } from "next/server";
import { jsonError, jsonResponse } from "@/lib/api-response";
import { getInventory, isInventorySlot, unequipSlot } from "@/lib/inventory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      slot?: string;
    };

    if (!payload.slot) {
      return jsonResponse({ error: "slot is required." }, { status: 400 });
    }

    if (!isInventorySlot(payload.slot)) {
      return jsonResponse({ error: "Invalid equipment slot." }, { status: 400 });
    }

    const inventory = await getInventory();

    if (!inventory.equipped[payload.slot]) {
      return jsonResponse({ error: "Slot is already empty." }, { status: 409 });
    }

    return jsonResponse({ inventory: await unequipSlot(payload.slot), slot: payload.slot });
  } catch (error) {
    console.error("[inventory/unequip] POST error", error);
    return jsonError(error, "Failed to unequip item.", { status: 500 });
  }
}
