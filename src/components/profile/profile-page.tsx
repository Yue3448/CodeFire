"use client";

import { Award, Backpack, Medal, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AvatarCard } from "@/components/profile/avatar-card";
import { DeveloperProfileCard } from "@/components/profile/developer-profile-card";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, useRemoteData } from "@/components/pages/page-kit";
import type { CodeFireData } from "@/lib/types";

type ProfilePayload = {
  learning: NonNullable<NonNullable<CodeFireData["rpg"]>["learning"]> | null;
  records: NonNullable<CodeFireData["rpg"]>["records"] | null;
  languageLevels: NonNullable<CodeFireData["rpg"]>["languageLevels"];
};

export function ProfilePage() {
  const state = useRemoteData<ProfilePayload>("/api/profile");

  if (state.status === "loading") return <LoadingState label="Loading profile..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const { learning, records, languageLevels } = state.data;

  if (!learning) {
    return <EmptyState>Profile data is not ready yet.</EmptyState>;
  }

  const equipped = learning.inventory.items.filter((item) => item.equipped);
  const unlockedPreview = learning.inventory.items.filter((item) => item.unlocked).slice(0, 6);

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Profile" title="Character Sheet" description="Rank, avatar, equipped items, strongest skills, and personal records." />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <DeveloperProfileCard learning={learning} />
        <AvatarCard learning={learning} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardTitle icon={Backpack} label="Equipped Items" />
          {equipped.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {equipped.map((item) => (
                <div key={item.id} className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3">
                  <div className="text-sm font-black text-white">{item.icon} {item.name}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{item.type} · {item.rarity}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No equipped items yet.</EmptyState>
          )}
        </Card>

        <Card>
          <CardTitle icon={Award} label="Unlocked Preview" />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {unlockedPreview.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-black text-white">{item.icon} {item.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{item.rarity}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle icon={Medal} label="Language Ranks" />
          <div className="grid gap-2 sm:grid-cols-2">
            {languageLevels.slice(0, 8).map((level) => (
              <Metric key={level.name} label={level.name} value={`Level ${level.level}`} hint={`${level.xp} XP`} />
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle icon={User} label="Records Preview" />
          {records ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {records.items.slice(0, 6).map((record) => (
                <Metric key={record.label} label={record.label} value={record.value} hint={record.date} />
              ))}
            </div>
          ) : (
            <EmptyState>No records yet.</EmptyState>
          )}
        </Card>
      </section>
    </div>
  );
}
