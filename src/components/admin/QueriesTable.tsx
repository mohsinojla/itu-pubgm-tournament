"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Search, Send } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";

interface QueryUser {
  _id: string;
  name?: string;
  email: string;
  photo?: string;
  pubgName?: string;
}

interface QueryItem {
  _id: string;
  userId: QueryUser;
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved";
  adminReply?: string;
  createdAt: string;
}

const STATUS_OPTIONS: QueryItem["status"][] = ["pending", "in_progress", "resolved"];

const STATUS_VARIANT: Record<QueryItem["status"], "warning" | "blue" | "success"> = {
  pending: "warning",
  in_progress: "blue",
  resolved: "success",
};

export default function QueriesTable({ queries }: { queries: QueryItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QueryItem["status"]>("all");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = queries.filter((q) => {
    if (statusFilter !== "all" && q.status !== statusFilter) return false;
    const s = search.toLowerCase();
    return (
      q.subject.toLowerCase().includes(s) ||
      q.message.toLowerCase().includes(s) ||
      q.userId?.name?.toLowerCase().includes(s) ||
      q.userId?.email?.toLowerCase().includes(s)
    );
  });

  async function updateQuery(id: string, updates: { status?: QueryItem["status"]; adminReply?: string }) {
    setLoading(id);
    try {
      const res = await fetch(`/api/queries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) { toast.success("Updated"); router.refresh(); }
      else toast.error(data.error ?? "Update failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, message, name, or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <p className="text-xs text-[var(--text-2)]">{filtered.length} quer{filtered.length !== 1 ? "ies" : "y"}</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-2)] text-sm border border-dashed border-[var(--border)] rounded-2xl">
          No queries found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div key={q._id} className="game-card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2.5">
                  <Avatar src={q.userId?.photo} name={q.userId?.name ?? q.userId?.email} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{q.userId?.name ?? "—"}</p>
                    <p className="text-xs text-[var(--text-2)]">{q.userId?.email}</p>
                  </div>
                </div>
                <span className="text-xs text-[var(--text-2)] whitespace-nowrap">
                  {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                </span>
              </div>

              <h3 className="font-heading font-bold text-[var(--text-1)] mb-1">{q.subject}</h3>
              <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap mb-3">{q.message}</p>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant={STATUS_VARIANT[q.status]}>{q.status.replace("_", " ")}</Badge>
                <select
                  value={q.status}
                  disabled={loading === q._id}
                  onChange={(e) => updateQuery(q._id, { status: e.target.value as QueryItem["status"] })}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs focus:outline-none focus:border-[var(--primary)] transition-colors"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyDrafts[q._id] ?? q.adminReply ?? ""}
                  onChange={(e) => setReplyDrafts((d) => ({ ...d, [q._id]: e.target.value }))}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading === q._id}
                  onClick={() => updateQuery(q._id, { adminReply: replyDrafts[q._id] ?? q.adminReply ?? "" })}
                >
                  <Send size={13} className="mr-1" /> Reply
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
