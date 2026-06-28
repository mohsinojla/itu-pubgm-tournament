import type { Permission } from "@/lib/constants/permissions";

export interface SessionUser {
  id: string;
  role: "player" | "admin" | "super_admin";
  permissions: string[];
  profileCompleted: boolean;
  isEmailVerified: boolean;
  teamId?: string;
  isTeamLeader?: boolean;
}

// Minimal type for permission checks — only role and permissions are needed
type RoleUser = { role: string; permissions: string[] };

export function hasPermission(user: RoleUser, perm: Permission): boolean {
  if (user.role === "super_admin") return true;
  if (user.role === "admin") return user.permissions.includes(perm);
  return false;
}

export function isSuperAdmin(user: RoleUser): boolean {
  return user.role === "super_admin";
}

export function isAdmin(user: RoleUser): boolean {
  return user.role === "admin" || user.role === "super_admin";
}
