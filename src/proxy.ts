import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

// Next.js 16 requires a named function export (not a const)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function proxy(request: NextRequest): Promise<any> {
  // auth() used as middleware handles the request and returns a Response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (auth as any)(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/teams/create/:path*",
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
