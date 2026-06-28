"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Shield, X, UserPlus, Check } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PERMISSIONS, PERMISSION_LABELS } from "@/lib/constants/permissions";

interface Admin {
  _id: string;
  name?: string;
  email: string;
  photo?: string;
  role: "admin" | "super_admin";
  permissions: string[];
}

interface Player {
  _id: string;
  name?: string;
  email: string;
  photo?: string;
}

interface Props {
  admins: Admin[];
  players: Player[];
}

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export default function AdminsManager({ admins, players }: Props) {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const nonSuperAdmins = admins.filter((a) => a.role !== "super_admin");
  const superAdmins = admins.filter((a) => a.role === "super_admin");
  const nonAdminPlayers = players.filter((p) => !admins.some((a) => a._id === p._id));

  function togglePerm(perm: string, current: string[], setter: (p: string[]) => void) {
    if (current.includes(perm)) setter(current.filter((p) => p !== perm));
    else setter([...current, perm]);
  }

  async function addAdmin() {
    if (!selectedPlayer) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedPlayer}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin", permissions: newPerms }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Admin added!");
        setShowAddForm(false);
        setSelectedPlayer("");
        setNewPerms([]);
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to add admin");
      }
    } finally {
      setAdding(false);
    }
  }

  async function removeAdmin(adminId: string) {
    if (!confirm("Remove admin privileges from this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "player", permissions: [] }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Admin removed"); router.refresh(); }
      else toast.error(data.error ?? "Failed");
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function savePermissions(adminId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: editPerms }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Permissions updated!");
        setEditingId(null);
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Super admins */}
      <div className="game-card p-6">
        <h2 className="font-heading font-bold mb-4 flex items-center gap-2">
          <Shield size={18} className="text-[var(--primary)]" />
          Super Admin
        </h2>
        {superAdmins.map((admin) => (
          <div key={admin._id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--surface)] border border-[var(--border)] shrink-0 relative">
              {admin.photo ? (
                <Image src={admin.photo} alt={admin.name ?? ""} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs">{admin.name?.[0]}</div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{admin.name}</p>
              <p className="text-xs text-[var(--text-2)]">{admin.email}</p>
            </div>
            <Badge variant="primary" className="ml-auto">Full Access</Badge>
          </div>
        ))}
      </div>

      {/* Current admins */}
      <div className="game-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold">Admins ({nonSuperAdmins.length})</h2>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <UserPlus size={14} className="mr-1" /> Add Admin
          </Button>
        </div>

        {nonSuperAdmins.length === 0 ? (
          <p className="text-sm text-[var(--text-2)]">No other admins yet.</p>
        ) : (
          <div className="space-y-4">
            {nonSuperAdmins.map((admin) => (
              <div key={admin._id} className="p-4 rounded-xl bg-[var(--surface)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--card)] border border-[var(--border)] shrink-0 relative">
                    {admin.photo ? (
                      <Image src={admin.photo} alt={admin.name ?? ""} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">{admin.name?.[0]}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{admin.name}</p>
                    <p className="text-xs text-[var(--text-2)]">{admin.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingId(admin._id); setEditPerms(admin.permissions); }}
                      className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] hover:border-[var(--primary-dim)] transition-colors"
                    >
                      Edit Permissions
                    </button>
                    <button
                      onClick={() => removeAdmin(admin._id)}
                      className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Current permissions */}
                {editingId !== admin._id && (
                  <div className="flex flex-wrap gap-1">
                    {admin.permissions.length === 0 ? (
                      <span className="text-xs text-[var(--text-2)]">No permissions assigned</span>
                    ) : (
                      admin.permissions.map((p) => (
                        <Badge key={p} variant="blue" className="text-[10px]">
                          {PERMISSION_LABELS[p as keyof typeof PERMISSION_LABELS] ?? p}
                        </Badge>
                      ))
                    )}
                  </div>
                )}

                {/* Edit permissions */}
                {editingId === admin._id && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_PERMISSIONS.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editPerms.includes(perm)}
                            onChange={() => togglePerm(perm, editPerms, setEditPerms)}
                            className="accent-[var(--primary)]"
                          />
                          <span className="text-xs">{PERMISSION_LABELS[perm] ?? perm}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button size="sm" loading={saving} onClick={() => savePermissions(admin._id)}>
                        <Check size={13} className="mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add admin form */}
      {showAddForm && (
        <div className="game-card p-6 space-y-4">
          <h3 className="font-heading font-bold">Add New Admin</h3>
          <div>
            <label className="block text-sm text-[var(--text-2)] mb-1.5">Select Player</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
            >
              <option value="">Choose a player...</option>
              {nonAdminPlayers.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-2)] mb-2">Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPerms.includes(perm)}
                    onChange={() => togglePerm(perm, newPerms, setNewPerms)}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-xs">{PERMISSION_LABELS[perm] ?? perm}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button className="flex-1" loading={adding} disabled={!selectedPlayer} onClick={addAdmin}>
              Add Admin
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
