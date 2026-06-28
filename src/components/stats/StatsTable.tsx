"use client";

import { useState } from "react";
import Link from "next/link";
import { EyeOff, Eye, Trophy, Swords, Shield, Target } from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";

interface Stats {
  _id: string;
  userId?: {
    _id: string;
    name?: string;
    photo?: string;
    pubgName?: string;
    isVerifiedPlayer?: boolean;
  };
  teamId?: { name?: string; tag?: string };
  matchesPlayed: number;
  totalKills: number;
  totalDeaths: number;
  wins: number;
  killDeathRatio: number;
  avgKillsPerMatch: number;
  totalDamage: number;
  mvpCount: number;
  isHidden?: boolean;
}

type SortKey = "totalKills" | "killDeathRatio" | "wins" | "matchesPlayed" | "avgKillsPerMatch";

export default function StatsTable({
  stats: initialStats,
  isAdmin,
  canHide = false,
}: {
  stats: Stats[];
  isAdmin: boolean;
  canHide?: boolean;
}) {
  const [stats, setStats] = useState(initialStats);
  const [sortBy, setSortBy] = useState<SortKey>("totalKills");

  async function toggleHidden(userId: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statsHidden: !current }),
      });
      if (!res.ok) throw new Error();
      setStats((prev) =>
        prev.map((s) =>
          s.userId?._id === userId ? { ...s, isHidden: !current } : s
        )
      );
      toast.success(!current ? "Stats hidden" : "Stats visible");
    } catch {
      toast.error("Failed to update");
    }
  }

  const sorted = [...stats].sort((a, b) => {
    if (sortBy === "totalKills") return b.totalKills - a.totalKills;
    if (sortBy === "killDeathRatio") return b.killDeathRatio - a.killDeathRatio;
    if (sortBy === "wins") return b.wins - a.wins;
    if (sortBy === "matchesPlayed") return b.matchesPlayed - a.matchesPlayed;
    if (sortBy === "avgKillsPerMatch") return b.avgKillsPerMatch - a.avgKillsPerMatch;
    return 0;
  });

  const sortOptions: { key: SortKey; label: string; icon: React.ReactNode }[] = [
    { key: "totalKills", label: "Total Kills", icon: <Swords size={13} /> },
    { key: "killDeathRatio", label: "K/D Ratio", icon: <Target size={13} /> },
    { key: "wins", label: "Wins", icon: <Trophy size={13} /> },
    { key: "matchesPlayed", label: "Matches", icon: <Shield size={13} /> },
    { key: "avgKillsPerMatch", label: "Avg Kills", icon: <Target size={13} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex flex-wrap gap-2">
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sortBy === opt.key
                ? "bg-[var(--primary)] text-black"
                : "border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--primary-dim)]"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {stats.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-2)]">
          <Trophy size={40} className="mx-auto mb-4 opacity-30" />
          <p>No statistics yet. Check back after matches begin!</p>
        </div>
      ) : (
        <div className="game-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-2)] uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-8">#</th>
                  <th className="px-4 py-3 text-left">Player</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-right">Kills</th>
                  <th className="px-4 py-3 text-right">K/D</th>
                  <th className="px-4 py-3 text-right">Wins</th>
                  <th className="px-4 py-3 text-right">Matches</th>
                  <th className="px-4 py-3 text-right">Avg K</th>
                  {canHide && <th className="px-4 py-3 text-right">Visibility</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sorted.map((s, i) => (
                  <tr
                    key={s._id}
                    className={`hover:bg-[var(--surface)]/50 transition-colors ${
                      s.isHidden && isAdmin ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold text-sm ${
                          i === 0
                            ? "text-yellow-400"
                            : i === 1
                            ? "text-gray-300"
                            : i === 2
                            ? "text-amber-600"
                            : "text-[var(--text-2)]"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.userId ? (
                        <Link href={`/profile/${s.userId._id}`} className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                          <Avatar src={s.userId.photo} name={s.userId.name ?? s.userId.pubgName} size="sm" />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{s.userId.name ?? "Unknown"}</span>
                              {s.userId.isVerifiedPlayer && (
                                <Shield size={11} className="text-[var(--success)]" />
                              )}
                              {s.isHidden && isAdmin && (
                                <EyeOff size={11} className="text-[var(--warning)]" />
                              )}
                            </div>
                            <span className="text-[10px] text-[var(--text-2)] font-mono">{s.userId.pubgName}</span>
                          </div>
                        </Link>
                      ) : (
                        <span className="text-[var(--text-2)]">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.teamId ? (
                        <span className="text-xs font-mono">[{s.teamId.tag}]</span>
                      ) : (
                        <span className="text-xs text-[var(--text-2)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--primary)]">{s.totalKills}</td>
                    <td className="px-4 py-3 text-right">{s.killDeathRatio.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[var(--success)]">{s.wins}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-2)]">{s.matchesPlayed}</td>
                    <td className="px-4 py-3 text-right">{s.avgKillsPerMatch.toFixed(1)}</td>
                    {canHide && s.userId && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleHidden(s.userId!._id, !!s.isHidden)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            s.isHidden
                              ? "text-[var(--warning)] hover:bg-[var(--warning)]/10"
                              : "text-[var(--text-2)] hover:bg-[var(--surface)]"
                          }`}
                          title={s.isHidden ? "Show stats" : "Hide stats"}
                        >
                          {s.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
