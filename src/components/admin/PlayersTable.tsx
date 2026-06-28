"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Shield, EyeOff, Eye, Trash2, ExternalLink, Search } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Player {
  _id: string;
  name?: string;
  email: string;
  photo?: string;
  pubgId?: string;
  pubgName?: string;
  rollNumber?: string;
  role: string;
  isVerifiedPlayer?: boolean;
  statsHidden?: boolean;
  degreeProgramme?: string;
  semester?: number;
  teamId?: string;
  createdAt: string;
}

export default function PlayersTable({ players }: { players: Player[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.pubgName?.toLowerCase().includes(q) ||
      p.rollNumber?.toLowerCase().includes(q)
    );
  });

  async function patchPlayer(userId: string, updates: Record<string, unknown>, successMsg: string) {
    setLoading(userId + Object.keys(updates)[0]);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) { toast.success(successMsg); router.refresh(); }
      else toast.error(data.error ?? "Action failed");
    } finally {
      setLoading(null);
    }
  }

  async function deletePlayer(userId: string) {
    if (!confirm("Permanently unregister this player? This cannot be undone.")) return;
    setLoading(userId + "delete");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success("Player unregistered"); router.refresh(); }
      else toast.error(data.error ?? "Delete failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, PUBG name, roll number..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>

      <p className="text-xs text-[var(--text-2)]">{filtered.length} player{filtered.length !== 1 ? "s" : ""}</p>

      {/* Table */}
      <div className="game-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--text-2)] uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">PUBG</th>
                <th className="px-4 py-3 text-left">Roll No</th>
                <th className="px-4 py-3 text-left">Degree</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((player) => (
                <tr key={player._id} className="hover:bg-[var(--surface)]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--surface)] border border-[var(--border)] shrink-0">
                        {player.photo ? (
                          <Image src={player.photo} alt={player.name ?? ""} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-2)]">
                            {player.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-[140px]">{player.name ?? "—"}</p>
                        <p className="text-xs text-[var(--text-2)] truncate max-w-[140px]">{player.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">{player.pubgName ?? "—"}</p>
                    <p className="text-[10px] text-[var(--text-2)]">{player.pubgId ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{player.rollNumber ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs truncate max-w-[120px]">{player.degreeProgramme ?? "—"}</p>
                    {player.semester && <p className="text-[10px] text-[var(--text-2)]">Sem {player.semester}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {player.isVerifiedPlayer && <Badge variant="success" className="text-[10px] w-fit">Verified</Badge>}
                      {player.statsHidden && <Badge variant="warning" className="text-[10px] w-fit">Stats Hidden</Badge>}
                      {player.teamId && <Badge variant="blue" className="text-[10px] w-fit">In Team</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/profile/${player._id}`}
                        target="_blank"
                        className="p-1.5 text-[var(--text-2)] hover:text-[var(--text-1)] rounded-lg hover:bg-[var(--surface)] transition-colors"
                      >
                        <ExternalLink size={14} />
                      </Link>

                      <button
                        onClick={() =>
                          patchPlayer(
                            player._id,
                            { isVerifiedPlayer: !player.isVerifiedPlayer },
                            player.isVerifiedPlayer ? "Verification removed" : "Player verified!"
                          )
                        }
                        disabled={loading !== null}
                        title={player.isVerifiedPlayer ? "Remove verified badge" : "Mark as verified"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          player.isVerifiedPlayer
                            ? "text-[var(--success)] hover:bg-[var(--success)]/10"
                            : "text-[var(--text-2)] hover:text-[var(--success)] hover:bg-[var(--success)]/10"
                        }`}
                      >
                        <Shield size={14} />
                      </button>

                      <button
                        onClick={() =>
                          patchPlayer(
                            player._id,
                            { statsHidden: !player.statsHidden },
                            player.statsHidden ? "Stats visible" : "Stats hidden"
                          )
                        }
                        disabled={loading !== null}
                        title={player.statsHidden ? "Show stats" : "Hide stats"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          player.statsHidden
                            ? "text-[var(--warning)] hover:bg-[var(--warning)]/10"
                            : "text-[var(--text-2)] hover:text-[var(--warning)] hover:bg-[var(--warning)]/10"
                        }`}
                      >
                        {player.statsHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      <button
                        onClick={() => deletePlayer(player._id)}
                        disabled={loading !== null}
                        title="Unregister player"
                        className="p-1.5 text-[var(--text-2)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-[var(--text-2)] text-sm">No players found</p>
          )}
        </div>
      </div>
    </div>
  );
}
