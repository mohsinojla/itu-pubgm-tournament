"use client";

import { useState } from "react";
import { Users, Trash2, Search, Shield } from "lucide-react";
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
  tag: string;
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

export default function AdminTeamsPanel({ initialTeams }: { initialTeams: Team[] }) {
  const [teams, setTeams] = useState(initialTeams);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tag.toLowerCase().includes(search.toLowerCase())
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
      </div>

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
                className="border-b border-[var(--border)] hover:bg-[var(--surface)]/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={team.logo}
                      name={team.name}
                      size="sm"
                      className="rounded-lg"
                    />
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-xs text-[var(--text-2)]">[{team.tag}]</div>
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
