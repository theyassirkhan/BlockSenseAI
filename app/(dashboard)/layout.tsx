"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { AnimatedPage } from "@/components/ui/animated-page";
import { AmbientBg } from "@/components/ui/ambient-bg";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = useQuery(api.users.getMyProfile);

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <AmbientBg />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((p) => !p)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <Header societyId={profile?.societyId} onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5">
          <AnimatedPage>{children}</AnimatedPage>
        </main>
      </div>
    </div>
  );
}
