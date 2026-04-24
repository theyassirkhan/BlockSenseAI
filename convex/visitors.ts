import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function generatePassCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const register = mutation({
  args: {
    societyId: v.id("societies"),
    visitorName: v.string(),
    visitorPhone: v.string(),
    expectedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", authId as string))
      .first();
    if (!user) throw new Error("Profile not found");
    return ctx.db.insert("visitors", {
      ...args,
      registeredBy: user._id,
      passCode: generatePassCode(),
      createdAt: Date.now(),
    });
  },
});

export const getMyVisitors = query({
  args: { societyId: v.id("societies") },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", authId as string))
      .first();
    if (!user) return [];
    return ctx.db
      .query("visitors")
      .withIndex("by_resident", (q) =>
        q.eq("societyId", args.societyId).eq("registeredBy", user._id)
      )
      .order("desc")
      .take(20);
  },
});

export const checkIn = mutation({
  args: { visitorId: v.id("visitors") },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");
    await ctx.db.patch(args.visitorId, { checkedInAt: Date.now() });
  },
});

export const checkOut = mutation({
  args: { visitorId: v.id("visitors") },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");
    await ctx.db.patch(args.visitorId, { checkedOutAt: Date.now() });
  },
});

// ── Guard PWA mutations ───────────────────────────────────────────────────

export const lookupByPassCode = query({
  args: { societyId: v.id("societies"), passCode: v.string() },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");
    const visitor = await ctx.db
      .query("visitors")
      .withIndex("by_society", q => q.eq("societyId", args.societyId))
      .filter(q => q.eq(q.field("passCode"), args.passCode))
      .first();
    if (!visitor) return null;
    const resident = await ctx.db.get(visitor.registeredBy);
    return { ...visitor, residentName: resident?.name, flatNumber: resident?.flatNumber };
  },
});

export const walkInEntry = mutation({
  args: {
    societyId: v.id("societies"),
    visitorName: v.string(),
    visitorPhone: v.string(),
    purposeFlat: v.string(),
    vehicleNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");
    const guard = await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", authId as string))
      .first();
    if (!guard) throw new Error("Profile not found");
    const now = Date.now();
    return ctx.db.insert("visitors", {
      societyId: args.societyId,
      registeredBy: guard._id,
      visitorName: args.visitorName,
      visitorPhone: args.visitorPhone,
      expectedAt: now,
      passCode: generatePassCode(),
      checkedInAt: now,
      createdAt: now,
    });
  },
});

export const getTodayLog = query({
  args: { societyId: v.id("societies") },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const visitors = await ctx.db
      .query("visitors")
      .withIndex("by_society", q => q.eq("societyId", args.societyId))
      .filter(q => q.gte(q.field("createdAt"), dayStart.getTime()))
      .order("desc")
      .take(100);
    return visitors;
  },
});
