import { action, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMonthlyWaterSummary = query({
  args: {
    societyId: v.id("societies"),
    blockId: v.id("blocks"),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");

    const start = new Date(args.year, args.month - 1, 1).getTime();
    const end = new Date(args.year, args.month, 1).getTime();

    const readings = await ctx.db
      .query("waterReadings")
      .withIndex("by_recorded_at", (q) =>
        q
          .eq("societyId", args.societyId)
          .eq("blockId", args.blockId)
          .gte("recordedAt", start)
      )
      .filter((q) => q.lt(q.field("recordedAt"), end))
      .collect();

    const tankers = await ctx.db
      .query("tankerOrders")
      .withIndex("by_block", (q) =>
        q.eq("societyId", args.societyId).eq("blockId", args.blockId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), start),
          q.lt(q.field("createdAt"), end),
          q.eq(q.field("status"), "delivered")
        )
      )
      .collect();

    const totalConsumption = readings
      .filter((r) => r.readingType === "consumption")
      .reduce((s, r) => s + r.value, 0);

    const bySource = readings.reduce(
      (acc, r) => {
        acc[r.source] = (acc[r.source] ?? 0) + r.value;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalConsumptionKL: Math.round(totalConsumption * 10) / 10,
      bySource,
      tankerCount: tankers.length,
      tankerCost: tankers.reduce((s, t) => s + (t.cost ?? 0), 0),
      tankerKL: tankers.reduce((s, t) => s + t.quantityKL, 0),
    };
  },
});

