"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { timeAgo } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { useNotifications } from "@/lib/hooks/useNotifications";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, mutate } = useNotifications();

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    mutate();
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    mutate();
  }

  const typeColors: Record<string, string> = {
    join_approved: "text-[var(--success)]",
    join_rejected: "text-[var(--danger)]",
    match_scheduled: "text-[var(--primary)]",
    result_posted: "text-[var(--primary)]",
    announcement: "text-blue-400",
    urgent: "text-[var(--accent)]",
    stats_hidden: "text-[var(--warning)]",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
      >
        <Bell size={18} className="text-[var(--text-2)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--primary)] text-black text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h3 className="font-heading font-semibold text-sm">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-[var(--text-2)] text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => {
                      markRead(notif._id);
                      if (notif.link) {
                        setOpen(false);
                        window.location.href = notif.link;
                      }
                    }}
                    className={cn(
                      "px-4 py-3 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--surface)] transition-colors",
                      !notif.isRead && "bg-[var(--primary)]/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold truncate", typeColors[notif.type])}>
                          {notif.title}
                        </p>
                        {notif.message && (
                          <p className="text-xs text-[var(--text-2)] mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                        )}
                        <p className="text-[10px] text-[var(--text-2)] mt-1">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
