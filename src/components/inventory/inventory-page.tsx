"use client";

import { useMemo, useState } from "react";
import { Backpack, Boxes, ChevronDown, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, ProgressBar, useRemoteData } from "@/components/pages/page-kit";
import type { InventoryItem, InventoryState } from "@/lib/inventory";
import { cn } from "@/lib/utils";

type InventoryPayload = {
  inventory: InventoryState;
};

type EquipmentSlot = "artifact" | "amulet" | "ring" | "book" | "weapon" | "cloak" | "cosmetic";
type StatusFilter = "all" | "unlocked" | "locked" | "equipped";
type TypeFilter = "all" | EquipmentSlot | "badge" | "frame" | "theme";
type RarityFilter = "all" | InventoryItem["rarity"];
type InventorySort = "equippedFirst" | "unlockedFirst" | "rarityDesc" | "rarityAsc" | "type" | "name" | "closestToUnlock" | "newestUnlocked";

type InventoryFilters = {
  status: StatusFilter;
  type: TypeFilter;
  rarity: RarityFilter;
  search: string;
};

const equipmentSlots = [
  { slot: "artifact", label: "Artifact", hint: "No artifact equipped" },
  { slot: "amulet", label: "Amulet", hint: "No amulet equipped" },
  { slot: "ring", label: "Ring", hint: "No ring equipped" },
  { slot: "book", label: "Book", hint: "No book equipped" },
  { slot: "weapon", label: "Weapon", hint: "No weapon equipped" },
  { slot: "cloak", label: "Cloak", hint: "No cloak equipped" },
  { slot: "cosmetic", label: "Cosmetic", hint: "No cosmetic equipped" },
] satisfies Array<{ slot: EquipmentSlot; label: string; hint: string }>;

const rarityOptions = ["all", "common", "rare", "epic", "legendary", "mythic"] satisfies RarityFilter[];
const statusOptions = ["all", "unlocked", "locked", "equipped"] satisfies StatusFilter[];
const sortOptions = [
  ["equippedFirst", "Equipped first"],
  ["unlockedFirst", "Unlocked first"],
  ["closestToUnlock", "Closest unlock"],
  ["rarityDesc", "Rarity high"],
  ["rarityAsc", "Rarity low"],
  ["type", "Type"],
  ["name", "Name A-Z"],
  ["newestUnlocked", "Newest"],
] satisfies Array<[InventorySort, string]>;

const rarityScore: Record<InventoryItem["rarity"], number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

const rarityClasses: Record<InventoryItem["rarity"], string> = {
  common: "border-emerald-300/20 bg-emerald-300/10",
  rare: "border-sky-300/25 bg-sky-300/10",
  epic: "border-violet-300/30 bg-violet-300/10 shadow-violet-950/30",
  legendary: "border-amber-300/35 bg-amber-300/10 shadow-amber-950/35",
  mythic: "border-fuchsia-300/35 bg-fuchsia-300/10 shadow-fuchsia-950/40",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value));
}

function getSlotForItem(item: Pick<InventoryItem, "type">): EquipmentSlot | null {
  if (item.type === "artifact") return "artifact";
  if (item.type === "amulet") return "amulet";
  if (item.type === "ring") return "ring";
  if (item.type === "book") return "book";
  if (item.type === "weapon") return "weapon";
  if (item.type === "cloak") return "cloak";
  if (item.type === "cosmetic" || item.type === "frame" || item.type === "themeToken" || item.type === "crown") return "cosmetic";
  return null;
}

function canEquip(item: InventoryItem) {
  return item.unlocked && Boolean(getSlotForItem(item));
}

function effectLabel(item: Pick<InventoryItem, "effect" | "description">) {
  const effect = item.effect;
  if (!effect || effect.kind === "cosmeticOnly") return "Cosmetic only";
  if (effect.kind === "questAdventureXpBoost") return `+${effect.value ?? 0}% Adventure XP for daily quests`;
  if (effect.kind === "languageQuestBoost") return `+${effect.value ?? 0}% Adventure XP for ${effect.language ?? "language"} quests`;
  if (effect.kind === "pomodoroQuestBoost") return `+${effect.value ?? 0}% Pomodoro quest XP`;
  if (effect.kind === "recoveryBoost") return `+${effect.value ?? 0}% recovery quest XP`;
  if (effect.kind === "studyTaskBoost") return `+${effect.value ?? 0}% study quest XP`;
  return item.description;
}

