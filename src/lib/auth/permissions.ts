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

// Admins have the same full access as the super admin everywhere except the
// specific delete actions carved out in isSuperAdmin-gated routes (deleting
// community members or media). Per-permission assignment is no longer required.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for call-site compatibility
export function hasPermission(user: RoleUser, _perm: Permission): boolean {
  if (user.role === "super_admin") return true;
  if (user.role === "admin") return true;
  return false;
}

export function isSuperAdmin(user: RoleUser): boolean {
  return user.role === "super_admin";
}

export function isAdmin(user: RoleUser): boolean {
  return user.role === "admin" || user.role === "super_admin";
}
