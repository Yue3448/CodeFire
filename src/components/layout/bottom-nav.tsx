"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/75 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "grid min-h-14 place-items-center rounded-lg border px-1 py-1 text-[10px] font-black leading-tight transition-colors",
                active
                  ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-50"
                  : "border-transparent text-zinc-500 hover:border-orange-300/20 hover:text-orange-100",
              )}
            >
              <Icon className={cn("mb-1 h-4 w-4", active ? "text-emerald-300" : "text-orange-300/70")} />
              <span className="max-w-full break-words text-center">{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
