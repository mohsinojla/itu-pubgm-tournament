"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function StatsVisibilityToggle({ visible: initialVisible }: { visible: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(initialVisible);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statsPageVisible: !visible }),
      });
      const data = await res.json();
      if (data.success) {
        setVisible(!visible);
        toast.success(!visible ? "Stats page is now public" : "Stats page hidden from the public");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to update");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-60 ${
        visible
          ? "border-[var(--success)]/40 text-[var(--success)] hover:bg-[var(--success)]/10"
          : "border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10"
      }`}
      title={visible ? "Visible to everyone — click to hide from the public" : "Hidden from the public — click to make visible"}
    >
      {visible ? <Eye size={13} /> : <EyeOff size={13} />}
      {visible ? "Public" : "Hidden from public"}
    </button>
  );
}
