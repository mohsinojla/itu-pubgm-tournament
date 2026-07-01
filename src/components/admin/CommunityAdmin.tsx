"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Star, Users,
  Search, X, Check, Pencil,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

// ─── Types ───────────────────────────────────────────────
interface Event {
  _id: string;
  name: string;
  description?: string;
  order: number;
}

interface MemberUser {
  _id: string;
  name?: string;
  email: string;
  photo?: string;
  degreeProgramme?: string;
}

interface Member {
  _id: string;
  userId: MemberUser;
  eventId: string | null;
  communityRole: string;
  bio?: string;
  order: number;
  isHighlighted: boolean;
}

interface Props {
  initialEvents: Event[];
  initialMembers: Member[];
}

// ─── Root ─────────────────────────────────────────────────
export default function CommunityAdmin({ initialEvents, initialMembers }: Props) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>(
    [...initialEvents].sort((a, b) => a.order - b.order)
  );
  const [members, setMembers] = useState<Member[]>(initialMembers);

  const generalMembers = members.filter((m) => !m.eventId);

  // ── Reorder helpers ───────────────────────────────────
  async function moveEvent(idx: number, dir: -1 | 1) {
    const next = [...events];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    const reordered = next.map((e, i) => ({ ...e, order: i }));
    setEvents(reordered);

    await fetch("/api/admin/gallery-sections/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reordered.map((e) => ({ id: e._id, order: e.order }))),
    });
  }

  // ── Add member callback (shared) ─────────────────────
  const handleMemberAdded = useCallback((member: Member) => {
    setMembers((prev) => [...prev, member]);
  }, []);

  const handleMemberRemoved = useCallback((memberId: string) => {
    setMembers((prev) => prev.filter((m) => m._id !== memberId));
  }, []);

  return (
    <div className="space-y-10">
      {/* General / campus ambassador section */}
      <EventSection
        label="General Community"
        description="Campus ambassador and general organizing members (not tied to a specific event)"
        members={generalMembers}
        eventId={null}
        onMemberAdded={handleMemberAdded}
        onMemberRemoved={handleMemberRemoved}
        isFirst
        isLast
        canReorder={false}
      />

      {events.length === 0 && (
        <p className="text-sm text-[var(--text-2)] text-center py-8">
          No events yet. Create one in{" "}
          <a href="/admin/gallery" className="text-[var(--primary)] hover:underline">
            Gallery Management
          </a>
          .
        </p>
      )}

      {/* One card per event */}
      {events.map((event, idx) => {
        const eventMembers = members.filter((m) => m.eventId === event._id);
        return (
          <EventSection
            key={event._id}
            label={event.name}
            description={event.description}
            members={eventMembers}
            eventId={event._id}
            onMemberAdded={handleMemberAdded}
            onMemberRemoved={handleMemberRemoved}
            isFirst={idx === 0}
            isLast={idx === events.length - 1}
            canReorder
            onMoveUp={() => moveEvent(idx, -1)}
            onMoveDown={() => moveEvent(idx, 1)}
          />
        );
      })}
    </div>
  );
}

