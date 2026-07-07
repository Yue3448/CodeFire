import { itemCatalog, type ItemEffect, type ItemRarity, type ItemType } from "@/content/items";
import { getConditionProgress, type ConditionProgressContext } from "@/lib/condition-progress";
import { normalizeText, readJsonStore, writeJsonStore } from "@/lib/local-json-store";

export type { ItemEffect } from "@/content/items";

export type InventoryItem = {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  source?: string;
  unlockLabel?: string;
  unlockProgress?: number;
  unlockTarget?: number;
  effect?: ItemEffect;
  equipped?: boolean;
};

export type InventorySlot = "amulet" | "ring" | "artifact";

export type InventoryStats = {
  total: number;
  unlocked: number;
  locked: number;
  equipped: number;
  byRarity: Record<InventoryItem["rarity"], number>;
};

export type AdventureXpBoosts = {
  questAdventureXpBoost: number;
  languageQuestBoosts: Record<string, number>;
  pomodoroQuestBoost: number;
  recoveryBoost: number;
  studyTaskBoost: number;
};

export type InventoryState = {
  items: InventoryItem[];
  equipped: Partial<Record<InventorySlot, string>>;
  unlockedCount: number;
  stats: InventoryStats;
  boosts: AdventureXpBoosts;
};

type InventoryFile = {
  version: 1;
  unlocked: Record<string, { unlockedAt: string; source?: string }>;
  equipped: InventoryState["equipped"];
};

const fileName = "codefire-inventory.json";
const rarities: InventoryItem["rarity"][] = ["common", "rare", "epic", "legendary", "mythic"];

export const inventoryCatalog: InventoryItem[] = itemCatalog.map((item) => ({
  ...item,
  unlocked: false,
  effect: item.effect,
}));

const emptyBoosts: AdventureXpBoosts = {
  questAdventureXpBoost: 0,
  languageQuestBoosts: {},
  pomodoroQuestBoost: 0,
  recoveryBoost: 0,
  studyTaskBoost: 0,
};

function slotForItem(item: InventoryItem): InventorySlot {
  if (item.type === "amulet") return "amulet";
  if (item.type === "ring") return "ring";
  return "artifact";
}

function calculateStats(items: InventoryItem[]): InventoryStats {
  return {
    total: items.length,
    unlocked: items.filter((item) => item.unlocked).length,
    locked: items.filter((item) => !item.unlocked).length,
    equipped: items.filter((item) => item.equipped).length,
    byRarity: Object.fromEntries(
      rarities.map((rarity) => [
        rarity,
        items.filter((item) => item.rarity === rarity && item.unlocked).length,
      ]),
    ) as InventoryStats["byRarity"],
  };
}

function calculateBoosts(items: InventoryItem[]): AdventureXpBoosts {
  return items
    .filter((item) => item.unlocked && item.equipped && item.effect)
    .reduce<AdventureXpBoosts>(
      (boosts, item) => {
        const effect = item.effect;
        if (!effect) return boosts;

        const value = effect.value ?? 0;
        if (effect.kind === "questAdventureXpBoost") boosts.questAdventureXpBoost += value;
        if (effect.kind === "pomodoroQuestBoost") boosts.pomodoroQuestBoost += value;
        if (effect.kind === "recoveryBoost") boosts.recoveryBoost += value;
        if (effect.kind === "studyTaskBoost") boosts.studyTaskBoost += value;
        if (effect.kind === "languageQuestBoost" && effect.language) {
          boosts.languageQuestBoosts[effect.language] =
            (boosts.languageQuestBoosts[effect.language] ?? 0) + value;
        }

        return boosts;
      },
      { ...emptyBoosts, languageQuestBoosts: {} },
    );
}

async function readInventoryFile(): Promise<InventoryFile> {
  const data = await readJsonStore<Partial<InventoryFile>>(fileName, {
    version: 1,
    unlocked: {},
    equipped: {},
  });

  return {
    version: 1,
    unlocked: data.unlocked ?? {},
    equipped: data.equipped ?? {},
  };
}

async function writeInventoryFile(data: InventoryFile) {
  await writeJsonStore<InventoryFile>(fileName, data);
}

function hydrateItems(data: InventoryFile, context?: ConditionProgressContext): InventoryItem[] {
  const equippedValues = Object.values(data.equipped);

  return itemCatalog.map((item) => {
    const unlocked = data.unlocked[item.id];
    const progress = context ? getConditionProgress(item.unlockCondition, context) : null;

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      icon: item.icon,
      unlocked: Boolean(unlocked),
      unlockedAt: unlocked?.unlockedAt,
      source: unlocked?.source ?? item.source,
      unlockLabel: progress?.label,
      unlockProgress: progress?.current,
      unlockTarget: progress?.target,
      effect: item.effect,
      equipped: equippedValues.includes(item.id),
    };
  });
}

export async function getInventory(context?: ConditionProgressContext): Promise<InventoryState> {
  const data = await readInventoryFile();
  const items = hydrateItems(data, context);

  return {
    items,
    equipped: data.equipped,
    unlockedCount: items.filter((item) => item.unlocked).length,
    stats: calculateStats(items),
    boosts: calculateBoosts(items),
  };
}

export async function syncInventoryUnlocks(context: ConditionProgressContext): Promise<InventoryState> {
  const data = await readInventoryFile();
  let changed = false;

  const currentItems = hydrateItems(data, context);
  const progressContext: ConditionProgressContext = {
    ...context,
    inventoryItems: currentItems,
  };

  for (const item of itemCatalog) {
    const progress = getConditionProgress(item.unlockCondition, progressContext);
    if (progress.completed && !data.unlocked[item.id]) {
      data.unlocked[item.id] = {
        unlockedAt: progress.unlockedAt ? `${progress.unlockedAt}T00:00:00.000Z` : new Date().toISOString(),
        source: item.source,
      };
      changed = true;
    }
  }

  if (changed) {
    await writeInventoryFile(data);
  }

  return getInventory(progressContext);
}

export async function unlockItem(itemId: string, source = "CodeFire") {
  const data = await readInventoryFile();
  const id = normalizeText(itemId, 80);

  if (!itemCatalog.some((item) => item.id === id)) {
    return getInventory();
  }

  data.unlocked[id] ??= { unlockedAt: new Date().toISOString(), source };
  await writeInventoryFile(data);

  return getInventory();
}

export async function equipItem(itemId: string) {
  const data = await readInventoryFile();
  const item = inventoryCatalog.find((entry) => entry.id === itemId);

  if (!item || !data.unlocked[item.id]) {
    return getInventory();
  }

  data.equipped[slotForItem(item)] = item.id;
  await writeInventoryFile(data);

  return getInventory();
}

export async function unequipItem(itemId: string) {
  const data = await readInventoryFile();

  if (data.equipped.amulet === itemId) delete data.equipped.amulet;
  if (data.equipped.ring === itemId) delete data.equipped.ring;
  if (data.equipped.artifact === itemId) delete data.equipped.artifact;

  await writeInventoryFile(data);

  return getInventory();
}

export async function getEquippedItems() {
  const inventory = await getInventory();

  return inventory.items.filter((item) => item.equipped);
}

export async function getInventoryStats() {
  const inventory = await getInventory();

  return inventory.stats;
}

export async function calculateAdventureXpBoosts() {
  const inventory = await getInventory();

  return inventory.boosts;
}

export const unlockInventoryItem = unlockItem;
export const equipInventoryItem = equipItem;
