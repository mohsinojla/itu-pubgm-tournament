"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Pin, Trash2, Plus, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface Announcement {
  _id: string;
  title: string;
  body: string;
  isPinned: boolean;
  category: "general" | "match" | "result" | "urgent";
  postedBy?: { name?: string };
  createdAt: string;
}

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "match", label: "Match" },
  { value: "result", label: "Result" },
  { value: "urgent", label: "Urgent" },
];

const CATEGORY_BADGE: Record<string, "default" | "blue" | "success" | "danger"> = {
  general: "default",
  match: "blue",
  result: "success",
  urgent: "danger",
};

export default function AdminAnnouncementsPanel({ announcements: initial }: { announcements: Announcement[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<"general" | "match" | "result" | "urgent">("general");
  const [isPinned, setIsPinned] = useState(false);
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function post() {
    if (!title.trim() || !body.trim()) { toast.error("Title and body are required"); return; }
    setPosting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, category, isPinned }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Announcement posted!");
        setTitle(""); setBody(""); setCategory("general"); setIsPinned(false);
        setShowForm(false);
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to post");
      }
    } finally {
      setPosting(false);
    }
  }

  async function togglePin(id: string, current: boolean) {
    const res = await fetch(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !current }),
    });
    const data = await res.json();
    if (data.success) router.refresh();
    else toast.error("Failed to update");
  }

  async function deleteAnn(id: string) {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success("Deleted"); router.refresh(); }
      else toast.error(data.error ?? "Failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)}>
          <Plus size={15} className="mr-1" /> New Announcement
        </Button>
      ) : (
        <div className="game-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold">New Announcement</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-[var(--text-2)]" /></button>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-2)] mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
              placeholder="Announcement title"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-2)] mb-1">Body *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-y"
              placeholder="Announcement content... HTML is supported."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-2)] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="accent-[var(--primary)]"
                />
                <span className="text-sm flex items-center gap-1">
                  <Pin size={13} /> Pin to top
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button loading={posting} onClick={post}>Post Announcement</Button>
          </div>
        </div>
      )}

      {/* Existing announcements */}
      <div className="space-y-3">
        {initial.length === 0 ? (
          <p className="text-sm text-[var(--text-2)]">No announcements yet.</p>
        ) : (
          initial.map((ann) => (
            <div key={ann._id} className={`game-card p-4 flex items-start gap-4 ${ann.isPinned ? "border-[var(--primary-dim)]/50" : ""}`}>
              {ann.isPinned && <Pin size={14} className="text-[var(--primary)] mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{ann.title}</h4>
                  <Badge variant={CATEGORY_BADGE[ann.category]} className="text-[10px]">{ann.category}</Badge>
                </div>
                <p className="text-xs text-[var(--text-2)] line-clamp-2" dangerouslySetInnerHTML={{ __html: ann.body }} />
                <p className="text-[10px] text-[var(--text-2)] mt-1">
                  {ann.postedBy?.name ?? "Admin"} · {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => togglePin(ann._id, ann.isPinned)}
                  className={`p-1.5 rounded-lg transition-colors ${ann.isPinned ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"}`}
                  title={ann.isPinned ? "Unpin" : "Pin"}
                >
                  <Pin size={14} />
                </button>
                <button
                  onClick={() => deleteAnn(ann._id)}
                  disabled={deleting === ann._id}
                  className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
