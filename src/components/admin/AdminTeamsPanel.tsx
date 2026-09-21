"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Trash2, Search, Shield, Pencil, Check, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

interface TeamMember {
  userId: { _id: string; name: string; photo?: string };
  role: "core" | "substitute";
}

interface Team {
  _id: string;
  name: string;
  teamId: string;
  logo?: string;
  isRegistered: boolean;
  members: TeamMember[];
  leaderId: { _id: string; name: string; photo?: string };
  totalKills: number;
  totalPoints: number;
  matchesPlayed: number;
  wins: number;
  createdAt: string;
}

export interface AvailablePlayer {
  _id: string;
  name?: string;
  email: string;
  rollNumber?: string;
}

export default function AdminTeamsPanel({
  initialTeams,
  isSuperAdmin,
  availablePlayers = [],
}: {
  initialTeams: Team[];
  isSuperAdmin?: boolean;
  availablePlayers?: AvailablePlayer[];
}) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLeaderId, setNewLeaderId] = useState("");
  const [creating, setCreating] = useState(false);

  async function createTeam() {
    const name = newName.trim();
    if (name.length < 2 || name.length > 24) {
      toast.error("Team name must be 2-24 characters");
      return;
    }
    if (!newLeaderId) {
      toast.error("Pick a team leader");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, leaderId: newLeaderId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Team "${name}" created`);
        setNewName("");
        setNewLeaderId("");
        setShowCreate(false);
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to create team");
      }
    } finally {
      setCreating(false);
    }
  }
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.teamId.includes(search)
  );

  async function toggleRegistered(teamId: string, current: boolean) {
    setLoadingId(teamId);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRegistered: !current }),
      });
      if (!res.ok) throw new Error();
      setTeams((prev) =>
        prev.map((t) => (t._id === teamId ? { ...t, isRegistered: !current } : t))
      );
      toast.success(!current ? "Team registered" : "Team unregistered");
    } catch {
      toast.error("Failed to update team");
    } finally {
      setLoadingId(null);
    }
  }

  async function renameTeam(teamId: string) {
    const trimmed = renameValue.trim();
    if (trimmed.length < 2 || trimmed.length > 24) {
      toast.error("Team name must be 2-24 characters");
      return;
    }
    setLoadingId(teamId);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        setTeams((prev) => prev.map((t) => (t._id === teamId ? { ...t, name: trimmed } : t)));
        toast.success("Team renamed");
        setRenamingId(null);
      } else {
        toast.error(data.error ?? "Rename failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteTeam(teamId: string, name: string) {
    if (!confirm(`Delete team "${name}"? This will remove all members from the team.`)) return;
    setLoadingId(teamId);
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTeams((prev) => prev.filter((t) => t._id !== teamId));
      toast.success("Team deleted");
    } catch {
      toast.error("Failed to delete team");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
          <input
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-[var(--text-2)]">{teams.length} teams</span>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--primary)] text-black text-sm font-semibold hover:bg-[var(--primary-dim)] transition-colors"
        >
          <Plus size={14} /> Create team
        </button>
      </div>

      {showCreate && (
        <div className="game-card p-5 space-y-3 max-w-xl border border-[var(--primary)]/20">
          <h3 className="font-heading font-bold">Create a team</h3>
          <p className="text-xs text-[var(--text-2)]">
            Choose a name and a leader (a player who isn&apos;t on a team yet). Add more players from the Players page.
          </p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Team name (2-24 characters)"
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
          <select
            value={newLeaderId}
            onChange={(e) => setNewLeaderId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
          >
            <option value="">Select team leader…</option>
            {availablePlayers.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name ?? p.email}
                {p.rollNumber ? ` — ${p.rollNumber}` : ""}
              </option>
            ))}
          </select>
          {availablePlayers.length === 0 && (
            <p className="text-xs text-[var(--warning)]">Every registered player is already on a team.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createTeam}
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-[var(--primary)] text-black text-sm font-semibold hover:bg-[var(--primary-dim)] disabled:opacity-60 transition-colors"
            >
              {creating ? "Creating…" : "Create team"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--text-2)]">Team</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-2)]">Leader</th>
              <th className="text-center px-4 py-3 font-medium text-[var(--text-2)]">Members</th>
              <th className="text-center px-4 py-3 font-medium text-[var(--text-2)]">Stats</th>
              <th className="text-center px-4 py-3 font-medium text-[var(--text-2)]">Status</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--text-2)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((team) => (
              <tr
                key={team._id}
                className="group border-b border-[var(--border)] hover:bg-[var(--surface)]/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={team.logo}
                      name={team.name}
                      size="sm"
                      className="rounded-lg"
                    />
                    <div className="min-w-0">
                      {renamingId === team._id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") renameTeam(team._id); if (e.key === "Escape") setRenamingId(null); }}
                            className="px-2 py-1 text-sm rounded-lg border border-[var(--primary)] bg-[var(--surface)] focus:outline-none w-32"
                          />
                          <button onClick={() => renameTeam(team._id)} className="p-1 text-[var(--success)]"><Check size={13} /></button>
                          <button onClick={() => setRenamingId(null)} className="p-1 text-[var(--text-2)]"><X size={13} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <div className="font-medium truncate max-w-[120px]">{team.name}</div>
                          {isSuperAdmin && (
                            <button onClick={() => { setRenamingId(team._id); setRenameValue(team.name); }} className="p-0.5 text-[var(--text-2)] hover:text-[var(--primary)] transition-colors opacity-0 group-hover:opacity-100">
                              <Pencil size={11} />
                            </button>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-[var(--text-2)] font-mono">#{team.teamId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={team.leaderId.photo} name={team.leaderId.name} size="xs" />
                    <span className="text-xs">{team.leaderId.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users size={14} className="text-[var(--text-2)]" />
                    <span>{team.members.length}/5</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="text-xs text-[var(--text-2)] space-y-0.5">
                    <div>{team.totalKills} kills</div>
                    <div>{team.matchesPlayed} matches</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleRegistered(team._id, team.isRegistered)}
                    disabled={loadingId === team._id}
                    className="cursor-pointer"
                  >
                    <Badge variant={team.isRegistered ? "success" : "default"}>
                      {team.isRegistered ? "Registered" : "Unregistered"}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {loadingId === team._id ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      <>
                        <button
                          onClick={() => toggleRegistered(team._id, team.isRegistered)}
                          title={team.isRegistered ? "Unregister team" : "Register team"}
                          className="p-1.5 rounded-lg hover:bg-[var(--primary)]/10 text-[var(--primary)] transition-colors"
                        >
                          <Shield size={15} />
                        </button>
                        <button
                          onClick={() => deleteTeam(team._id, team.name)}
                          title="Delete team"
                          className="p-1.5 rounded-lg hover:bg-[var(--danger)]/10 text-[var(--danger)] transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[var(--text-2)]">
                  No teams found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
