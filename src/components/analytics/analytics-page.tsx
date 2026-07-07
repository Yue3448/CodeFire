"use client";

import { Activity, BarChart3, Brain, Map, Trophy } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { YearlyHeatmap } from "@/components/heatmap/yearly-heatmap";
import { Card, CardTitle, EmptyState, ErrorState, LoadingState, Metric, useRemoteData } from "@/components/pages/page-kit";
import type { CodeFireData } from "@/lib/types";

type AnalyticsPayload = {
  last365Days: CodeFireData["last365Days"];
  languageLevels: NonNullable<CodeFireData["rpg"]>["languageLevels"];
  projectZones: NonNullable<CodeFireData["rpg"]>["projectZones"];
  records: NonNullable<CodeFireData["rpg"]>["records"] | null;
  weeklyReport: NonNullable<CodeFireData["rpg"]>["weeklyReport"] | null;
  weekComparison: NonNullable<CodeFireData["rpg"]>["weekComparison"] | null;
  focusDay: NonNullable<CodeFireData["rpg"]>["focusDay"] | null;
};

export function AnalyticsPage() {
  const state = useRemoteData<AnalyticsPayload>("/api/analytics");

  if (state.status === "loading") return <LoadingState label="Loading analytics..." />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const data = state.data;
  const chartData = data.last365Days.days.slice(-60).map((day) => ({
    ...day,
    hours: Number((day.totalSeconds / 3600).toFixed(2)),
  }));

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Analytics" title="Signals And Charts" description="Heatmap, rhythm, languages, projects, weekly report, and records." />

      <Card>
        <CardTitle icon={BarChart3} label="Yearly Heatmap" />
        <YearlyHeatmap days={data.last365Days.days} />
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardTitle icon={Activity} label="XP · Last 60 Days" />
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -18, right: 12, top: 14, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} minTickGap={18} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#0c1411", border: "1px solid rgba(89,255,145,0.24)", borderRadius: 8, color: "#f6fff7" }} />
                <Area type="monotone" dataKey="xp" stroke="#59ff91" strokeWidth={3} fill="rgba(89,255,145,0.18)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle icon={Activity} label="Battle Rhythm" />
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -18, right: 8, top: 14, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#0c1411", border: "1px solid rgba(255,138,42,0.28)", borderRadius: 8, color: "#f6fff7" }} />
                <Bar dataKey="hours" fill="#ff8a2a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardTitle icon={Brain} label="Focus" />
          {data.focusDay ? (
            <div className="grid gap-3">
              <Metric label="Focus" value={`${data.focusDay.percent}%`} hint={data.focusDay.language ?? "mixed"} />
              <p className="text-sm leading-6 text-zinc-400">{data.focusDay.description}</p>
            </div>
          ) : (
            <EmptyState>No focus data yet.</EmptyState>
          )}
        </Card>

        <Card>
          <CardTitle icon={Trophy} label="Weekly Report" />
          {data.weeklyReport ? (
            <div className="grid gap-2">
              <p className="text-sm leading-6 text-zinc-300">{data.weeklyReport.summary}</p>
              <div className="grid grid-cols-2 gap-2">
                <Metric label="XP" value={`${data.weeklyReport.totalXp}`} />
                <Metric label="Days" value={`${data.weeklyReport.activeDays}/7`} />
              </div>
            </div>
          ) : (
            <EmptyState>No weekly report yet.</EmptyState>
          )}
        </Card>

        <Card>
          <CardTitle icon={Map} label="Project Zones" />
          <div className="grid gap-2">
            {data.projectZones.slice(0, 6).map((zone) => (
              <Metric key={`${zone.zoneName}-${zone.name}`} label={zone.zoneName} value={zone.name} hint={`${zone.xp} XP`} />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle icon={BarChart3} label="Language Analytics" />
          <div className="grid gap-2 sm:grid-cols-2">
            {data.languageLevels.slice(0, 10).map((level) => (
              <Metric key={level.name} label={level.name} value={`Level ${level.level}`} hint={`${level.xp} XP`} />
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle icon={Trophy} label="Records" />
          {data.records ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.records.items.slice(0, 8).map((record) => (
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
