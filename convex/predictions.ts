import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const runAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const societies = await ctx.db.query("societies").collect();
    for (const society of societies) {
      const blocks = await ctx.db
        .query("blocks")
        .withIndex("by_society", (q) => q.eq("societyId", society._id))
        .collect();
      for (const block of blocks) {
        await ctx.scheduler.runAfter(
          0,
          internal.alerts.checkWaterThresholds,
          { societyId: society._id, blockId: block._id }
        );
        await ctx.scheduler.runAfter(
          0,
          internal.alerts.checkPowerThresholds,
          { societyId: society._id, blockId: block._id }
        );
        await ctx.scheduler.runAfter(
          0,
          internal.alerts.checkGasThresholds,
          { societyId: society._id, blockId: block._id }
        );
        await ctx.scheduler.runAfter(
          0,
          internal.alerts.checkSewageThresholds,
          { societyId: society._id, blockId: block._id }
        );
      }
    }
  },
});

export const runDailyTankerPredictions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const day30ago = now - 30 * 86400000;
    const societies = await ctx.db.query("societies").collect();
    for (const society of societies) {
      const blocks = await ctx.db
        .query("blocks")
        .withIndex("by_society", (q) => q.eq("societyId", society._id))
        .collect();
      for (const block of blocks) {
        const tanks = await ctx.db
          .query("waterTanks")
          .withIndex("by_block", (q) => q.eq("societyId", society._id).eq("blockId", block._id))
          .collect();
        if (tanks.length === 0) continue;
        const tank = tanks[0];

        const readings = await ctx.db
          .query("waterReadings")
          .withIndex("by_block", (q) => q.eq("societyId", society._id).eq("blockId", block._id))
          .filter((q) => q.and(
            q.eq(q.field("readingType"), "consumption"),
            q.gte(q.field("recordedAt"), day30ago)
          ))
          .collect();
        const totalKL = readings.reduce((s, r) => s + r.value, 0);
        const avgDailyKL = readings.length > 0 ? totalKL / 30 : 0;

        const lastTanker = await ctx.db
          .query("tankerOrders")
          .withIndex("by_block", (q) => q.eq("societyId", society._id).eq("blockId", block._id))
          .filter((q) => q.eq(q.field("status"), "delivered"))
          .order("desc")
          .first();
        const lastTankerDaysAgo = lastTanker?.deliveredAt != null
          ? Math.floor((now - lastTanker.deliveredAt) / 86400000)
          : undefined;

        await ctx.scheduler.runAfter(0, internal.ai.predictTankerNeed, {
          societyName: society.name,
          blockName: block.name,
          avgDailyConsumptionKL: avgDailyKL,
          currentLevelKL: (tank.currentLevelPct / 100) * tank.capacityKL,
          tankCapacityKL: tank.capacityKL,
          lastTankerDaysAgo,
        });
      }
    }
  },
});

export const getLog = query({
  args: { societyId: v.id("societies"), blockId: v.id("blocks") },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");
    return ctx.db
      .query("predictionLog")
      .withIndex("by_block", (q) =>
        q.eq("societyId", args.societyId).eq("blockId", args.blockId)
      )
      .order("desc")
      .take(20);
  },
});
