"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Save, LogOut, Building2, Phone, MessageSquare, Pencil, X } from "lucide-react";
import { toast } from "sonner";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0 text-sm"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default function ResidentProfilePage() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const profile = useQuery(api.users.getMyProfile);
  const updateProfile = useMutation(api.users.updateProfile);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "" });

  function startEdit() {
    setForm({
      name: profile?.name ?? "",
      phone: profile?.phone ?? "",
      whatsapp: profile?.whatsapp ?? "",
    });
    setEditing(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
      });
      toast.success("Profile updated");
      setEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch {
      setSigningOut(false);
    }
  }

  const initials = profile?.name
    ? profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : null;

  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <User className="h-5 w-5" />
        My Profile
      </h1>

      {/* Avatar + name card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-xl">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">{profile?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[profile?.flatNumber, profile?.blockId ? "Block" : null]
                  .filter(Boolean)
                  .join(" · ") || "Resident"}
              </p>
            </div>
            {!editing && (
              <Button size="sm" variant="outline" onClick={startEdit} className="shrink-0">
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      {editing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Edit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
              </Label>
              <Input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Society info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Society Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Phone" value={profile?.phone} />
          <InfoRow label="WhatsApp" value={profile?.whatsapp} />
          <InfoRow label="Flat" value={profile?.flatNumber} />
          <InfoRow label="Flat type" value={profile?.flatType} />
          <InfoRow label="Role" value={profile?.role ?? "resident"} />
          <InfoRow label="Member since" value={memberSince} />
        </CardContent>
      </Card>

      {/* Sign out */}
      <Separator style={{ opacity: 0.1 }} />
      <Button
        variant="outline"
        className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {signingOut ? "Signing out…" : "Sign Out"}
      </Button>
    </div>
  );
}
