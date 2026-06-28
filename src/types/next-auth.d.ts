import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "player" | "admin" | "super_admin";
      permissions: string[];
      profileCompleted: boolean;
      isEmailVerified: boolean;
      teamId?: string;
      isTeamLeader?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "player" | "admin" | "super_admin";
    permissions: string[];
    profileCompleted: boolean;
    isEmailVerified: boolean;
    teamId?: string;
    isTeamLeader?: boolean;
  }
}
