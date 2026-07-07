"use client";

import { useMemo, useState } from "react";
import { Backpack, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, ProgressBar, useRemoteData } from "@/components/pages/page-kit";
import type { InventoryState } from "@/lib/inventory";
import { cn } from "@/lib/utils";

type InventoryPayload = {
  inventory: InventoryState;
};

const rarities = ["all", "common", "rare", "epic", "legendary", "mythic"];
const states = ["all", "unlocked", "locked"];

function rarityClass(rarity: string, unlocked: boolean) {
  if (!unlocked) return "border-white/10 bg-black/20 opacity-65";
  if (rarity === "mythic") return "border-fuchsia-300/45 bg-fuchsia-300/10";
  if (rarity === "legendary") return "border-yellow-300/45 bg-yellow-300/10";
  if (rarity === "epic") return "border-fuchsia-300/35 bg-fuchsia-300/10";
  if (rarity === "rare") return "border-sky-300/35 bg-sky-300/10";
  return "border-emerald-300/25 bg-emerald-300/10";
}

export function InventoryPage() {
  const state = useRemoteData<InventoryPayload>("/api/inventory?progress=1");
  const [rarity, setRarity] = useState("all");
  const [itemState, setItemState] = useState("all");
  const [type, setType] = useState("all");
  const readyInventory = state.status === "ready" ? state.data.inventory : null;
  const filtered = useMemo(
    () =>
      (readyInventory?.items ?? []).filter((item) => {
        const rarityMatch = rarity === "all" || item.rarity === rarity;
        const typeMatch = type === "all" || item.type === type;
        const stateMatch =
          itemState === "all" || (itemState === "unlocked" ? item.unlocked : !item.unlocked);
        return rarityMatch && typeMatch && stateMatch;
      }),
    [itemState, rarity, readyInventory?.items, type],
  );

  if (state.status === "loading") return <LoadingState label="Loading inventory..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const inventory = state.data.inventory;
  const itemTypes = ["all", ...Array.from(new Set(inventory.items.map((item) => item.type)))];
  const equipped = inventory.items.filter((item) => item.equipped);

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Inventory" title="Items And Equipment" description="Unlocked items, locked-item progress, rarity filters, and effects. Items never change Coding XP." />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Unlocked" value={`${inventory.stats.unlocked}/${inventory.stats.total}`} />
        <Metric label="Equipped" value={`${inventory.stats.equipped}`} />
        <Metric label="Locked" value={`${inventory.stats.locked}`} />
        <Metric label="Quest boost" value={`${inventory.boosts.questAdventureXpBoost}%`} hint="Adventure XP only" />
      </section>

      <Card>
        <CardTitle icon={ShieldCheck} label="Equipped Slots" />
        {equipped.length ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {equipped.map((item) => (
              <div key={item.id} className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3">
                <div className="text-sm font-black text-white">{item.icon} {item.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{item.type} · {item.rarity}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No equipped items yet.</EmptyState>
        )}
      </Card>

      <Card>
        <CardTitle icon={Backpack} label="All Items" />
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-zinc-200">
            {itemTypes.map((itemType) => <option key={itemType} value={itemType}>{itemType}</option>)}
          </select>
          <select value={rarity} onChange={(event) => setRarity(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-zinc-200">
            {rarities.map((itemRarity) => <option key={itemRarity} value={itemRarity}>{itemRarity}</option>)}
          </select>
          <select value={itemState} onChange={(event) => setItemState(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-zinc-200">
            {states.map((stateFilter) => <option key={stateFilter} value={stateFilter}>{stateFilter}</option>)}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className={cn("rounded-lg border p-3", rarityClass(item.rarity, item.unlocked))}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words text-sm font-black text-white">{item.icon} {item.name}</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">{item.type} · {item.rarity}</div>
                </div>
                {item.equipped ? <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[10px] font-black text-emerald-100">equipped</span> : null}
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-400">{item.description}</p>
              {!item.unlocked && item.unlockTarget ? (
                <div className="mt-3">
                  <ProgressBar percent={((item.unlockProgress ?? 0) / item.unlockTarget) * 100} label="Unlock" meta={item.unlockLabel} />
                </div>
              ) : null}
              <div className="mt-2 text-[11px] font-bold text-zinc-500">{item.source}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
