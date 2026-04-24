"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useActiveBlock } from "@/hooks/use-active-block";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BellRing, CheckCircle2, AlertTriangle, Info, Sparkles, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES = {
  critical: { variant: "critical" as const, icon: <AlertTriangle className="h-3.5 w-3.5" />, bg: "bg-red-950/40 border-red-900/50" },
  warning: { variant: "warning" as const, icon: <AlertTriangle className="h-3.5 w-3.5" />, bg: "bg-amber-950/40 border-amber-900/50" },
  info: { variant: "info" as const, icon: <Info className="h-3.5 w-3.5" />, bg: "bg-blue-950/40 border-blue-900/50" },
};

const UTILITY_COLORS: Record<string, string> = {
  water: "#185FA5", power: "#854F0B", gas: "#0F6E56",
  sewage: "#993C1D", waste: "#993556", garbage: "#3B6D11", general: "#6b7280",
};

export default function AlertsPage() {
  const profile = useQuery(api.users.getMyProfile);
  const { blockId } = useActiveBlock(profile?.defaultBlockId);
  const societyId = profile?.societyId;

  const active = useQuery(api.alerts.getAllAlerts, societyId && blockId ? { societyId, blockId, includeResolved: false } : "skip");
  const all = useQuery(api.alerts.getAllAlerts, societyId && blockId ? { societyId, blockId, includeResolved: true } : "skip");
  const resolve = useMutation(api.alerts.resolveAlert);
  const explainExisting = useMutation(api.alerts.explainExistingAlerts);
  const [explaining, setExplaining] = useState(false);

  async function handleResolve(alertId: string) {
    try {
      await resolve({ alertId: alertId as any });
      toast.success("Alert resolved");
    } catch {
      toast.error("Failed to resolve");
    }
  }

  async function handleExplainAll() {
    if (!societyId || !blockId) return;
    setExplaining(true);
    try {
      const r = await explainExisting({ societyId, blockId });
      toast.success(`AI explanations queued for ${(r as any).scheduled} alerts`);
    } catch {
      toast.error("Failed to queue explanations");
    } finally {
      setExplaining(false);
    }
  }

  const criticalCount = active?.filter(a => a.severity === "critical").length ?? 0;
  const withoutExplanation = active?.filter(a => !a.aiExplanation).length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Alert Centre
          {criticalCount > 0 && <Badge variant="critical">{criticalCount} critical</Badge>}
        </h1>
        {withoutExplanation > 0 && (
          <Button size="sm" variant="outline" onClick={handleExplainAll} disabled={explaining} className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            {explaining ? "Generating…" : `AI explain ${withoutExplanation} alerts`}
          </Button>
        )}
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({active?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="all">All alerts ({all?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <AlertList alerts={active ?? []} onResolve={handleResolve} showResolve />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <AlertList alerts={all ?? []} onResolve={handleResolve} showResolve={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AlertList({ alerts, onResolve, showResolve }: { alerts: any[]; onResolve: (id: string) => void; showResolve: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <span className="text-sm">No alerts</span>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map(alert => {
        const style = SEVERITY_STYLES[alert.severity as keyof typeof SEVERITY_STYLES] ?? SEVERITY_STYLES.info;
        const isExpanded = expanded === alert._id;
        return (
          <li key={alert._id} className={cn("rounded-lg border p-4", style.bg)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0" style={{ color: UTILITY_COLORS[alert.utility] ?? "#6b7280" }}>
                  {style.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <Badge variant={style.variant}>{alert.severity}</Badge>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${UTILITY_COLORS[alert.utility]}20`, color: UTILITY_COLORS[alert.utility] }}>
                      {alert.utility}
                    </span>
                    {alert.isResolved && <Badge variant="success">Resolved</Badge>}
                    {alert.aiExplanation && (
                      <span className="text-xs flex items-center gap-0.5 text-purple-400">
                        <Sparkles className="h-3 w-3" /> AI
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(alert.triggeredAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {alert.aiExplanation && (
                  <button
                    onClick={() => setExpanded(isExpanded ? null : alert._id)}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                )}
                {showResolve && !alert.isResolved && (
                  <Button size="sm" variant="outline" onClick={() => onResolve(alert._id)}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Resolve
                  </Button>
                )}
              </div>
            </div>

            {/* AI Explanation panel */}
            {isExpanded && alert.aiExplanation && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">AI Analysis</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{alert.aiExplanation}</p>
              </div>
            )}

            {/* Loading state if no explanation yet */}
            {!alert.aiExplanation && !alert.isResolved && (
              <div className="mt-2 flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" style={{ animationPlayState: "paused" }} />
                <span className="text-xs text-muted-foreground">AI explanation pending</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
