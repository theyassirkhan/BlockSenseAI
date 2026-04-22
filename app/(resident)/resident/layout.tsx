"use client";

import { useState } from "react";
import { ResidentSidebar } from "@/components/resident/sidebar";
import { ResidentHeader } from "@/components/resident/header";
import { AnimatedPage } from "@/components/ui/animated-page";
import { AmbientBg } from "@/components/ui/ambient-bg";

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <AmbientBg />
      <ResidentSidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <ResidentHeader />
        <main className="flex-1 overflow-y-auto p-5">
          <AnimatedPage>{children}</AnimatedPage>
        </main>
      </div>
    </div>
  );
}
