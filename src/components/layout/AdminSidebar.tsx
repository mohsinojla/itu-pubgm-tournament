"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UsersRound, Calendar, Trophy,
  BarChart2, Images, Megaphone, BookOpen, UserCog,
  Info, Shield, Heart,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PERMISSIONS } from "@/lib/constants/permissions";

interface AdminUser {
  id: string;
  name?: string | null;
  role: string;
  permissions: string[];
}

function hasAccess(user: AdminUser, permission: string) {
  if (user.role === "super_admin") return true;
  return user.permissions.includes(permission);
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/admin/players", label: "Players", icon: Users, permission: PERMISSIONS.MANAGE_PLAYERS },
  { href: "/admin/teams", label: "Teams", icon: UsersRound, permission: PERMISSIONS.MANAGE_TEAMS },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar, permission: PERMISSIONS.MANAGE_SCHEDULE },
  { href: "/admin/results", label: "Results", icon: Trophy, permission: PERMISSIONS.MANAGE_RESULTS },
  { href: "/admin/statistics", label: "Statistics", icon: BarChart2, permission: PERMISSIONS.VIEW_STATS },
  { href: "/admin/gallery", label: "Gallery", icon: Images, permission: PERMISSIONS.MANAGE_GALLERY },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, permission: PERMISSIONS.POST_ANNOUNCEMENTS },
  { href: "/admin/rules", label: "Rules", icon: BookOpen, permission: PERMISSIONS.POST_ANNOUNCEMENTS },
  { href: "/admin/community", label: "Community", icon: Heart, permission: null, superAdminOnly: true },
  { href: "/admin/about", label: "About Page", icon: Info, permission: null, superAdminOnly: true },
  { href: "/admin/admins", label: "Admins", icon: UserCog, permission: null, superAdminOnly: true },
];

export default function AdminSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly) return user.role === "super_admin";
    if (item.permission) return hasAccess(user, item.permission);
    return true;
  });

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/itu_logo.png" alt="ITU" width={28} height={28} className="object-contain" />
          <Image src="/pubg_logo.png" alt="PUBGM" width={28} height={28} className="object-contain" />
          <div className="ml-1">
            <p className="text-xs font-heading font-bold text-[var(--primary)] leading-none">ITU × PUBGM</p>
            <p className="text-[10px] text-[var(--text-2)] leading-none mt-0.5">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Admin info */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="text-xs text-[var(--text-2)]">Signed in as</p>
        <p className="text-sm font-medium truncate">{user.name ?? "Admin"}</p>
        <div className="flex items-center gap-1 mt-1">
          <Shield size={11} className="text-[var(--primary)]" />
          <span className="text-[10px] text-[var(--primary)] font-medium uppercase tracking-wider">
            {user.role === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                  : "text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--card)]"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="p-4 border-t border-[var(--border)]">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
        >
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