// ─── EventSection ─────────────────────────────────────────
function EventSection({
  label,
  description,
  members,
  eventId,
  onMemberAdded,
  onMemberRemoved,
  isFirst,
  isLast,
  canReorder,
  onMoveUp,
  onMoveDown,
}: {
  label: string;
  description?: string;
  members: Member[];
  eventId: string | null;
  onMemberAdded: (m: Member) => void;
  onMemberRemoved: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  canReorder: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="w-1 h-6 rounded-full bg-[var(--primary)] shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg">{label}</h3>
          {description && <p className="text-xs text-[var(--text-2)] mt-0.5">{description}</p>}
        </div>
        <span className="text-xs text-[var(--text-2)] shrink-0">{members.length} members</span>

        {/* Reorder buttons */}
        {canReorder && (
          <div className="flex gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              title="Move up"
              className="p-1.5 rounded-lg text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 disabled:opacity-30 transition-colors"
            >
              <ChevronUp size={15} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              title="Move down"
              className="p-1.5 rounded-lg text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 disabled:opacity-30 transition-colors"
            >
              <ChevronDown size={15} />
            </button>
          </div>
        )}

        <button
          onClick={() => setShowAdd((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors ${showAdd ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"}`}
          title="Add member"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Add member panel */}
      {showAdd && (
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--card)]/30">
          <AddMemberForm
            eventId={eventId}
            existingUserIds={members.map((m) => m.userId._id)}
            onAdded={(m) => { onMemberAdded(m); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {/* Members list */}
      <div className="p-5">
        {members.length === 0 ? (
          <p className="text-sm text-[var(--text-2)] text-center py-6">
            No members yet. Click <Plus size={12} className="inline" /> to add someone.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <MemberRow key={m._id} member={m} onRemoved={onMemberRemoved} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MemberRow ────────────────────────────────────────────
function MemberRow({ member, onRemoved }: { member: Member; onRemoved: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(member.communityRole);
  const [highlighted, setHighlighted] = useState(member.isHighlighted);
  const [saving, setSaving] = useState(false);

  async function saveEdits() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/event-community/${member._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityRole: role, isHighlighted: highlighted }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Updated"); setEditing(false); }
      else toast.error(data.error ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${member.userId.name ?? "this member"} from this section?`)) return;
    const res = await fetch(`/api/admin/event-community/${member._id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Removed"); onRemoved(member._id); }
    else toast.error(data.error ?? "Failed");
  }

  const u = member.userId;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/20 transition-colors group">
      <Avatar src={u.photo} name={u.name ?? u.email} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate">{u.name ?? u.email}</span>
          {member.isHighlighted && (
            <Star size={11} className="text-[var(--primary)] shrink-0" fill="currentColor" />
          )}
        </div>
        {editing ? (
          <input
            autoFocus
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full px-2 py-1 text-xs rounded-lg border border-[var(--primary)] bg-[var(--surface)] focus:outline-none"
          />
        ) : (
          <p className="text-xs text-[var(--primary)] mt-0.5 truncate">{member.communityRole}</p>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-1 shrink-0">
          <label className="flex items-center gap-1 text-xs text-[var(--text-2)] cursor-pointer">
            <input
              type="checkbox"
              checked={highlighted}
              onChange={(e) => setHighlighted(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Ambassador
          </label>
          <button onClick={saveEdits} disabled={saving} className="p-1.5 text-[var(--success)] hover:bg-[var(--success)]/10 rounded-lg">
            <Check size={13} />
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 text-[var(--text-2)] hover:bg-[var(--surface)] rounded-lg">
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1.5 text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg">
            <Pencil size={13} />
          </button>
          <button onClick={remove} className="p-1.5 text-[var(--text-2)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AddMemberForm ────────────────────────────────────────
function AddMemberForm({
  eventId,
  existingUserIds,
  onAdded,
  onCancel,
}: {
  eventId: string | null;
  existingUserIds: string[];
  onAdded: (m: Member) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberUser[]>([]);
  const [selected, setSelected] = useState<MemberUser | null>(null);
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.users.filter((u: MemberUser) => !existingUserIds.includes(u._id)));
      }
    } finally {
      setSearching(false);
    }
  }, [existingUserIds]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  async function add() {
    if (!selected || !role.trim()) { toast.error("Select a person and enter their role"); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/event-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected._id,
          eventId: eventId ?? undefined,
          communityRole: role.trim(),
          bio: bio.trim() || undefined,
          isHighlighted,
        }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Added!"); onAdded(data.member); }
      else toast.error(data.error ?? "Failed to add member");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-3 max-w-lg">
      <p className="text-sm font-medium text-[var(--text-1)]">Add a member</p>

      {selected ? (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5">
          <Avatar src={selected.photo} name={selected.name ?? selected.email} size="xs" />
          <span className="text-sm flex-1 truncate">{selected.name ?? selected.email}</span>
          <button onClick={() => setSelected(null)} className="text-[var(--text-2)] hover:text-[var(--danger)]">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
          {(results.length > 0 || searching) && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              {searching && <p className="text-xs text-[var(--text-2)] px-3 py-2">Searching…</p>}
              {results.map((u) => (
                <button
                  key={u._id}
                  onClick={() => { setSelected(u); setResults([]); setQuery(""); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface)] transition-colors text-left"
                >
                  <Avatar src={u.photo} name={u.name ?? u.email} size="xs" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.name ?? "—"}</p>
                    <p className="text-xs text-[var(--text-2)] truncate">{u.email}</p>
                  </div>
                </button>
              ))}
              {!searching && results.length === 0 && query.length >= 2 && (
                <p className="text-xs text-[var(--text-2)] px-3 py-2">No matching users found</p>
              )}
            </div>
          )}
        </div>
      )}

      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Community role (e.g. Organizer, Co-host)"
        className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--primary)] transition-colors"
      />

      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Short bio (optional)"
        rows={2}
        className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
      />

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={isHighlighted}
          onChange={(e) => setIsHighlighted(e.target.checked)}
          className="accent-[var(--primary)]"
        />
        <Star size={13} className="text-[var(--primary)]" />
        Mark as Campus Ambassador (featured hero card)
      </label>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" loading={adding} disabled={!selected || !role.trim()} onClick={add}>
          Add Member
        </Button>
      </div>
    </div>
  );
}