function typeMatches(item: InventoryItem, type: TypeFilter) {
  if (type === "all") return true;
  if (type === "theme") return item.type === "themeToken";
  if (type === "cosmetic") return getSlotForItem(item) === "cosmetic";
  return item.type === type;
}

function unlockPercent(item: InventoryItem) {
  if (item.unlocked) return 100;
  if (!item.unlockTarget) return 0;
  return Math.min(100, ((item.unlockProgress ?? 0) / item.unlockTarget) * 100);
}

function filterItems(items: InventoryItem[], filters: InventoryFilters) {
  const search = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    const statusMatch =
      filters.status === "all" ||
      (filters.status === "unlocked" && item.unlocked) ||
      (filters.status === "locked" && !item.unlocked) ||
      (filters.status === "equipped" && Boolean(item.equipped));
    const rarityMatch = filters.rarity === "all" || item.rarity === filters.rarity;
    const searchable = [item.name, item.description, item.type, item.rarity, item.source, item.unlockLabel, effectLabel(item)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return statusMatch && rarityMatch && typeMatches(item, filters.type) && (!search || searchable.includes(search));
  });
}

function sortItems(items: InventoryItem[], sort: InventorySort) {
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

function totalBoost(inventory: InventoryState) {
  const languageBoost = Object.values(inventory.boosts.languageQuestBoosts).reduce((sum, value) => sum + value, 0);
  return inventory.boosts.questAdventureXpBoost + inventory.boosts.pomodoroQuestBoost + inventory.boosts.recoveryBoost + inventory.boosts.studyTaskBoost + languageBoost;
}

function activeEffects(inventory: InventoryState) {
  return inventory.items
    .filter((item) => item.unlocked && item.equipped && item.effect)
    .map((item) => ({ item, label: effectLabel(item) }));
}

function rarityClass(item: InventoryItem) {
  if (!item.unlocked) return "border-white/10 bg-black/20 opacity-70";
  return rarityClasses[item.rarity];
}

function mergeInventory(previous: InventoryState | null, next: InventoryState): InventoryState {
  if (!previous) return next;

  const previousById = new Map(previous.items.map((item) => [item.id, item]));
  const equippedIds = new Set(Object.values(next.equipped).filter(Boolean));

  return {
    ...next,
    items: next.items.map((item) => {
      const previousItem = previousById.get(item.id);

      return {
        ...previousItem,
        ...item,
        source: item.source ?? previousItem?.source,
        unlockLabel: previousItem?.unlockLabel ?? item.unlockLabel,
        unlockProgress: previousItem?.unlockProgress ?? item.unlockProgress,
        unlockTarget: previousItem?.unlockTarget ?? item.unlockTarget,
        equipped: equippedIds.has(item.id),
      };
    }),
  };
}

function SelectControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold normal-case tracking-normal text-zinc-200 outline-none transition-colors focus:border-orange-300/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-1 break-words text-xl font-black leading-tight text-white">{value}</div>
      {hint ? <div className="mt-1 text-[11px] font-bold leading-4 text-zinc-500">{hint}</div> : null}
    </div>
  );
}

function ItemIcon({ item }: { item: InventoryItem }) {
  return (
    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md border bg-black/35 text-xs font-black text-white", item.unlocked ? "border-white/10" : "border-white/5 text-zinc-500")}>
      {item.icon}
    </span>
  );
}

function StatusPill({ item }: { item: InventoryItem }) {
  return (
    <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", item.equipped ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : item.unlocked ? "border-sky-300/20 bg-sky-300/10 text-sky-100" : "border-white/10 bg-black/30 text-zinc-500")}>
      {item.equipped ? "equipped" : item.unlocked ? "unlocked" : "locked"}
    </span>
  );
}

