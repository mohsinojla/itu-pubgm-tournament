"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Shield,
  LogOut,
  User,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  ImageIcon,
  Megaphone,
  BookOpen,
  Gift,
  Home,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import NotificationBell from "./NotificationBell";

// Community replaces Teams in the navbar. Teams is still accessible via the home page CTA.
const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/results", label: "Results", icon: Swords },
  { href: "/statistics", label: "Stats", icon: BarChart3 },
  { href: "/honour-board", label: "Honours", icon: Trophy },
  { href: "/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/community", label: "Community", icon: Users },
  { href: "/announcements", label: "News", icon: Megaphone },
  { href: "/rules", label: "Rules", icon: BookOpen },
  { href: "/prizes", label: "Prizes", icon: Gift },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isAdminOrSuperAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "super_admin";

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/pubg_logo.png"
              alt="PUBGM"
              width={36}
              height={36}
              className="object-contain"
            />
            <div className="hidden sm:block">
              <span className="font-heading text-lg font-bold gold-text">
                ITU × PUBGM
              </span>
              <p className="text-[10px] text-[var(--text-2)] leading-none -mt-0.5 uppercase tracking-widest">
                Supremacy Cup
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links — first 7 visible, rest in More */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.slice(0, 7).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(href)
                    ? "text-[var(--primary)] bg-[var(--primary)]/10"
                    : "text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface)]"
                )}
              >
                {label}
              </Link>
            ))}
            {/* More dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface)] flex items-center gap-1 transition-colors">
                More <ChevronDown size={14} />
              </button>
              <div className="absolute top-full right-0 mt-1 w-44 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl">
                {navLinks.slice(7).map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface)] transition-colors"
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right side: notification bell + user menu */}
          <div className="flex items-center gap-2">
            {status === "authenticated" && <NotificationBell />}

            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-[var(--surface)] animate-pulse" />
            ) : status === "authenticated" ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--surface)] transition-colors"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[var(--border)]">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name ?? "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--primary)]/20 text-[var(--primary)]">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                  <ChevronDown size={14} className="text-[var(--text-2)] hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl z-20">
                      <div className="px-4 py-3 border-b border-[var(--border)]">
                        <p className="text-sm font-semibold truncate">
                          {session.user?.name ?? "Player"}
                        </p>
                        <p className="text-xs text-[var(--text-2)] truncate">
                          {session.user?.email}
                        </p>
                        {session.user?.role === "super_admin" && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--primary)] font-bold uppercase tracking-wider">
                            <Shield size={10} /> Super Admin
                          </span>
                        )}
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--surface)] transition-colors"
                        >
                          <User size={14} /> My Profile
                        </Link>
                        {isAdminOrSuperAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--primary)] hover:bg-[var(--surface)] transition-colors"
                          >
                            <Shield size={14} /> Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--surface)] transition-colors"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex px-4 py-2 text-sm font-semibold bg-[var(--primary)] text-black rounded-lg hover:bg-[var(--primary-dim)] transition-colors glow-primary-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(href)
                    ? "text-[var(--primary)] bg-[var(--primary)]/10"
                    : "text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--card)]"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
