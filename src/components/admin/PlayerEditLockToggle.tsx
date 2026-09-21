"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Lock, Unlock } from "lucide-react";

export default function PlayerEditLockToggle({ locked: initialLocked }: { locked: boolean }) {
  const router = useRouter();
  const [locked, setLocked] = useState(initialLocked);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !locked;
    const message = next
      ? "Lock all player edits? Players won't be able to edit their profile, create teams, join or leave teams, or manage their team until you unlock. Admins are not affected."
      : "Unlock player edits? Players will be able to edit their profiles and manage teams again.";
    if (!confirm(message)) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerEditsLocked: next }),
      });
      const data = await res.json();
      if (data.success) {
        setLocked(next);
        toast.success(next ? "Player edits are now locked" : "Player edits are unlocked");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to update");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`game-card p-5 mb-8 flex flex-wrap items-center justify-between gap-4 border ${
        locked ? "border-[var(--warning)]/40" : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${locked ? "bg-[var(--warning)]/10" : "bg-[var(--primary)]/10"}`}>
          {locked ? (
            <Lock size={20} className="text-[var(--warning)]" />
          ) : (
            <Unlock size={20} className="text-[var(--primary)]" />
          )}
        </div>
        <div>
          <p className="font-heading font-bold">
            Player edits are {locked ? "LOCKED" : "open"}
          </p>
          <p className="text-xs text-[var(--text-2)] mt-0.5 max-w-xl">
            {locked
              ? "Players can't edit profiles, create teams, or join/leave/manage teams. Admins can still do everything."
              : "Players can edit their profile and manage their teams. Lock this to freeze all player changes."}
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
          locked
            ? "bg-[var(--primary)] text-black hover:bg-[var(--primary-dim)]"
            : "border border-[var(--warning)]/50 text-[var(--warning)] hover:bg-[var(--warning)]/10"
        }`}
      >
        {saving ? "Saving…" : locked ? "Unlock edits" : "Lock all edits"}
      </button>
    </div>
  );
}
