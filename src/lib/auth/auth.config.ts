import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Edge-safe config — NO Mongoose/Node.js-only imports here
// This file is imported by middleware.ts which runs on the Edge runtime
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Actual authorize logic is in auth.ts (Node.js runtime)
      authorize: async () => null,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // session callback must live here too so proxy.ts (which uses only authConfig)
    // can read custom token fields (role, permissions, etc.) from auth.user
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "player" | "admin" | "super_admin") ?? "player";
        session.user.permissions = (token.permissions as string[]) ?? [];
        session.user.profileCompleted = (token.profileCompleted as boolean) ?? false;
        session.user.isEmailVerified = (token.isEmailVerified as boolean) ?? false;
        session.user.teamId = token.teamId as string | undefined;
        session.user.isTeamLeader = token.isTeamLeader as boolean | undefined;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const user = auth?.user as (NonNullable<typeof auth>["user"]) & {
        role?: string;
        profileCompleted?: boolean;
      };

      // Admin routes: must be admin or super_admin
      if (pathname.startsWith("/admin")) {
        if (!user) return false;
        if (user.role !== "admin" && user.role !== "super_admin") return false;
        return true;
      }

      // Protected routes: must be authenticated
      const protectedPaths = ["/profile", "/teams/create"];
      if (protectedPaths.some((p) => pathname.startsWith(p))) {
        if (!user) return false;
        return true;
      }

      return true;
    },
  },
  session: { strategy: "jwt" },
};
