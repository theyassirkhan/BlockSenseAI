"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Shield,
  Globe,
  MessageSquare,
  CreditCard,
  Mail,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

function StatusBadge({ status }: { status: "connected" | "active" | "pending" | "missing" }) {
  const map = {
    connected: { label: "Connected", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    active: { label: "Active", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    pending: { label: "Pending Config", icon: Clock, className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    missing: { label: "Not Configured", icon: AlertCircle, className: "bg-red-500/10 text-red-500 border-red-500/20" },
  };
  const { label, icon: Icon, className } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0 text-sm"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const profile = useQuery(api.users.getMyProfile);

  // Integration statuses — driven by env var presence (read-only display)
  const integrations = [
    {
      name: "WhatsApp (MSG91)",
      icon: MessageSquare,
      description: "OTP delivery & broadcast notifications",
      status: process.env.NEXT_PUBLIC_MSG91_AUTH_KEY ? "connected" : "pending",
      meta: "MSG91 Flow API",
    },
    {
      name: "Payment Gateway",
      icon: CreditCard,
      description: "Maintenance charge collection",
      status: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? "active" : "pending",
      meta: "Razorpay",
    },
    {
      name: "Email (Resend)",
      icon: Mail,
      description: "Transactional emails & reports",
      status: "pending",
      meta: "Resend API",
    },
    {
      name: "Push Notifications",
      icon: Bell,
      description: "In-app + WhatsApp broadcast",
      status: "active",
      meta: "Convex built-in",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Platform Settings
      </h1>

      {/* Admin Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Admin Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-base">
                {profile?.name ? profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "AD"}
              </span>
            </div>
            <div>
              <p className="font-semibold">{profile?.name ?? "—"}</p>
              <Badge variant="outline" className="text-xs mt-0.5 border-primary/30 text-primary">Platform Admin</Badge>
            </div>
          </div>
          <InfoRow label="Name" value={profile?.name ?? "—"} />
          <InfoRow label="Role" value="Platform Admin" />
          <InfoRow label="Platform" value="BlockSense AI" />
        </CardContent>
      </Card>

      {/* General Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            General Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Platform Name" value="BlockSense AI" />
          <InfoRow label="Max Societies" value="100" />
          <InfoRow label="Default Timezone" value="Asia/Kolkata (IST)" />
          <InfoRow label="Backend" value="Convex (Real-time)" />
          <InfoRow label="Auth Provider" value="Convex Auth + WhatsApp OTP" />
          <InfoRow label="Data Region" value="AWS us-east-1" />
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y" style={{ "--tw-divide-opacity": 1 } as any}>
          {integrations.map(({ name, icon: Icon, description, status, meta }) => (
            <div key={name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <StatusBadge status={status as any} />
                <span className="text-[10px] text-muted-foreground">{meta}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Integration credentials are managed via environment variables. Contact your DevOps team to update keys.
      </p>
    </div>
  );
}
