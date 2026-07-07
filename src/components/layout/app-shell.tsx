import type React from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarNav />
      <div className="min-h-screen pb-24 lg:pl-64 lg:pb-0">
        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
