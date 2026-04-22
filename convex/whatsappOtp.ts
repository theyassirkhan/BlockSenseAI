import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// SHA-256 hash (same pattern as email OTP)
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Send WhatsApp OTP — currently sends via email (Resend)
// Swap this function body for real WhatsApp API later
export const sendOtp = action({
  args: {
    phone: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");

    const otp = generateOtp();
    const codeHash = await sha256(otp);
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Delete any existing verification for this phone
    const existing = await ctx.runQuery(
      "whatsappOtp:getByPhone" as any,
      { phone: args.phone }
    );
    if (existing) {
      await ctx.runMutation("whatsappOtp:deleteVerification" as any, {
        id: existing._id,
      });
    }

    // Store hashed code
    await ctx.runMutation("whatsappOtp:createVerification" as any, {
      phone: args.phone,
      code: codeHash,
      expirationTime,
      userId: authId as string,
      email: args.email,
    });

    // Send OTP via Resend email (swap for WhatsApp API later)
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.AUTH_RESEND_KEY);
    const { error } = await resend.emails.send({
      from: "BlockSense <onboarding@resend.dev>",
      to: [args.email],
      subject: "BlockSense — WhatsApp Verification Code",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#F6F5F1;">
          <div style="background:#0F6E56;padding:24px;border-radius:8px;text-align:center;margin-bottom:32px;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">BlockSense</h1>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px;">WhatsApp Verification</p>
          </div>
          <div style="background:#fff;border-radius:8px;padding:32px;border:0.5px solid #CCCCCC;">
            <h2 style="color:#1A1A1A;margin:0 0 8px;font-size:20px;">Verify your WhatsApp number</h2>
            <p style="color:#6b7280;margin:0 0 8px;font-size:14px;">Number: <strong>${args.phone}</strong></p>
            <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Enter this code in the app. Valid for 10 minutes.</p>
            <div style="background:#F6F5F1;border-radius:8px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:700;color:#0F6E56;">
              ${otp}
            </div>
          </div>
        </div>
      `,
    });
    if (error) throw new Error(`Failed to send OTP: ${(error as any).message}`);

    return { sent: true };
  },
});

// Verify WhatsApp OTP
export const verifyOtp = action({
  args: {
    phone: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error("Unauthenticated");

    const codeHash = await sha256(args.code);

    const verification = await ctx.runQuery(
      "whatsappOtp:getByPhone" as any,
      { phone: args.phone }
    );

    if (!verification) {
      return { verified: false, error: "No verification found" };
    }

    if (verification.code !== codeHash) {
      return { verified: false, error: "Invalid code" };
    }

    if (verification.expirationTime < Date.now()) {
      return { verified: false, error: "Code expired" };
    }

    // Mark verified and clean up
    await ctx.runMutation("whatsappOtp:markVerified" as any, {
      id: verification._id,
    });

    return { verified: true };
  },
});

// --- Internal queries/mutations for the action to call ---

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("whatsappVerifications")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
  },
});

export const createVerification = mutation({
  args: {
    phone: v.string(),
    code: v.string(),
    expirationTime: v.number(),
    userId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("whatsappVerifications", {
      ...args,
      verified: false,
    });
  },
});

export const deleteVerification = mutation({
  args: { id: v.id("whatsappVerifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const markVerified = mutation({
  args: { id: v.id("whatsappVerifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { verified: true });
  },
});
