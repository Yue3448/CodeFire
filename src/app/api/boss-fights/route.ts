import { NextRequest, NextResponse } from "next/server";
import { bossPresets, claimBossFightReward, createBossFromPreset, getStoredBossFights, saveCustomBoss } from "@/lib/boss-fights";
import { unlockInventoryItem } from "@/lib/inventory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ presets: bossPresets, bosses: await getStoredBossFights() });
}

export async function POST(request: NextRequest) {
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

    return NextResponse.json({ boss, bosses: await getStoredBossFights() });
  }

  const boss =
    payload.action === "createPreset"
      ? await createBossFromPreset(payload.presetId ?? bossPresets[0].id)
      : await saveCustomBoss(payload);

  return NextResponse.json({ boss, bosses: await getStoredBossFights() });
}
