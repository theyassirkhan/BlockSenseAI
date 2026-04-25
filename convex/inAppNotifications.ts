import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 30 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("inAppNotifications")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const rows = await ctx.db
      .query("inAppNotifications")
      .withIndex("by_user", q => q.eq("userId", userId).eq("read", false))
      .collect();
    return rows.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("inAppNotifications") },
  handler: async (ctx, { notificationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const n = await ctx.db.get(notificationId);
    if (!n || n.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(notificationId, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const rows = await ctx.db
      .query("inAppNotifications")
      .withIndex("by_user", q => q.eq("userId", userId).eq("read", false))
      .collect();
    await Promise.all(rows.map(r => ctx.db.patch(r._id, { read: true })));
  },
});

export const send = internalMutation({
  args: {
    userId: v.id("users"),
    societyId: v.id("societies"),
    type: v.union(
      v.literal("notice"),
      v.literal("visitor"),
      v.literal("payment"),
      v.literal("invite"),
      v.literal("system")
    ),
    title: v.string(),
    body: v.string(),
    linkTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("inAppNotifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const sendToSociety = internalMutation({
  args: {
    societyId: v.id("societies"),
    type: v.union(
      v.literal("notice"),
      v.literal("visitor"),
      v.literal("payment"),
      v.literal("invite"),
      v.literal("system")
    ),
    title: v.string(),
    body: v.string(),
    linkTo: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { societyId, type, title, body, linkTo, roles }) => {
    let members = await ctx.db
      .query("users")
      .withIndex("by_society", q => q.eq("societyId", societyId))
      .collect();
    if (roles && roles.length > 0) {
      members = members.filter(m => roles.includes(m.role ?? ""));
    }
    const now = Date.now();
    await Promise.all(
      members.map(m =>
        ctx.db.insert("inAppNotifications", {
          userId: m._id,
          societyId,
          type,
          title,
          body,
          read: false,
          createdAt: now,
          linkTo,
        })
      )
    );
  },
});
