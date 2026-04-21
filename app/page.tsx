"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";

/**
 * Auth redirect hub.
 * Checks authentication + profile state and routes accordingly:
 *   - Not authenticated → /login
 *   - Auth but no profile → /role-select
 *   - Profile role=rwa, no onboardingComplete & no societyId → /onboarding
 *   - Profile role=admin/platform_admin → /dashboard
 *   - Profile role=rwa (onboarded) → /dashboard
 *   - Profile role=resident → /resident
 *   - Demo ?setup= param → pass through to dashboard
 */
export default function AuthRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const profile = useQuery(
    api.users.getMyProfile,
    isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    // Wait for auth check
    if (authLoading) return;

    // Not logged in → login
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Still loading profile
    if (profile === undefined) return;

    // Pass through ?setup= params for demo login
    const setup = searchParams.get("setup");
    if (setup) {
      const dest =
        setup === "resident"
          ? `/resident?setup=${setup}`
          : setup === "admin"
          ? `/admin?setup=${setup}`
          : `/dashboard?setup=${setup}`;
      router.replace(dest);
      return;
    }

    // No profile → role selection
    if (profile === null) {
      router.replace("/role-select");
      return;
    }

    // Route by role + onboarding state
    const role = profile.role;
    const onboardingComplete = (profile as any).onboardingComplete;
    const societyId = profile.societyId;

    if (role === "rwa" && !onboardingComplete && !societyId) {
      router.replace("/onboarding");
      return;
    }

    if (role === "admin" || role === "platform_admin") {
      router.replace("/admin");
      return;
    }

    if (role === "rwa") {
      router.replace("/dashboard");
      return;
    }

    if (role === "resident") {
      if (!onboardingComplete) {
        router.replace("/role-select");
        return;
      }
      router.replace("/resident");
      return;
    }

    // Fallback
    router.replace("/role-select");
  }, [profile, searchParams, router, isAuthenticated, authLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary animate-pulse">
          <span className="text-white font-bold text-xl">BS</span>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    </div>
  );
}
