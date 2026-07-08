import { NextRequest } from "next/server";
import { jsonError, jsonResponse } from "@/lib/api-response";
import { bossPresets, claimBossFightReward, createBossFromPreset, getStoredBossFights, saveCustomBoss } from "@/lib/boss-fights";
import { unlockInventoryItem } from "@/lib/inventory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return jsonResponse({ presets: bossPresets, bosses: await getStoredBossFights() });
  } catch (error) {
    console.error("[boss-fights] GET error", error);
    return jsonError(error, "Failed to load boss fights.", {
      status: 500,
      extra: { presets: bossPresets, bosses: [] },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: "createPreset" | "createCustom" | "claim";
      presetId?: string;
      bossId?: string;
    } & Record<string, unknown>;

    if (payload.action === "claim" && payload.bossId) {
      const boss = await claimBossFightReward(payload.bossId);

      if (boss?.reward.itemId) {
        await unlockInventoryItem(boss.reward.itemId, `Boss: ${boss.title}`);
      }

      return jsonResponse({ boss, bosses: await getStoredBossFights() });
    }

    const boss =
      payload.action === "createPreset"
        ? await createBossFromPreset(payload.presetId ?? bossPresets[0].id)
        : await saveCustomBoss(payload);

    return jsonResponse({ boss, bosses: await getStoredBossFights() });
  } catch (error) {
    console.error("[boss-fights] POST error", error);
    return jsonError(error, "Failed to update boss fights.", { status: 500 });
  }
}
