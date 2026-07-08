import { NextRequest } from "next/server";
import { getCachedFullCodeFireData } from "@/lib/codefire-cache.server";
import { jsonError, jsonResponse } from "@/lib/api-response";
import { equipItem, getInventory, isInventorySlot, unequipItem, unequipSlot, unlockItem } from "@/lib/inventory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const withProgress = request.nextUrl.searchParams.get("progress") === "1";
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
  const apiKey = process.env.WAKATIME_API_KEY;

  try {
    if (withProgress && apiKey) {
      const { data, cache } = await getCachedFullCodeFireData(apiKey, forceRefresh);

      return jsonResponse(
        { inventory: data.rpg?.learning.inventory ?? (await getInventory()) },
        {
          headers: {
            "X-CodeFire-Cache": cache,
          },
        },
      );
    }

    return jsonResponse({ inventory: await getInventory() });
  } catch (error) {
    console.error("[inventory] GET error", error);

    try {
      return jsonResponse(
        {
          inventory: await getInventory(),
          warning: error instanceof Error ? error.message : "Unlock progress is unavailable.",
        },
        { status: withProgress ? 200 : 500 },
      );
    } catch (fallbackError) {
      return jsonError(fallbackError, "Failed to load inventory.", { status: 500 });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: "unlock" | "equip" | "unequip";
      itemId?: string;
      slot?: string;
      source?: string;
    };

    if (!payload.itemId && !payload.slot) {
      return jsonResponse({ error: "itemId is required" }, { status: 400 });
    }

    let inventory;

    if (payload.action === "unlock") {
      if (!payload.itemId) return jsonResponse({ error: "itemId is required" }, { status: 400 });
      inventory = await unlockItem(payload.itemId, payload.source);
    } else if (payload.action === "unequip") {
      if (payload.slot) {
        if (!isInventorySlot(payload.slot)) {
          return jsonResponse({ error: "Invalid equipment slot." }, { status: 400 });
        }
        inventory = await unequipSlot(payload.slot);
      } else {
        if (!payload.itemId) return jsonResponse({ error: "itemId is required" }, { status: 400 });
        inventory = await unequipItem(payload.itemId);
      }
    } else if (payload.action === "equip") {
      if (!payload.itemId) return jsonResponse({ error: "itemId is required" }, { status: 400 });
      inventory = await equipItem(payload.itemId);
    } else {
      return jsonResponse({ error: "Unsupported inventory action." }, { status: 400 });
    }

    return jsonResponse({ inventory });
  } catch (error) {
    console.error("[inventory] POST error", error);
    return jsonError(error, "Failed to update inventory.", { status: 500 });
  }
}
