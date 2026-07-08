"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type RemoteState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string };

export function useRemoteData<T>(url: string): RemoteState<T> {
  const [state, setState] = useState<RemoteState<T>>({ status: "loading" });

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
    }, 25_000);

    async function load() {
      console.log(`[CodeFire] loading ${url}`);
      try {
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json().catch(() => ({}))) as T & { error?: string; configured?: boolean; message?: string };

        if (!mounted) return;
        if (payload.configured === false) {
          setState({ status: "error", message: payload.message ?? "CodeFire is not configured." });
          return;
        }
        if (!response.ok || payload.error) {
          setState({ status: "error", message: payload.error ?? payload.message ?? `Request failed: ${response.status}` });
          return;
        }

        console.log(`[CodeFire] loaded ${url}`);
        setState({ status: "ready", data: payload });
      } catch (error) {
        if (!mounted) return;
        console.error(`[CodeFire] ${url} error`, error);
        setState({
          status: "error",
          message: error instanceof DOMException && error.name === "AbortError"
            ? `Request timed out: ${url}`
            : error instanceof Error
              ? error.message
              : "Failed to load CodeFire data.",
        });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    load();

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [url]);

  return state;
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("glow-card min-w-0 rounded-lg p-4 sm:p-5", className)}>{children}</section>;
}

export function CardTitle({ icon: Icon, label }: { icon?: LucideIcon; label: string }) {
  return (
    <div className="mb-3 flex min-w-0 items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-orange-100">
      {Icon ? <Icon className="h-4 w-4 shrink-0 text-orange-300" /> : null}
      <span className="min-w-0 break-words">{label}</span>
    </div>
  );
}

export function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="break-words text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="mt-1 break-words text-xl font-black leading-tight text-white">{value}</div>
      {hint ? <div className="mt-1 break-words text-[11px] leading-4 text-zinc-500">{hint}</div> : null}
    </div>
  );
}

export function ProgressBar({
  percent,
  label,
  meta,
}: {
  percent: number;
  label: string;
  meta?: string;
}) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-zinc-400">
        <span className="min-w-0 break-words">{label}</span>
        {meta ? <span className="break-words text-orange-100">{meta}</span> : null}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full border border-emerald-300/15 bg-black/40">
        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-300" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3 text-sm font-black text-zinc-300">
        <Loader2 className="h-4 w-4 animate-spin text-orange-300" />
        {label}
      </div>
      <div className="mt-4 grid gap-2">
        <div className="h-3 w-2/3 rounded-full bg-white/10" />
        <div className="h-3 w-1/2 rounded-full bg-white/10" />
        <div className="h-3 w-5/6 rounded-full bg-white/10" />
      </div>
    </Card>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3 text-sm font-black text-orange-100">
        <AlertTriangle className="h-4 w-4 text-orange-300" />
        {message}
      </div>
    </Card>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-400">{children}</div>;
}

export function NavCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: Route;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group min-w-0 rounded-lg border border-white/10 bg-black/20 p-4 transition-colors hover:border-orange-300/35 hover:bg-orange-300/10"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
        <Icon className="h-4 w-4 shrink-0 text-orange-300" />
        <span className="min-w-0 break-words">{title}</span>
      </div>
      <p className="text-xs leading-5 text-zinc-400 group-hover:text-zinc-200">{description}</p>
    </Link>
  );
}
