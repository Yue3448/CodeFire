"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-white/10 bg-black/30 px-4 py-5 backdrop-blur-xl lg:block">
      <Link href="/" className="mb-6 flex items-center gap-3 rounded-lg border border-orange-300/20 bg-orange-300/10 px-3 py-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-orange-300/30 bg-black/30 text-orange-200">
          <Flame className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-lg font-black leading-none text-white">
            Code<span className="text-orange-300">Fire</span>
          </span>
          <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100/70">
            RPG console
          </span>
        </span>
      </Link>

      <nav className="grid gap-1.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-black transition-colors",
                active
                  ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-50 shadow-[0_0_20px_rgba(89,255,145,0.10)]"
                  : "border-transparent text-zinc-500 hover:border-orange-300/20 hover:bg-orange-300/8 hover:text-orange-100",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-emerald-300" : "text-orange-300/70")} />
              <span className="min-w-0 break-words">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
