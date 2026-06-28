"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Pin, Megaphone, AlertTriangle, Calendar, Trophy } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";

interface Announcement {
  _id: string;
  title: string;
  body: string;
  isPinned: boolean;
  category: "general" | "match" | "result" | "urgent";
  postedBy?: { name?: string; photo?: string };
  createdAt: string;
}

const CATEGORY_ICON = {
  general: Megaphone,
  match: Calendar,
  result: Trophy,
  urgent: AlertTriangle,
};

const CATEGORY_COLOR = {
  general: "default" as const,
  match: "blue" as const,
  result: "success" as const,
  urgent: "danger" as const,
};

export default function AnnouncementFeed({
  initialAnnouncements,
}: {
  initialAnnouncements: Announcement[];
}) {
  const [announcements] = useState(initialAnnouncements);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (announcements.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--text-2)]">
        <Megaphone size={40} className="mx-auto mb-4 opacity-30" />
        <p>No announcements yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((ann) => {
        const Icon = CATEGORY_ICON[ann.category];
        const isExpanded = expanded === ann._id;

        return (
          <div
            key={ann._id}
            className={`game-card p-5 ${ann.isPinned ? "border-[var(--primary-dim)]" : ""} ${
              ann.category === "urgent" ? "border-[var(--danger)]/40" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  ann.category === "urgent"
                    ? "bg-[var(--danger)]/10"
                    : "bg-[var(--primary)]/10"
                }`}
              >
                <Icon
                  size={18}
                  className={
                    ann.category === "urgent"
                      ? "text-[var(--danger)]"
                      : "text-[var(--primary)]"
                  }
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {ann.isPinned && (
                      <Pin size={12} className="text-[var(--primary)]" />
                    )}
                    <h3 className="font-heading font-bold text-[var(--text-1)]">
                      {ann.title}
                    </h3>
                    <Badge variant={CATEGORY_COLOR[ann.category]} className="text-[10px]">
                      {ann.category}
                    </Badge>
                  </div>
                  <span className="text-xs text-[var(--text-2)] whitespace-nowrap">
                    {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Body */}
                <div
                  className={`text-sm text-[var(--text-2)] overflow-hidden transition-all ${
                    isExpanded ? "" : "line-clamp-2"
                  }`}
                  dangerouslySetInnerHTML={{ __html: ann.body }}
                />
                {ann.body.length > 200 && (
                  <button
                    onClick={() => setExpanded(isExpanded ? null : ann._id)}
                    className="text-xs text-[var(--primary)] hover:underline mt-1"
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </button>
                )}

                {/* Posted by */}
                {ann.postedBy && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Avatar src={ann.postedBy.photo} name={ann.postedBy.name} size="xs" />
                    <span className="text-xs text-[var(--text-2)]">
                      {ann.postedBy.name ?? "Admin"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
