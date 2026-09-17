"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageCircleQuestion, Send, Clock, Loader2, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

export interface QueryItem {
  _id: string;
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved";
  adminReply?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", variant: "warning" as const, icon: Clock },
  in_progress: { label: "In Progress", variant: "blue" as const, icon: Loader2 },
  resolved: { label: "Resolved", variant: "success" as const, icon: CheckCircle2 },
};

export default function QueryPanel({ initialQueries }: { initialQueries: QueryItem[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Query submitted! We'll get back to you soon.");
        setSubject("");
        setMessage("");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to submit query");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Submit form */}
      <form onSubmit={submit} className="game-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircleQuestion size={18} className="text-[var(--primary)]" />
          <h2 className="font-heading font-bold">Ask a Question</h2>
        </div>
        <Input
          label="Subject"
          placeholder="e.g. Team registration issue"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={150}
          required
        />
        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Message <span className="text-[var(--danger)]">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            required
            placeholder="Describe your question, concern, or feedback in detail..."
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] placeholder:text-[var(--text-2)]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm resize-y"
          />
        </div>
        <Button type="submit" loading={submitting} className="w-full sm:w-auto">
          <Send size={14} className="mr-1.5" /> Submit Query
        </Button>
      </form>

      {/* Own queries */}
      <div>
        <h2 className="font-heading font-bold text-lg mb-4">Your Queries</h2>
        {initialQueries.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-2)] text-sm border border-dashed border-[var(--border)] rounded-2xl">
            You haven&apos;t submitted any queries yet.
          </div>
        ) : (
          <div className="stagger-fade space-y-3">
            {initialQueries.map((q) => {
              const status = STATUS_CONFIG[q.status];
              const StatusIcon = status.icon;
              return (
                <div key={q._id} className="game-card p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <h3 className="font-heading font-bold text-[var(--text-1)]">{q.subject}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant} className="flex items-center gap-1">
                        <StatusIcon size={11} className={q.status === "in_progress" ? "animate-spin" : ""} />
                        {status.label}
                      </Badge>
                      <span className="text-xs text-[var(--text-2)] whitespace-nowrap">
                        {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap">{q.message}</p>
                  {q.adminReply && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <p className="text-xs font-semibold text-[var(--primary)] mb-1">Admin Reply</p>
                      <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap">{q.adminReply}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
