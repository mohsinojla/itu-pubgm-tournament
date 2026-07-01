"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Star, Search, X, Check, Pencil,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function CommunityAdmin({ initialEvents, initialMembers }: Props) {
  const [events, setEvents] = useState<Event[]>(
    [...initialEvents].sort((a, b) => a.order - b.order)
  );
  const [members, setMembers] = useState<Member[]>(initialMembers);

  const generalMembers = members.filter((m) => !m.eventId);

  // ── Event reorder ──────────────────────────────────────────────────────────
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

  // ── Member reorder within an event ────────────────────────────────────────
  const handleMembersReorder = useCallback(
    (memberAId: string, newOrderA: number, memberBId: string, newOrderB: number) => {
      setMembers((prev) =>
        prev.map((m) => {
          if (m._id === memberAId) return { ...m, order: newOrderA };
          if (m._id === memberBId) return { ...m, order: newOrderB };
          return m;
        })
      );
      Promise.all([
        fetch(`/api/admin/event-community/${memberAId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrderA }),
        }),
        fetch(`/api/admin/event-community/${memberBId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrderB }),
        }),
      ]).catch(() => toast.error("Reorder save failed"));
    },
    []
  );

  // ── Member CRUD callbacks ──────────────────────────────────────────────────
  const handleMemberAdded = useCallback((member: Member) => {
    setMembers((prev) => [...prev, member]);
  }, []);

  const handleMemberUpdated = useCallback((updated: Member) => {
    setMembers((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
  }, []);

  const handleMemberRemoved = useCallback((memberId: string) => {
    setMembers((prev) => prev.filter((m) => m._id !== memberId));
  }, []);

  return (
    <div className="space-y-10">
      {/* General / campus ambassador section */}
      <EventSection
        label="General Community"
        description="Campus ambassador and general organizing members not tied to a specific event"
        members={generalMembers}
        eventId={null}
        showHighlighted
        canReorder={false}
        isFirst
        isLast
        onMemberAdded={handleMemberAdded}
        onMemberUpdated={handleMemberUpdated}
        onMemberRemoved={handleMemberRemoved}
        onMembersReorder={handleMembersReorder}
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

      {events.map((event, idx) => {
        const eventMembers = members.filter((m) => m.eventId === event._id);
        return (
          <EventSection
            key={event._id}
            label={event.name}
            description={event.description}
            members={eventMembers}
            eventId={event._id}
            showHighlighted={false}
            canReorder
            isFirst={idx === 0}
            isLast={idx === events.length - 1}
            onMoveUp={() => moveEvent(idx, -1)}
            onMoveDown={() => moveEvent(idx, 1)}
            onMemberAdded={handleMemberAdded}
            onMemberUpdated={handleMemberUpdated}
            onMemberRemoved={handleMemberRemoved}
            onMembersReorder={handleMembersReorder}
          />
        );
      })}
    </div>
  );
}

// ─── EventSection ─────────────────────────────────────────────────────────────

function EventSection({
  label,
  description,
  members,
  eventId,
  showHighlighted,
  canReorder,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onMemberAdded,
  onMemberUpdated,
  onMemberRemoved,
  onMembersReorder,
}: {
  label: string;
  description?: string;
  members: Member[];
  eventId: string | null;
  showHighlighted: boolean;
  canReorder: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMemberAdded: (m: Member) => void;
  onMemberUpdated: (m: Member) => void;
  onMemberRemoved: (id: string) => void;
  onMembersReorder: (aId: string, orderA: number, bId: string, orderB: number) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  // Sort by order then creation time
  const sorted = [...members].sort((a, b) => a.order - b.order || 0);

  function moveMember(idx: number, dir: -1 | 1) {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    // Swap their order values
    onMembersReorder(a._id, b.order, b._id, a.order);
  }

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

        {canReorder && (
          <div className="flex gap-0.5">
            <button onClick={onMoveUp} disabled={isFirst} title="Move section up"
              className="p-1.5 rounded-lg text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 disabled:opacity-30 transition-colors">
              <ChevronUp size={15} />
            </button>
            <button onClick={onMoveDown} disabled={isLast} title="Move section down"
              className="p-1.5 rounded-lg text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 disabled:opacity-30 transition-colors">
              <ChevronDown size={15} />
            </button>
          </div>
        )}

        <button onClick={() => setShowAdd((v) => !v)} title="Add member"
          className={`p-1.5 rounded-lg transition-colors ${showAdd
            ? "text-[var(--primary)] bg-[var(--primary)]/10"
            : "text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"}`}>
          <Plus size={15} />
        </button>
      </div>

      {/* Add member panel */}
      {showAdd && (
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--card)]/30">
          <AddMemberForm
            eventId={eventId}
            showHighlighted={showHighlighted}
            existingUserIds={members.map((m) => m.userId._id)}
            onAdded={(m) => { onMemberAdded(m); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {/* Members grid */}
      <div className="p-5">
        {sorted.length === 0 ? (
          <p className="text-sm text-[var(--text-2)] text-center py-6">
            No members yet. Click <Plus size={12} className="inline" /> to add someone.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((m, idx) => (
              <MemberCard
                key={m._id}
                member={m}
                showHighlighted={showHighlighted}
                isFirst={idx === 0}
                isLast={idx === sorted.length - 1}
                onMoveUp={() => moveMember(idx, -1)}
                onMoveDown={() => moveMember(idx, 1)}
                onUpdated={onMemberUpdated}
                onRemoved={onMemberRemoved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MemberCard (admin editable) ──────────────────────────────────────────────

function MemberCard({
  member,
  showHighlighted,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onUpdated,
  onRemoved,
}: {
  member: Member;
  showHighlighted: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdated: (m: Member) => void;
  onRemoved: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(member.communityRole);
  const [bio, setBio] = useState(member.bio ?? "");
  const [highlighted, setHighlighted] = useState(member.isHighlighted);
  const [saving, setSaving] = useState(false);
  const u = member.userId;

  // Keep local state in sync if parent refreshes
  useEffect(() => {
    if (!editing) {
      setRole(member.communityRole);
      setBio(member.bio ?? "");
      setHighlighted(member.isHighlighted);
    }
  }, [member, editing]);

  async function saveEdits() {
    if (!role.trim()) { toast.error("Role is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/event-community/${member._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityRole: role.trim(),
          bio: bio.trim() || undefined,
          isHighlighted: highlighted,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Saved");
        onUpdated({ ...member, communityRole: role.trim(), bio: bio.trim() || undefined, isHighlighted: highlighted });
        setEditing(false);
      } else {
        toast.error(data.error ?? "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${u.name ?? "this member"}?`)) return;
    const res = await fetch(`/api/admin/event-community/${member._id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Removed"); onRemoved(member._id); }
    else toast.error(data.error ?? "Failed to remove");
  }

  return (
    <div className="relative rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/30 bg-[var(--card)] transition-colors flex flex-col overflow-hidden">
      {/* Order controls — top-left */}
      <div className="absolute top-2 left-2 flex flex-col gap-0.5 z-10">
        <button onClick={onMoveUp} disabled={isFirst} title="Move up"
          className="p-1 rounded-lg bg-[var(--surface)]/80 text-[var(--text-2)] hover:text-[var(--primary)] disabled:opacity-25 transition-colors backdrop-blur-sm">
          <ChevronUp size={13} />
        </button>
        <button onClick={onMoveDown} disabled={isLast} title="Move down"
          className="p-1 rounded-lg bg-[var(--surface)]/80 text-[var(--text-2)] hover:text-[var(--primary)] disabled:opacity-25 transition-colors backdrop-blur-sm">
          <ChevronDown size={13} />
        </button>
      </div>

      {/* Action controls — top-right */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {!editing && (
          <>
            <button onClick={() => setEditing(true)} title="Edit"
              className="p-1.5 rounded-lg bg-[var(--surface)]/80 text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors backdrop-blur-sm">
              <Pencil size={13} />
            </button>
            <button onClick={remove} title="Remove"
              className="p-1.5 rounded-lg bg-[var(--surface)]/80 text-[var(--text-2)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors backdrop-blur-sm">
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col items-center text-center gap-3 flex-1">
        {/* Avatar */}
        <div className="relative w-20 h-20 rounded-full border-2 border-[var(--primary)] ring-4 ring-[var(--primary)]/10 overflow-hidden bg-[var(--surface)] flex items-center justify-center mt-4 shrink-0">
          {u.photo ? (
            <Image src={u.photo} alt={u.name ?? "Member"} fill className="object-cover" />
          ) : (
            <span className="font-heading text-2xl font-bold text-[var(--primary)]">
              {(u.name ?? u.email)[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Name */}
        <div className="w-full">
          <p className="font-heading text-sm font-bold truncate">{u.name ?? "—"}</p>
          {u.degreeProgramme && (
            <p className="text-[var(--text-2)] text-xs mt-0.5 truncate">{u.degreeProgramme}</p>
          )}
        </div>

        {/* Editable fields */}
        {editing ? (
          <div className="w-full space-y-2">
            <input
              autoFocus
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role (e.g. Organizer)"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--primary)] bg-[var(--surface)] focus:outline-none text-center"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio (optional)"
              rows={3}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--primary)] resize-none text-left"
            />
            {showHighlighted && (
              <label className="flex items-center justify-center gap-1.5 text-xs cursor-pointer text-[var(--text-2)]">
                <input
                  type="checkbox"
                  checked={highlighted}
                  onChange={(e) => setHighlighted(e.target.checked)}
                  className="accent-[var(--primary)]"
                />
                <Star size={11} className="text-[var(--primary)]" />
                Mark as Campus Ambassador
              </label>
            )}
            <div className="flex gap-2 justify-center">
              <button onClick={() => { setEditing(false); setRole(member.communityRole); setBio(member.bio ?? ""); setHighlighted(member.isHighlighted); }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">
                <X size={12} /> Cancel
              </button>
              <button onClick={saveEdits} disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--primary)] text-black font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                <Check size={12} /> {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-1">
            <p className="text-[var(--primary)] text-xs font-semibold flex items-center justify-center gap-1">
              {member.isHighlighted && <Star size={10} fill="currentColor" />}
              {member.communityRole}
            </p>
            {member.bio && (
              <p className="text-[var(--text-2)] text-xs leading-relaxed line-clamp-3">{member.bio}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AddMemberForm ─────────────────────────────────────────────────────────────

function AddMemberForm({
  eventId,
  showHighlighted,
  existingUserIds,
  onAdded,
  onCancel,
}: {
  eventId: string | null;
  showHighlighted: boolean;
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
          isHighlighted: showHighlighted ? isHighlighted : false,
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
                <button key={u._id} onClick={() => { setSelected(u); setResults([]); setQuery(""); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface)] transition-colors text-left">
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
        placeholder="Role (e.g. Organizer, Co-host, Player)"
        className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--primary)] transition-colors"
      />

      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Short bio (optional)"
        rows={2}
        className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
      />

      {showHighlighted && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isHighlighted} onChange={(e) => setIsHighlighted(e.target.checked)}
            className="accent-[var(--primary)]" />
          <Star size={13} className="text-[var(--primary)]" />
          Mark as Campus Ambassador (featured hero card)
        </label>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" loading={adding} disabled={!selected || !role.trim()} onClick={add}>
          Add Member
        </Button>
      </div>
    </div>
  );
}
