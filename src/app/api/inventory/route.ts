import { NextRequest, NextResponse } from "next/server";
import { getCachedFullCodeFireData } from "@/lib/codefire-cache.server";
import { equipItem, getInventory, isInventorySlot, unequipItem, unequipSlot, unlockItem } from "@/lib/inventory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const withProgress = request.nextUrl.searchParams.get("progress") === "1";
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
  const apiKey = process.env.WAKATIME_API_KEY;

  if (withProgress && apiKey) {
    const { data, cache } = await getCachedFullCodeFireData(apiKey, forceRefresh);

    return NextResponse.json(
      { inventory: data.rpg?.learning.inventory ?? (await getInventory()) },
      {
        headers: {
          "X-CodeFire-Cache": cache,
        },
      },
    );
  }

  return NextResponse.json({ inventory: await getInventory() });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    action?: "unlock" | "equip" | "unequip";
    itemId?: string;
    slot?: string;
    source?: string;
  };

  if (!payload.itemId && !payload.slot) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  let inventory;

  if (payload.action === "unlock") {
    if (!payload.itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    inventory = await unlockItem(payload.itemId, payload.source);
  } else if (payload.action === "unequip") {
    if (payload.slot) {
      if (!isInventorySlot(payload.slot)) {
        return NextResponse.json({ error: "Invalid equipment slot." }, { status: 400 });
      }
      inventory = await unequipSlot(payload.slot);
    } else {
      if (!payload.itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });
      inventory = await unequipItem(payload.itemId);
    }
  } else if (payload.action === "equip") {
    if (!payload.itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    inventory = await equipItem(payload.itemId);
  } else {
    return NextResponse.json({ error: "Unsupported inventory action." }, { status: 400 });
  }

  return NextResponse.json({ inventory });
}
