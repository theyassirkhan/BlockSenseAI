import Anthropic from "@anthropic-ai/sdk";
import { action, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set in Convex env");
  return new Anthropic({ apiKey: key });
}

// ── Core call ──────────────────────────────────────────────────────────────

async function claudeText(
  systemPrompt: string,
  userMessage: string,
  model: "claude-haiku-4-5-20251001" | "claude-sonnet-4-6" = "claude-haiku-4-5-20251001"
): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text.trim();
}

// ── Internal mutation: write AI explanation to alert ──────────────────────

export const patchAlertExplanation = internalMutation({
  args: { alertId: v.id("alerts"), explanation: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { aiExplanation: args.explanation });
  },
});

// ── Feature 1: Explain an alert ───────────────────────────────────────────

export const explainAlert = internalAction({
  args: {
    alertId: v.id("alerts"),
    title: v.string(),
    message: v.string(),
    utility: v.string(),
    severity: v.string(),
    metadata: v.optional(v.any()),
    societyName: v.string(),
    blockName: v.string(),
  },
  handler: async (ctx, args) => {
    const explanation = await claudeText(
      `You are an expert facilities manager for Indian housing societies.
Explain utility alerts clearly and suggest immediate actions.
Be concise (3-4 sentences). Write in plain English.
Include: what likely caused it, what happens if ignored, 1-2 immediate actions.
No markdown, no bullet points — write as flowing text.`,
      `Society: ${args.societyName}, Block: ${args.blockName}
Alert: ${args.title}
Utility: ${args.utility} | Severity: ${args.severity}
Details: ${args.message}
Metadata: ${JSON.stringify(args.metadata ?? {})}`
    );
    await ctx.runMutation(internal.ai.patchAlertExplanation, {
      alertId: args.alertId,
      explanation,
    });
  },
});

// ── Feature 2: Draft a broadcast ─────────────────────────────────────────

export const draftBroadcast = action({
  args: {
    shortNote: v.string(),
    societyName: v.string(),
    type: v.string(),
  },
  handler: async (_ctx, args) => {
    const draft = await claudeText(
      `You are the secretary of an Indian residential housing society named "${args.societyName}".
Write professional, polite notice announcements for residents.
Rules:
- Start with "Dear Residents,"
- Keep it under 80 words
- End with "— ${args.societyName} Management"
- Use Indian date/time formats (e.g. 24th April, 9:00 AM)
- No markdown, no bullet points, flowing paragraphs only
- Tone: formal but warm`,
      `Write a notice for this situation: ${args.shortNote}
Notice type: ${args.type}`
    );
    return { draft };
  },
});

// ── Feature 3: Monthly AI narrative for PDF report ────────────────────────

export const generateMonthlyNarrative = internalAction({
  args: {
    societyName: v.string(),
    month: v.string(),
    waterData: v.string(),
    powerData: v.string(),
    paymentData: v.string(),
    alertData: v.string(),
    serviceData: v.string(),
  },
  handler: async (_ctx, args) => {
    const narrative = await claudeText(
      `You are a smart facility management AI writing a monthly report for an Indian housing society.
Write a concise executive summary (5-7 sentences) covering:
1. Overall performance this month
2. Biggest utility concern
3. Payment collection health
4. One specific cost-saving recommendation
Write in professional English. No markdown, no headers, flowing paragraphs.`,
      `Society: ${args.societyName}
Month: ${args.month}
Water: ${args.waterData}
Power: ${args.powerData}
Payments: ${args.paymentData}
Alerts: ${args.alertData}
Service Requests: ${args.serviceData}`,
      "claude-sonnet-4-6"
    );
    return { narrative };
  },
});

// ── Feature 4: Resident chatbot ───────────────────────────────────────────

export const residentChat = action({
  args: {
    message: v.string(),
    societyName: v.string(),
    residentName: v.string(),
    flatNumber: v.string(),
    context: v.string(),
  },
  handler: async (_ctx, args) => {
    const reply = await claudeText(
      `You are BlockSense AI Assistant for ${args.societyName} housing society.
Help residents with information about their society.
Be helpful, concise, and friendly. Keep replies under 60 words.
If you don't have specific data, say so and suggest who to contact.
Never make up data — only use what's provided in the context.
No markdown, plain text only.`,
      `Resident: ${args.residentName}, Flat: ${args.flatNumber}
Society data:
${args.context}

Question: ${args.message}`
    );
    return { reply };
  },
});

// ── Feature 5: Tanker prediction ─────────────────────────────────────────

export const predictTankerNeed = internalAction({
  args: {
    societyName: v.string(),
    blockName: v.string(),
    avgDailyConsumptionKL: v.number(),
    currentLevelKL: v.number(),
    tankCapacityKL: v.number(),
    lastTankerDaysAgo: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const daysRemaining = args.avgDailyConsumptionKL > 0
      ? Math.floor(args.currentLevelKL / args.avgDailyConsumptionKL)
      : 99;
    const recommendation = await claudeText(
      `You are a water management assistant for an Indian housing society.
Give a short, practical recommendation in 2 sentences max. No markdown.`,
      `Society: ${args.societyName}, Block: ${args.blockName}
Tank: ${args.currentLevelKL.toFixed(1)} KL of ${args.tankCapacityKL} KL (${Math.round((args.currentLevelKL / args.tankCapacityKL) * 100)}%)
Avg daily use: ${args.avgDailyConsumptionKL.toFixed(1)} KL → ~${daysRemaining} days remaining
Last tanker: ${args.lastTankerDaysAgo != null ? `${args.lastTankerDaysAgo} days ago` : "unknown"}`
    );
    return { daysRemaining, recommendation };
  },
});

// ── Feature 6: Vendor intelligence ───────────────────────────────────────

export const vendorIntelligence = action({
  args: {
    societyName: v.string(),
    vendorData: v.string(),
  },
  handler: async (_ctx, args) => {
    const insight = await claudeText(
      `You are a procurement advisor for Indian housing societies.
Analyze vendor spending and give 2-3 actionable insights.
Focus on cost savings, underperforming vendors, negotiation opportunities.
Under 80 words. No markdown, plain text only.`,
      `Society: ${args.societyName}\n${args.vendorData}`
    );
    return { insight };
  },
});
