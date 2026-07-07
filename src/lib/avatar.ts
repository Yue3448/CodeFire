import type { InventoryState } from "@/lib/inventory";
import type { Rank } from "@/lib/ranks";

export type CodeFireAvatar = {
  level: number;
  rankId: string;
  stage: "spark" | "apprentice" | "coder" | "engineer" | "architect" | "legend";
  equippedItemIds: string[];
  backgroundThemeId?: string;
};

function stageFromRank(rank: Rank): CodeFireAvatar["stage"] {
  if (rank.minXp >= 30000) return "legend";
  if (rank.minXp >= 22000) return "architect";
  if (rank.minXp >= 7500) return "engineer";
  if (rank.minXp >= 1000) return "coder";
  if (rank.minXp >= 100) return "apprentice";
  return "spark";
}

export function getCodeFireAvatar({
  level,
  rank,
  inventory,
  backgroundThemeId,
}: {
  level: number;
  rank: Rank;
  inventory: InventoryState;
  backgroundThemeId?: string;
}): CodeFireAvatar {
  return {
    level,
    rankId: rank.id,
    stage: stageFromRank(rank),
    equippedItemIds: Object.values(inventory.equipped).filter(Boolean),
    backgroundThemeId,
  };
}
