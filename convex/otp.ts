import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Resend } from "resend";

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export const sendOTP = action({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256hex(code);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await ctx.runMutation(internal.otp.upsertCode, { email, codeHash, expiresAt });

    const key = process.env.AUTH_RESEND_KEY;
    if (!key) {
      console.warn(`[DEV] Missing AUTH_RESEND_KEY. Your sign-in code for ${email} is: ${code}`);
      return;
    }

    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: "BlockSense <onboarding@resend.dev>",
      to: [email],
      subject: "BlockSense — your sign-in code",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#F6F5F1;">
          <div style="background:#0F6E56;padding:24px;border-radius:8px;text-align:center;margin-bottom:32px;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">BlockSense</h1>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px;">Smart Community Operating System</p>
          </div>
          <div style="background:#fff;border-radius:8px;padding:32px;border:0.5px solid #CCCCCC;">
            <h2 style="color:#1A1A1A;margin:0 0 8px;font-size:20px;">Your sign-in code</h2>
            <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Enter this code to sign in to BlockSense. Valid for 10 minutes.</p>
            <div style="background:#F6F5F1;border-radius:8px;padding:24px;text-align:center;letter-spacing:16px;font-size:40px;font-weight:700;color:#0F6E56;">
              ${code}
            </div>
            <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;text-align:center;">If you did not request this, ignore this email.</p>
          </div>
        </div>
      `,
    });
    if (error) console.error(`Email send failed: ${JSON.stringify(error)}`);
  },
});

export const upsertCode = internalMutation({
  args: { email: v.string(), codeHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, { email, codeHash, expiresAt }) => {
    const existing = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", q => q.eq("email", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { codeHash, expiresAt });
    } else {
      await ctx.db.insert("otpCodes", { email, codeHash, expiresAt });
    }
  },
});

export const verifyAndConsume = internalQuery({
  args: { email: v.string(), codeHash: v.string() },
  handler: async (ctx, { email, codeHash }) => {
    const row = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", q => q.eq("email", email))
      .first();
    if (!row) return { valid: false as const, reason: "no_code" };
    if (row.expiresAt < Date.now()) return { valid: false as const, reason: "expired" };
    if (row.codeHash !== codeHash) return { valid: false as const, reason: "wrong_code" };
    return { valid: true as const, id: row._id };
  },
});

export const deleteCode = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const row = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", q => q.eq("email", email))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});
