"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UsersRound,
  BarChart2, Images, Megaphone, BookOpen, UserCog,
  Shield, MessageCircleQuestion, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AdminUser {
  id: string;
  name?: string | null;
  role: string;
  permissions: string[];
}

// Every admin has full access to the panel, same as the super admin — see
// lib/auth/permissions.ts. Only super-admin-only items are gated here.
const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/teams", label: "Teams", icon: UsersRound },
  { href: "/statistics", label: "Statistics", icon: BarChart2 },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/rules", label: "Rules", icon: BookOpen },
  { href: "/admin/queries", label: "Queries", icon: MessageCircleQuestion },
  { href: "/admin/admins", label: "Admins", icon: UserCog, superAdminOnly: true },
];

export default function AdminSidebar({
  user,
  isOpen = false,
  onClose,
}: {
  user: AdminUser;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const navItems = NAV_ITEMS.filter((item) =>
    item.superAdminOnly ? user.role === "super_admin" : true
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col z-50 transition-transform duration-300 ease-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <Image src="/itu_logo.png" alt="ITU" width={28} height={28} className="object-contain" />
          <Image src="/pubg_logo.png" alt="PUBGM" width={28} height={28} className="object-contain" />
          <div className="ml-1">
            <p className="text-xs font-heading font-bold text-[var(--primary)] leading-none">ITU × PUBGM</p>
            <p className="text-[10px] text-[var(--text-2)] leading-none mt-0.5">Admin Panel</p>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--card)] transition-colors"
        >
          <X size={18} />
        </button>
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
              onClick={onClose}
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