function EquipmentSlotCard({
  slot,
  item,
  onSelect,
  onUnequip,
  busy,
}: {
  slot: (typeof equipmentSlots)[number];
  item: InventoryItem | null;
  onSelect: (item: InventoryItem) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  busy: boolean;
}) {
  if (!item) {
    return (
      <div className="min-w-0 rounded-lg border border-dashed border-white/10 bg-black/20 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-black/30 text-[10px] font-black text-zinc-600">--</span>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{slot.label}</div>
            <div className="mt-1 text-xs font-bold leading-4 text-zinc-500">{slot.hint}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 rounded-lg border p-3 shadow-lg", rarityClasses[item.rarity])}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <button type="button" onClick={() => onSelect(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <ItemIcon item={item} />
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{slot.label}</div>
            <div className="mt-1 break-words text-sm font-black leading-tight text-white">{item.name}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">{item.rarity}</div>
          </div>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onUnequip(slot.slot)}
          className="shrink-0 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-black text-zinc-300 transition-colors hover:border-orange-300/35 hover:text-orange-100 disabled:opacity-50"
        >
          {busy ? "..." : "Unequip"}
        </button>
      </div>
    </div>
  );
}

function BuildSummary({ inventory }: { inventory: InventoryState }) {
  const effects = activeEffects(inventory);
  const score = inventory.items
    .filter((item) => item.equipped)
    .reduce((sum, item) => sum + rarityScore[item.rarity], 0);
  const boost = totalBoost(inventory);

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-orange-100">
        <Zap className="h-3.5 w-3.5" />
        Current Build
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <SummaryCard label="Slots" value={`${inventory.stats.equipped}/${equipmentSlots.length}`} />
        <SummaryCard label="Active boost" value={boost > 0 ? `+${boost}%` : "0%"} hint="Coding XP unchanged" />
        <SummaryCard label="Rarity" value={`${score}`} hint="Equipped score" />
      </div>
      <div className="mt-3 grid gap-1.5">
        {effects.slice(0, 3).map(({ item, label }) => (
          <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-black/25 px-2 py-1.5 text-xs font-bold text-zinc-300">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-white/10 bg-black/30 text-[10px] text-white">{item.icon}</span>
            <span className="min-w-0 break-words">{label}</span>
          </div>
        ))}
        {effects.length === 0 ? <div className="rounded-md border border-white/10 bg-black/25 px-2 py-1.5 text-xs font-bold text-zinc-500">No active effects. Coding XP is unchanged.</div> : null}
        {effects.length > 3 ? <div className="text-[11px] font-bold text-zinc-500">+{effects.length - 3} more active effects</div> : null}
      </div>
    </div>
  );
}

function ItemCard({
  item,
  expanded,
  onToggle,
  onEquip,
  onUnequip,
  busy,
}: {
  item: InventoryItem;
  expanded: boolean;
  onToggle: (item: InventoryItem) => void;
  onEquip: (item: InventoryItem) => void;
  onUnequip: (item: InventoryItem) => void;
  busy: boolean;
}) {
  const slot = getSlotForItem(item);
  const percent = unlockPercent(item);

  return (
    <div className={cn("min-w-0 rounded-lg border p-3 shadow-lg transition-colors", rarityClass(item), expanded ? "ring-1 ring-orange-300/45" : "hover:border-orange-300/35")}>
      <button type="button" onClick={() => onToggle(item)} className="w-full text-left">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <ItemIcon item={item} />
            <div className="min-w-0">
              <div className="break-words text-sm font-black leading-tight text-white">{item.name}</div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                {item.type} / {item.rarity}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusPill item={item} />
            <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-500 transition-transform", expanded ? "rotate-180" : null)} />
          </div>
        </div>
      </button>

      <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">{effectLabel(item)}</p>

      {!item.unlocked && item.unlockTarget ? (
        <div className="mt-3">
          <ProgressBar percent={percent} label="Unlock" meta={item.unlockLabel ?? `${item.unlockProgress ?? 0} / ${item.unlockTarget}`} />
          <div className="mt-1 text-[11px] font-bold text-zinc-500">{formatNumber(Math.max(0, item.unlockTarget - (item.unlockProgress ?? 0)))} left</div>
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/25 p-3">
          <p className="text-xs leading-5 text-zinc-300">{item.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
              {slot ? `${slot} slot` : "not equipable"}
            </span>
            <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              {item.source ?? "CodeFire"}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.equipped ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onUnequip(item)}
            className="rounded-full border border-orange-300/25 bg-orange-300/10 px-3 py-1 text-[11px] font-black text-orange-100 transition-colors hover:border-orange-300/45 disabled:opacity-50"
          >
            {busy ? "Unequipping..." : "Unequip"}
          </button>
        ) : item.unlocked && canEquip(item) ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onEquip(item)}
            className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-black text-emerald-100 transition-colors hover:border-emerald-300/45 disabled:opacity-50"
          >
            {busy ? "Equipping..." : "Equip"}
          </button>
        ) : (
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-black text-zinc-500">
            {item.unlocked ? "View" : "Locked"}
          </span>
        )}
      </div>
    </div>
  );
}

