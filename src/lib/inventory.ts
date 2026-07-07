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

export type InventorySlot = "artifact" | "amulet" | "ring" | "book" | "weapon" | "cloak" | "cosmetic";

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

export type InventoryFilters = {
  status: "all" | "unlocked" | "locked" | "equipped";
  type: "all" | InventorySlot | "badge" | "frame" | "theme";
  rarity: "all" | InventoryItem["rarity"];
  effect: "all" | "quest" | "pomodoro" | "language" | "recovery" | "cosmetic";
  search: string;
};

export type InventorySort =
  | "equippedFirst"
  | "unlockedFirst"
  | "rarityDesc"
  | "rarityAsc"
  | "type"
  | "name"
  | "closestToUnlock"
  | "newestUnlocked";

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

const equipableSlots = ["artifact", "amulet", "ring", "book", "weapon", "cloak", "cosmetic"] as const satisfies InventorySlot[];
const rarityScore: Record<InventoryItem["rarity"], number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

export function getSlotForItem(item: Pick<InventoryItem, "type">): InventorySlot | null {
  if (item.type === "artifact") return "artifact";
  if (item.type === "amulet") return "amulet";
  if (item.type === "ring") return "ring";
  if (item.type === "book") return "book";
  if (item.type === "weapon") return "weapon";
  if (item.type === "cloak") return "cloak";
  if (item.type === "cosmetic" || item.type === "frame" || item.type === "themeToken" || item.type === "crown") return "cosmetic";
  return null;
}

export function isInventorySlot(value: string): value is InventorySlot {
  return equipableSlots.includes(value as InventorySlot);
}

export function canEquipItem(item: Pick<InventoryItem, "type" | "unlocked">) {
  return item.unlocked && Boolean(getSlotForItem(item));
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

export function calculateActiveItemEffects(items: InventoryItem[]) {
  return items
    .filter((item) => item.unlocked && item.equipped && item.effect)
    .map((item) => ({
      itemId: item.id,
      itemName: item.name,
      effect: item.effect,
      label: effectLabel(item),
    }));
}

export function calculateTotalAdventureBoost(boosts: AdventureXpBoosts) {
  const languageBoost = Object.values(boosts.languageQuestBoosts).reduce((sum, value) => sum + value, 0);
  return boosts.questAdventureXpBoost + boosts.pomodoroQuestBoost + boosts.recoveryBoost + boosts.studyTaskBoost + languageBoost;
}

export function effectLabel(item: Pick<InventoryItem, "effect" | "description">) {
  const effect = item.effect;
  if (!effect || effect.kind === "cosmeticOnly") return "Cosmetic only";
  if (effect.kind === "questAdventureXpBoost") return `+${effect.value ?? 0}% Adventure XP for daily quests`;
  if (effect.kind === "languageQuestBoost") return `+${effect.value ?? 0}% Adventure XP for ${effect.language ?? "language"} quests`;
  if (effect.kind === "pomodoroQuestBoost") return `+${effect.value ?? 0}% Pomodoro quest XP`;
  if (effect.kind === "recoveryBoost") return `+${effect.value ?? 0}% recovery quest XP`;
  if (effect.kind === "studyTaskBoost") return `+${effect.value ?? 0}% study quest XP`;
  return item.description;
}

function effectMatches(item: InventoryItem, effect: InventoryFilters["effect"]) {
  if (effect === "all") return true;
  if (effect === "cosmetic") return !item.effect || item.effect.kind === "cosmeticOnly";
  if (effect === "quest") return item.effect?.kind === "questAdventureXpBoost" || item.effect?.kind === "studyTaskBoost";
  if (effect === "pomodoro") return item.effect?.kind === "pomodoroQuestBoost";
  if (effect === "language") return item.effect?.kind === "languageQuestBoost";
  if (effect === "recovery") return item.effect?.kind === "recoveryBoost";
  return true;
}

function typeMatches(item: InventoryItem, type: InventoryFilters["type"]) {
  if (type === "all") return true;
  if (type === "theme") return item.type === "themeToken";
  if (type === "cosmetic") return getSlotForItem(item) === "cosmetic";
  return item.type === type;
}

export function filterInventoryItems(items: InventoryItem[], filters: InventoryFilters) {
  const search = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    const statusMatch =
      filters.status === "all" ||
      (filters.status === "unlocked" && item.unlocked) ||
      (filters.status === "locked" && !item.unlocked) ||
      (filters.status === "equipped" && Boolean(item.equipped));
    const rarityMatch = filters.rarity === "all" || item.rarity === filters.rarity;
    const searchable = [
      item.name,
      item.description,
      item.type,
      item.rarity,
      item.source,
      item.unlockLabel,
      effectLabel(item),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return statusMatch && rarityMatch && typeMatches(item, filters.type) && effectMatches(item, filters.effect) && (!search || searchable.includes(search));
  });
}

function unlockPercent(item: InventoryItem) {
  if (item.unlocked) return 100;
  if (!item.unlockTarget) return 0;
  return Math.min(100, ((item.unlockProgress ?? 0) / item.unlockTarget) * 100);
}

export function sortInventoryItems(items: InventoryItem[], sort: InventorySort) {
  return [...items].sort((a, b) => {
    if (sort === "equippedFirst") return Number(b.equipped) - Number(a.equipped) || Number(b.unlocked) - Number(a.unlocked) || rarityScore[b.rarity] - rarityScore[a.rarity] || a.name.localeCompare(b.name);
    if (sort === "unlockedFirst") return Number(b.unlocked) - Number(a.unlocked) || Number(b.equipped) - Number(a.equipped) || rarityScore[b.rarity] - rarityScore[a.rarity] || a.name.localeCompare(b.name);
    if (sort === "rarityDesc") return rarityScore[b.rarity] - rarityScore[a.rarity] || a.name.localeCompare(b.name);
    if (sort === "rarityAsc") return rarityScore[a.rarity] - rarityScore[b.rarity] || a.name.localeCompare(b.name);
    if (sort === "type") return a.type.localeCompare(b.type) || rarityScore[b.rarity] - rarityScore[a.rarity] || a.name.localeCompare(b.name);
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "closestToUnlock") return Number(a.unlocked) - Number(b.unlocked) || unlockPercent(b) - unlockPercent(a) || a.name.localeCompare(b.name);
    if (sort === "newestUnlocked") return (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? "") || a.name.localeCompare(b.name);
    return 0;
  });
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
  const id = normalizeText(itemId, 80);
  const item = inventoryCatalog.find((entry) => entry.id === id);
  const slot = item ? getSlotForItem(item) : null;

  if (!item || !slot || !data.unlocked[item.id]) {
    return getInventory();
  }

  for (const key of equipableSlots) {
    if (data.equipped[key] === item.id) {
      delete data.equipped[key];
    }
  }

  data.equipped[slot] = item.id;
  await writeInventoryFile(data);

  return getInventory();
}

export async function unequipItem(itemId: string) {
  const data = await readInventoryFile();
  const id = normalizeText(itemId, 80);

  for (const key of equipableSlots) {
    if (data.equipped[key] === id) {
      delete data.equipped[key];
    }
  }

  await writeInventoryFile(data);

  return getInventory();
}

export async function unequipSlot(slot: InventorySlot) {
  const data = await readInventoryFile();

  delete data.equipped[slot];
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
