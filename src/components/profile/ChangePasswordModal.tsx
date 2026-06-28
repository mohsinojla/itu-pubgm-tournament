"use client";

import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setCurrent(""); setNext(""); setConfirm("");
    setShowCurrent(false); setShowNext(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (next !== confirm) { toast.error("Passwords do not match"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/users/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed successfully!");
        reset();
        onClose();
      } else {
        toast.error(data.error ?? "Failed to change password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md game-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-bold">Change Password</h2>
          <button onClick={() => { reset(); onClose(); }} className="text-[var(--text-2)] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-8 text-[var(--text-2)] hover:text-white transition-colors"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New Password"
              type={showNext ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              hint="Minimum 8 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowNext(!showNext)}
              className="absolute right-3 top-8 text-[var(--text-2)] hover:text-white transition-colors"
            >
              {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={saving}>
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
