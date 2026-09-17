"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Shield } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

interface AdminUser {
  id: string;
  name?: string | null;
  role: string;
  permissions: string[];
}

export default function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <AdminSidebar user={user} isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 rounded-lg text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--card)] transition-colors"
          >
            <Menu size={20} />
          </button>
          <Link href="/admin" className="flex items-center gap-1.5">
            <Shield size={14} className="text-[var(--primary)]" />
            <span className="font-heading font-bold text-sm text-[var(--primary)]">Admin Panel</span>
          </Link>
        </div>

        <div className="p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
