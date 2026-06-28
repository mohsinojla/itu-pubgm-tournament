"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { UserPlus, Star, X, Edit2, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface UserRef {
  _id: string;
  name?: string;
  email: string;
  photo?: string;
  degreeProgramme?: string;
}

interface Member {
  _id: string;
  userId: UserRef;
  communityRole: string;
  bio?: string;
  order: number;
  isHighlighted: boolean;
}

interface Props {
  members: Member[];
  availableUsers: UserRef[];
}

export default function CommunityMembersManager({ members: init, availableUsers: initUsers }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(init);
  const [available, setAvailable] = useState(initUsers);
  const [showAdd, setShowAdd] = useState(false);

  // Add form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newOrder, setNewOrder] = useState(0);
  const [newHighlighted, setNewHighlighted] = useState(false);
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editOrder, setEditOrder] = useState(0);
  const [editHighlighted, setEditHighlighted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function addMember() {
    if (!selectedUserId || !newRole.trim()) {
      toast.error("Select a user and enter a role title");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/community-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          communityRole: newRole,
          bio: newBio,
          order: newOrder,
          isHighlighted: newHighlighted,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Community member added!");
        setMembers((prev) => [...prev, data.member]);
        setAvailable((prev) => prev.filter((u) => u._id !== selectedUserId));
        setShowAdd(false);
        setSelectedUserId(""); setNewRole(""); setNewBio(""); setNewOrder(0); setNewHighlighted(false);
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to add");
      }
    } finally {
      setAdding(false);
    }
  }

  function startEdit(m: Member) {
    setEditingId(m._id);
    setEditRole(m.communityRole);
    setEditBio(m.bio ?? "");
    setEditOrder(m.order);
    setEditHighlighted(m.isHighlighted);
  }

  async function saveEdit(memberId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/community-members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityRole: editRole, bio: editBio, order: editOrder, isHighlighted: editHighlighted }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Updated!");
        setMembers((prev) => prev.map((m) => m._id === memberId ? data.member : m));
        setEditingId(null);
      } else {
        toast.error(data.error ?? "Failed");
      }
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(memberId: string, userId: UserRef) {
    if (!confirm(`Remove ${userId.name ?? userId.email} from community?`)) return;
    try {
      const res = await fetch(`/api/admin/community-members/${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Removed");
        setMembers((prev) => prev.filter((m) => m._id !== memberId));
        setAvailable((prev) => [...prev, userId].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")));
      } else {
        toast.error(data.error ?? "Failed");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  const highlighted = members.filter((m) => m.isHighlighted);
  const regular = members.filter((m) => !m.isHighlighted);

  return (
    <div className="space-y-6">
      {/* Highlighted members */}
      {highlighted.length > 0 && (
        <div className="game-card p-6">
          <h2 className="font-heading font-bold mb-4 flex items-center gap-2 text-[var(--primary)]">
            <Star size={16} /> Featured Members
          </h2>
          <div className="space-y-3">
            {highlighted.map((m) => <MemberRow key={m._id} member={m} onEdit={() => startEdit(m)} onRemove={() => removeMember(m._id, m.userId)} isEditing={editingId === m._id} editRole={editRole} editBio={editBio} editOrder={editOrder} editHighlighted={editHighlighted} setEditRole={setEditRole} setEditBio={setEditBio} setEditOrder={setEditOrder} setEditHighlighted={setEditHighlighted} onSave={() => saveEdit(m._id)} onCancel={() => setEditingId(null)} saving={saving} />)}
          </div>
        </div>
      )}

      {/* Regular members */}
      <div className="game-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold">Community Members ({regular.length})</h2>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <UserPlus size={14} className="mr-1" /> Add Member
          </Button>
        </div>

        {regular.length === 0 && !showAdd ? (
          <p className="text-sm text-[var(--text-2)]">No community members yet. Add registered users to display them on the Community page.</p>
        ) : (
          <div className="space-y-3">
            {regular.map((m) => (
              <MemberRow key={m._id} member={m} onEdit={() => startEdit(m)} onRemove={() => removeMember(m._id, m.userId)} isEditing={editingId === m._id} editRole={editRole} editBio={editBio} editOrder={editOrder} editHighlighted={editHighlighted} setEditRole={setEditRole} setEditBio={setEditBio} setEditOrder={setEditOrder} setEditHighlighted={setEditHighlighted} onSave={() => saveEdit(m._id)} onCancel={() => setEditingId(null)} saving={saving} />
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="game-card p-6 space-y-4">
          <h3 className="font-heading font-bold">Add Community Member</h3>

          <div>
            <label className="block text-sm text-[var(--text-2)] mb-1.5">Select Registered User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
            >
              <option value="">Choose a registered player...</option>
              {available.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name ?? "(no name)"} — {u.email}
                </option>
              ))}
            </select>
          </div>

          <Input label="Role / Title" placeholder="e.g. Co-Organizer, Technical Lead, Media" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
          <div>
            <label className="block text-sm text-[var(--text-2)] mb-1.5">Bio (optional)</label>
            <textarea
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              rows={2}
              maxLength={400}
              placeholder="Short description shown on Community page..."
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm resize-none focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--text-2)]">Display Order</label>
              <input type="number" min={0} value={newOrder} onChange={(e) => setNewOrder(Number(e.target.value))} className="w-16 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-center focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newHighlighted} onChange={(e) => setNewHighlighted(e.target.checked)} className="accent-[var(--primary)]" />
              <span className="text-sm text-[var(--text-2)]">Feature at top (highlighted)</span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="flex-1" loading={adding} disabled={!selectedUserId || !newRole.trim()} onClick={addMember}>
              Add to Community
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member, onEdit, onRemove, isEditing,
  editRole, editBio, editOrder, editHighlighted,
  setEditRole, setEditBio, setEditOrder, setEditHighlighted,
  onSave, onCancel, saving,
}: {
  member: Member;
  onEdit: () => void;
  onRemove: () => void;
  isEditing: boolean;
  editRole: string; editBio: string; editOrder: number; editHighlighted: boolean;
  setEditRole: (v: string) => void;
  setEditBio: (v: string) => void;
  setEditOrder: (v: number) => void;
  setEditHighlighted: (v: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const u = member.userId;
  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--card)] border border-[var(--border)] shrink-0 relative">
          {u.photo ? (
            <Image src={u.photo} alt={u.name ?? ""} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--primary)]">
              {(u.name ?? u.email)[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{u.name ?? "(no name)"}</p>
          <p className="text-xs text-[var(--text-2)] truncate">{u.email}</p>
        </div>
        {!isEditing && (
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] hover:border-[var(--primary-dim)] transition-colors">
              <Edit2 size={12} />
            </button>
            <button onClick={onRemove} className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div>
          <p className="text-xs text-[var(--primary)] font-semibold">{member.communityRole}</p>
          {member.bio && <p className="text-xs text-[var(--text-2)] mt-0.5">{member.bio}</p>}
          <p className="text-[10px] text-[var(--text-2)] mt-1">Order: {member.order}{member.isHighlighted ? " · Featured" : ""}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <input value={editRole} onChange={(e) => setEditRole(e.target.value)} placeholder="Role title" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:border-[var(--primary)]" />
          <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} maxLength={400} placeholder="Bio (optional)" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm resize-none focus:outline-none focus:border-[var(--primary)]" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-2)]">Order</span>
              <input type="number" min={0} value={editOrder} onChange={(e) => setEditOrder(Number(e.target.value))} className="w-14 px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-center focus:outline-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editHighlighted} onChange={(e) => setEditHighlighted(e.target.checked)} className="accent-[var(--primary)]" />
              <span className="text-xs text-[var(--text-2)]">Featured</span>
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={onSave}><Check size={13} className="mr-1" /> Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}