export function InventoryPage() {
  const state = useRemoteData<InventoryPayload>("/api/inventory?progress=1");
  const [localInventory, setLocalInventory] = useState<InventoryState | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>({ status: "all", type: "all", rarity: "all", search: "" });
  const [sort, setSort] = useState<InventorySort>("equippedFirst");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const inventory = state.status === "ready" ? localInventory ?? state.data.inventory : null;
  const itemTypes = useMemo(() => {
    const present = new Set(inventory?.items.map((item) => (item.type === "themeToken" ? "theme" : item.type)) ?? []);
    const values: TypeFilter[] = ["all", "artifact", "amulet", "ring", "book", "weapon", "cloak", "cosmetic", "badge", "frame", "theme"];
    return values.map((value) => ({ value, label: value, disabled: value !== "all" && !present.has(value) && value !== "cosmetic" }));
  }, [inventory?.items]);
  const filteredItems = useMemo(
    () => (inventory ? sortItems(filterItems(inventory.items, filters), sort) : []),
    [filters, inventory, sort],
  );
  const visibleItems = filteredItems.slice(0, visibleLimit);

  async function equipInventoryItem(item: InventoryItem) {
    if (!item.unlocked) {
      setActionError("Locked items cannot be equipped.");
      return;
    }

    if (!canEquip(item)) {
      setActionError("This item cannot be equipped.");
      return;
    }

    setBusyKey(`equip:${item.id}`);
    setExpandedId(item.id);
    try {
      const response = await fetch("/api/inventory/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const payload = (await response.json().catch(() => ({}))) as InventoryPayload & { error?: string };

      if (!response.ok || payload.error || !payload.inventory) {
        setActionError(payload.error ?? "Failed to equip item.");
        return;
      }

      setActionError(null);
      setLocalInventory((current) => mergeInventory(current ?? inventory, payload.inventory));
    } finally {
      setBusyKey(null);
    }
  }

  async function unequipInventorySlot(slot: EquipmentSlot, itemId?: string) {
    setBusyKey(`unequip:${slot}`);
    if (itemId) setExpandedId(itemId);

    try {
      const response = await fetch("/api/inventory/unequip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot }),
      });
      const payload = (await response.json().catch(() => ({}))) as InventoryPayload & { error?: string };

      if (!response.ok || payload.error || !payload.inventory) {
        setActionError(payload.error ?? "Failed to unequip item.");
        return;
      }

      setActionError(null);
      setLocalInventory((current) => mergeInventory(current ?? inventory, payload.inventory));
    } finally {
      setBusyKey(null);
    }
  }

  function unequipInventoryItem(item: InventoryItem) {
    const slot = getSlotForItem(item);

    if (!slot) {
      setActionError("Invalid equipment slot.");
      return;
    }

    void unequipInventorySlot(slot, item.id);
  }

  if (state.status === "loading") return <LoadingState label="Loading inventory..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const readyInventory = localInventory ?? state.data.inventory;
  const boost = totalBoost(readyInventory);
  const equippedBySlot = new Map<EquipmentSlot, InventoryItem>();

  for (const slot of equipmentSlots) {
    const itemId = readyInventory.equipped[slot.slot];
    const item = itemId ? readyInventory.items.find((entry) => entry.id === itemId) : null;
    if (item) equippedBySlot.set(slot.slot, item);
  }

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Inventory" title="Items And Equipment" description="Compact RPG equipment, item filters, active Adventure XP effects, and unlock progress. Items never change Coding XP." />
      {actionError ? <ErrorState message={actionError} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Unlocked" value={`${readyInventory.stats.unlocked}/${readyInventory.stats.total}`} />
        <SummaryCard label="Equipped" value={`${readyInventory.stats.equipped}/${equipmentSlots.length}`} />
        <SummaryCard label="Locked" value={`${readyInventory.stats.locked}`} />
        <SummaryCard label="Active Boost" value={boost > 0 ? `+${boost}%` : "0%"} hint={boost > 0 ? "Adventure and quest XP only" : "Coding XP unchanged"} />
      </section>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle icon={ShieldCheck} label="Equipment Slots" />
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-zinc-400">Fast equip, slot-based unequip</span>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            {equipmentSlots.map((slot) => (
              <EquipmentSlotCard
                key={slot.slot}
                slot={slot}
                item={equippedBySlot.get(slot.slot) ?? null}
                onSelect={(item) => setExpandedId((current) => (current === item.id ? null : item.id))}
                onUnequip={(entrySlot) => void unequipInventorySlot(entrySlot, equippedBySlot.get(entrySlot)?.id)}
                busy={busyKey === `unequip:${slot.slot}`}
              />
            ))}
          </div>
          <BuildSummary inventory={readyInventory} />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle icon={Backpack} label="All Items" />
          <span className="text-xs font-bold text-zinc-500">
            {visibleItems.length} / {filteredItems.length} shown
          </span>
        </div>

        <div className="mb-4 grid gap-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={filters.search}
              onChange={(event) => {
                setVisibleLimit(24);
                setFilters((current) => ({ ...current, search: event.target.value }));
              }}
              placeholder="Search items..."
              className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm font-bold text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-300/40"
            />
          </label>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <SelectControl
              label="Status"
              value={filters.status}
              onChange={(value) => {
                setVisibleLimit(24);
                setFilters((current) => ({ ...current, status: value as StatusFilter }));
              }}
              options={statusOptions.map((value) => ({ value, label: value }))}
            />
            <SelectControl
              label="Type"
              value={filters.type}
              onChange={(value) => {
                setVisibleLimit(24);
                setFilters((current) => ({ ...current, type: value as TypeFilter }));
              }}
              options={itemTypes}
            />
            <SelectControl
              label="Rarity"
              value={filters.rarity}
              onChange={(value) => {
                setVisibleLimit(24);
                setFilters((current) => ({ ...current, rarity: value as RarityFilter }));
              }}
              options={rarityOptions.map((value) => ({ value, label: value }))}
            />
            <SelectControl
              label="Sort"
              value={sort}
              onChange={(value) => {
                setVisibleLimit(24);
                setSort(value as InventorySort);
              }}
              options={sortOptions.map(([value, label]) => ({ value, label }))}
            />
          </div>
        </div>

        {visibleItems.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={(entry) => setExpandedId((current) => (current === entry.id ? null : entry.id))}
                onEquip={(entry) => void equipInventoryItem(entry)}
                onUnequip={unequipInventoryItem}
                busy={busyKey === `equip:${item.id}` || busyKey === `unequip:${getSlotForItem(item) ?? ""}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState>No items match the current filters.</EmptyState>
        )}

        {filteredItems.length > visibleItems.length ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleLimit((current) => current + 24)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-black text-zinc-300 transition-colors hover:border-orange-300/35 hover:text-orange-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Show more
            </button>
          </div>
        ) : null}
      </Card>

      <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
        <Boxes className="h-3.5 w-3.5" />
        Inventory effects are limited to Adventure XP, quest rewards, Season XP, and cosmetics.
      </div>
    </div>
  );
}
