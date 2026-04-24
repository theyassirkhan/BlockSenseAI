import { convexAuth, createAccount } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { internal } from "./_generated/api";

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

const OTP = ConvexCredentials({
  id: "otp",
  authorize: async (credentials, ctx) => {
    const email = (credentials.email as string | undefined)?.toLowerCase().trim();
    const code = credentials.code as string | undefined;

    if (!email || !code) return null;

    const codeHash = await sha256hex(code);

    const result = await ctx.runQuery(internal.otp.verifyAndConsume, { email, codeHash });
    if (!result.valid) return null;

    await ctx.runMutation(internal.otp.deleteCode, { email });

    const { user } = await createAccount(ctx, {
      provider: "otp",
      account: { id: email },
      profile: { email },
    });

    return { userId: user._id };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Anonymous, OTP],
});
