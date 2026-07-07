import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("glow-card rounded-lg p-5 sm:p-6", className)}>
      {children}
    </article>
  );
}

export function SectionHeader({
  icon,
  eyebrow,
  title,
  action,
  className,
}: {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">
            {icon}
            <span className="min-w-0 break-words">{eyebrow}</span>
          </div>
        ) : null}
        <h2 className="mt-2 break-words text-2xl font-black leading-tight text-white">{title}</h2>
      </div>
      {action ? <div className="min-w-0">{action}</div> : null}
    </div>
  );
}

export function BadgePill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "orange" | "emerald" | "amber" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold leading-4",
        tone === "orange" && "border-orange-300/30 bg-orange-300/10 text-orange-100",
        tone === "emerald" && "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
        tone === "amber" && "border-yellow-300/30 bg-yellow-300/10 text-yellow-100",
        tone === "muted" && "border-white/10 bg-white/[0.04] text-zinc-400",
        tone === "neutral" && "border-white/10 bg-black/20 text-zinc-300",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-zinc-400", className)}>
      {children}
    </div>
  );
}

export function DashboardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("grid gap-5", className)}>{children}</section>;
}
