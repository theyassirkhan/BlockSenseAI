import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "https://blocksense-ai-ten.vercel.app")
  );
  // Clear all convex auth cookies
  const cookieNames = ["__convexAuthJWT", "__convexAuthRefreshToken", "__Host-ConvexAuthRefreshToken"];
  for (const name of cookieNames) {
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  }
  return response;
}
