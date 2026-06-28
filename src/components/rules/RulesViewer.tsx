"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Edit2, BookOpen, Save, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface Props {
  content: string | null;
  canEdit: boolean;
}

export default function RulesViewer({ content, canEdit }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Rules updated!");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(data.error ?? "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!content && !canEdit) {
    return (
      <div className="text-center py-20 text-[var(--text-2)]">
        <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
        <p>Rules will be published soon. Stay tuned!</p>
      </div>
    );
  }

  return (
    <div className="game-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-[var(--primary)]" />
          <h2 className="font-heading font-bold">Tournament Rules</h2>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditContent(content ?? ""); }}>
                  <X size={13} className="mr-1" /> Cancel
                </Button>
                <Button size="sm" loading={saving} onClick={save}>
                  <Save size={13} className="mr-1" /> Save
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Edit2 size={13} className="mr-1" /> Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-2)]">Enter rules content (HTML is supported):</p>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors resize-y"
            placeholder="Enter tournament rules here... HTML is supported."
          />
        </div>
      ) : content ? (
        <div
          className="prose prose-invert prose-sm max-w-none text-[var(--text-2)] [&_h1]:text-[var(--text-1)] [&_h2]:text-[var(--primary)] [&_h3]:text-[var(--text-1)] [&_strong]:text-[var(--text-1)] [&_li]:marker:text-[var(--primary)]"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="text-center py-10 text-[var(--text-2)]">
          <p>No rules published yet. Click &ldquo;Edit&rdquo; to add rules.</p>
        </div>
      )}
    </div>
  );
}