export const getMonthlyPowerSummary = query({
  args: {
    societyId: v.id("societies"),
    blockId: v.id("blocks"),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");

    const start = new Date(args.year, args.month - 1, 1).getTime();
    const end = new Date(args.year, args.month, 1).getTime();

    const readings = await ctx.db
      .query("powerReadings")
      .withIndex("by_recorded_at", (q) =>
        q
          .eq("societyId", args.societyId)
          .eq("blockId", args.blockId)
          .gte("recordedAt", start)
      )
      .filter((q) => q.lt(q.field("recordedAt"), end))
      .collect();

    const outages = await ctx.db
      .query("powerOutages")
      .withIndex("by_block", (q) =>
        q.eq("societyId", args.societyId).eq("blockId", args.blockId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("startedAt"), start),
          q.lt(q.field("startedAt"), end)
        )
      )
      .collect();

    const bySource = readings.reduce(
      (acc, r) => {
        if (r.readingType === "consumption") {
          acc[r.source] = (acc[r.source] ?? 0) + r.valueKWH;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalConsumptionKWH: Math.round(
        (Object.values(bySource) as number[]).reduce((s, v) => s + v, 0)
      ),
      bySource,
      outageCount: outages.length,
      totalOutageHrs: outages.reduce((s, o) => s + (o.durationHrs ?? 0), 0),
      totalDieselUsedL: outages.reduce(
        (s, o) => s + (o.dieselUsedL ?? 0),
        0
      ),
    };
  },
});

export const getMonthlyGasSummary = query({
  args: {
    societyId: v.id("societies"),
    blockId: v.id("blocks"),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");

    const start = new Date(args.year, args.month - 1, 1).getTime();
    const end = new Date(args.year, args.month, 1).getTime();

    const readings = await ctx.db
      .query("gasReadings")
      .withIndex("by_recorded_at", (q) =>
        q
          .eq("societyId", args.societyId)
          .eq("blockId", args.blockId)
          .gte("recordedAt", start)
      )
      .filter((q) => q.lt(q.field("recordedAt"), end))
      .collect();

    const avgPressure =
      readings.length > 0
        ? readings.reduce((s, r) => s + r.pressurePSI, 0) / readings.length
        : 0;
    const totalConsumption = readings.reduce(
      (s, r) => s + (r.consumptionSCM ?? 0),
      0
    );

    return {
      totalConsumptionSCM: Math.round(totalConsumption * 10) / 10,
      avgPressurePSI: Math.round(avgPressure * 10) / 10,
      readings: readings.length,
      lastMeterReading:
        readings.length > 0 ? readings[readings.length - 1].meterReading : 0,
    };
  },
});

export const getMonthlySewageSummary = query({
  args: {
    societyId: v.id("societies"),
    blockId: v.id("blocks"),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");

    const start = new Date(args.year, args.month - 1, 1).getTime();
    const end = new Date(args.year, args.month, 1).getTime();

    const readings = await ctx.db
      .query("sewageReadings")
      .withIndex("by_recorded_at", (q) =>
        q
          .eq("societyId", args.societyId)
          .eq("blockId", args.blockId)
          .gte("recordedAt", start)
      )
      .filter((q) => q.lt(q.field("recordedAt"), end))
      .collect();

    const statusCounts = readings.reduce(
      (acc, r) => {
        acc[r.stpStatus] = (acc[r.stpStatus] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const normalDays = statusCounts["normal"] ?? 0;
    const uptimePct =
      readings.length > 0
        ? Math.round((normalDays / readings.length) * 100)
        : 0;
    const avgSludge =
      readings.length > 0
        ? Math.round(
            (readings.reduce((s, r) => s + r.sludgeTankPct, 0) /
              readings.length) *
              10
          ) / 10
        : 0;

    return {
      readings: readings.length,
      normalDays,
      uptimePct,
      avgSludgePct: avgSludge,
      statusCounts,
    };
  },
});

export const getMonthlyWasteSummary = query({
  args: {
    societyId: v.id("societies"),
    blockId: v.id("blocks"),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");

    const start = new Date(args.year, args.month - 1, 1).getTime();
    const end = new Date(args.year, args.month, 1).getTime();

    const logs = await ctx.db
      .query("wasteLogs")
      .withIndex("by_logged_at", (q) =>
        q
          .eq("societyId", args.societyId)
          .eq("blockId", args.blockId)
          .gte("loggedAt", start)
      )
      .filter((q) => q.lt(q.field("loggedAt"), end))
      .collect();

    return {
      totalKG: Math.round(logs.reduce((s, l) => s + l.totalKG, 0) * 10) / 10,
      dryKG: Math.round(logs.reduce((s, l) => s + l.dryWasteKG, 0) * 10) / 10,
      wetKG: Math.round(logs.reduce((s, l) => s + l.wetWasteKG, 0) * 10) / 10,
      segregationCompliance:
        logs.length > 0
          ? Math.round(
              (logs.filter((l) => l.segregationOk).length / logs.length) * 100
            )
          : 0,
      totalEntries: logs.length,
    };
  },
});

// ── AI Monthly Report ─────────────────────────────────────────────────────

export const getMonthlyReportDataInternal = internalQuery({
  args: { societyId: v.id("societies"), blockId: v.id("blocks") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const DAY = 86400000;
    const monthStart = now - 30 * DAY;

    const [society, block, waterReadings, powerReadings, payments, alerts, serviceRequests] = await Promise.all([
      ctx.db.get(args.societyId),
      ctx.db.get(args.blockId),
      ctx.db.query("waterReadings").withIndex("by_block", q => q.eq("societyId", args.societyId).eq("blockId", args.blockId)).filter(q => q.gte(q.field("recordedAt"), monthStart)).collect(),
      ctx.db.query("powerReadings").withIndex("by_block", q => q.eq("societyId", args.societyId).eq("blockId", args.blockId)).filter(q => q.gte(q.field("recordedAt"), monthStart)).collect(),
      ctx.db.query("payments").withIndex("by_society", q => q.eq("societyId", args.societyId)).collect(),
      ctx.db.query("alerts").withIndex("by_block", q => q.eq("societyId", args.societyId).eq("blockId", args.blockId)).filter(q => q.gte(q.field("triggeredAt"), monthStart)).collect(),
      ctx.db.query("serviceRequests").withIndex("by_society", q => q.eq("societyId", args.societyId)).filter(q => q.gte(q.field("createdAt"), monthStart)).collect(),
    ]);

    const totalWaterKL = waterReadings.filter(r => r.readingType === "consumption").reduce((s, r) => s + r.value, 0);
    const totalPowerKWH = powerReadings.filter(r => r.readingType === "consumption").reduce((s, r) => s + r.valueKWH, 0);
    const confirmedPayments = payments.filter(p => p.status === "confirmed" && p.paidAt && p.paidAt >= monthStart);
    const pendingPayments = payments.filter(p => p.status === "pending" || p.status === "overdue");

    return {
      society,
      block,
      month: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }),
      water: { totalKL: Math.round(totalWaterKL * 10) / 10, readings: waterReadings.length },
      power: { totalKWH: Math.round(totalPowerKWH), readings: powerReadings.length },
      payments: {
        collected: confirmedPayments.reduce((s, p) => s + p.amount, 0),
        outstanding: pendingPayments.reduce((s, p) => s + p.amount, 0),
        defaulters: pendingPayments.length,
      },
      alerts: { total: alerts.length, critical: alerts.filter(a => a.severity === "critical").length, resolved: alerts.filter(a => a.isResolved).length },
      serviceRequests: { total: serviceRequests.length, open: serviceRequests.filter(r => r.status === "open" || r.status === "in_progress").length },
    };
  },
});

export const generateMonthlyReport = action({
  args: { societyId: v.id("societies"), blockId: v.id("blocks") },
  handler: async (ctx, args): Promise<Record<string, unknown>> => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");

    const data = await ctx.runQuery(internal.reports.getMonthlyReportDataInternal, args) as any;

    const result = await ctx.runAction(internal.ai.generateMonthlyNarrative, {
      societyName: data.society?.name ?? "Society",
      month: data.month as string,
      waterData: `${data.water.totalKL} KL consumed (${data.water.readings} readings)`,
      powerData: `${data.power.totalKWH} kWh consumed (${data.power.readings} readings)`,
      paymentData: `Collected ₹${(data.payments.collected as number).toLocaleString("en-IN")}, outstanding ₹${(data.payments.outstanding as number).toLocaleString("en-IN")}, ${data.payments.defaulters} defaulters`,
      alertData: `${data.alerts.total} alerts, ${data.alerts.critical} critical, ${data.alerts.resolved} resolved`,
      serviceData: `${data.serviceRequests.total} requests, ${data.serviceRequests.open} still open`,
    }) as { narrative: string };

    return { ...data, narrative: result.narrative, generatedAt: Date.now() };
  },
});
