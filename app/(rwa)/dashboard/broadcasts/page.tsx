"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus, Sparkles, Wand2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

const TYPE_COLOR: Record<string, string> = {
  alert: "#A32D2D",
  warning: "#BA7517",
  info: "#185FA5",
  maintenance: "#854F0B",
};

const WA_NUMBER = "919739121146";

export default function RwaBroadcastsPage() {
  const profile = useQuery(api.users.getMyProfile);
  const societyId = profile?.societyId;
  const society = useQuery(api.societies.get, societyId ? { societyId } : "skip");
  const blocks = useQuery(api.societies.getBlocks, societyId ? { societyId } : "skip");
  const broadcasts = useQuery(api.broadcastsService.getBySociety, societyId ? { societyId } : "skip");
  const send = useMutation(api.broadcastsService.send);
  const draftBroadcast = useAction(api.ai.draftBroadcast);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [shortNote, setShortNote] = useState("");
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info" as "alert" | "warning" | "info" | "maintenance",
    targetBlock: "all",
  });

  async function handleAIDraft() {
    if (!shortNote.trim()) return toast.error("Enter a short note first");
    setDrafting(true);
    try {
      const result = await draftBroadcast({
        shortNote,
        societyName: society?.name ?? "Society",
        type: form.type,
      });
      // Extract title from first line, rest is body
      const lines = result.draft.split("\n").filter(Boolean);
      const body = result.draft;
      // Auto-fill message; leave title for user to set
      setForm(f => ({ ...f, message: body }));
      toast.success("AI draft ready — review and edit before sending");
    } catch (e: any) {
      toast.error("AI draft failed: " + (e.message ?? "unknown error"));
    } finally {
      setDrafting(false);
    }
  }

  async function handleSend() {
    if (!societyId || !form.title || !form.message) return toast.error("Title and message required");
    setSaving(true);
    try {
      const blockId = form.targetBlock !== "all" ? (form.targetBlock as any) : undefined;
      const targetAudience = form.targetBlock === "all"
        ? "All residents"
        : blocks?.find(b => b._id === form.targetBlock)?.name ?? form.targetBlock;
      await send({
        societyId,
        blockId,
        title: form.title,
        message: form.message,
        type: form.type,
        targetAudience,
        channels: ["in_app"],
      });
      toast.success("Broadcast sent");
      setForm({ title: "", message: "", type: "info", targetBlock: "all" });
      setShortNote("");
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  function buildWaLink(message: string) {
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Broadcasts
        </h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New broadcast
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2">Send Broadcast</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* AI Draft row */}
            <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-medium text-purple-300">AI Draft Assistant</span>
              </div>
              <div className="flex gap-2">
                <Input
                  className="text-xs"
                  placeholder="e.g. water cut tomorrow morning for tank cleaning"
                  value={shortNote}
                  onChange={e => setShortNote(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAIDraft()}
                />
                <Button size="sm" variant="outline" onClick={handleAIDraft} disabled={drafting} className="shrink-0 border-purple-500/40 text-purple-300 gap-1">
                  <Wand2 className="h-3.5 w-3.5" />
                  {drafting ? "Writing…" : "Draft"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Type a short note → Claude writes a professional notice</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alert">🔴 Alert</SelectItem>
                    <SelectItem value="warning">🟠 Warning</SelectItem>
                    <SelectItem value="info">🔵 Info</SelectItem>
                    <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target block</Label>
                <Select value={form.targetBlock} onValueChange={v => setForm({ ...form, targetBlock: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All blocks</SelectItem>
                    {blocks?.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Water supply interrupted tomorrow 10–12pm" />
            </div>

            <div className="space-y-1.5">
              <Label>Message *</Label>
              <Textarea rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Full message…" />
            </div>

            {/* WhatsApp share link */}
            {form.message && (
              <a
                href={buildWaLink(`*${form.title}*\n\n${form.message}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Share via WhatsApp
              </a>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSend} disabled={saving}>{saving ? "Sending…" : "Send to app"}</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setShortNote(""); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Target</th>
                  <th className="text-left px-4 py-3 font-medium">Sent</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {(broadcasts ?? []).map(b => (
                  <tr key={b._id} className="border-b hover:bg-muted/30" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{b.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium" style={{ color: TYPE_COLOR[b.type] }}>{b.type}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{b.targetAudience}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.sentCount}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{b.sentAt ? formatDateTime(b.sentAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <a
                        href={buildWaLink(`*${b.title}*\n\n${b.message}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Send
                      </a>
                    </td>
                  </tr>
                ))}
                {!(broadcasts ?? []).length && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No broadcasts yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
