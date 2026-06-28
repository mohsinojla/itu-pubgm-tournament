"use client";

import { useState } from "react";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

interface TeamMember {
  userId: { _id: string; name: string; pubgName?: string };
  role: "core" | "substitute";
}

interface Team {
  _id: string;
  name: string;
  tag: string;
  members: TeamMember[];
  leaderId: { _id: string; name: string };
}

interface Match {
  _id: string;
  matchNumber: number;
  stage: string;
  status: string;
  teams: Team[];
  groupName?: string;
}

interface TeamResult {
  teamId: string;
  placement: number;
  killCount: number;
  points: number;
}

interface PlayerKill {
  userId: string;
  kills: number;
  damage: number;
}

export default function MatchResultsPanel({ matches }: { matches: Match[] }) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [teamResults, setTeamResults] = useState<Record<string, TeamResult>>({});
  const [playerKills, setPlayerKills] = useState<Record<string, PlayerKill>>({});
  const [submitting, setSubmitting] = useState(false);

  const pending = matches.filter((m) => m.status !== "completed" && m.status !== "cancelled");
  const completed = matches.filter((m) => m.status === "completed");
  const selectedMatch = pending.find((m) => m._id === selectedMatchId);

  function initResultsForMatch(match: Match) {
    const results: Record<string, TeamResult> = {};
    match.teams.forEach((t, i) => {
      results[t._id] = { teamId: t._id, placement: i + 1, killCount: 0, points: 0 };
    });
    const kills: Record<string, PlayerKill> = {};
    match.teams.forEach((t) => {
      t.members.forEach((m) => {
        kills[m.userId._id] = { userId: m.userId._id, kills: 0, damage: 0 };
      });
    });
    setTeamResults(results);
    setPlayerKills(kills);
    setSelectedMatchId(match._id);
  }

  function updateTeamResult(teamId: string, field: keyof TeamResult, value: number) {
    setTeamResults((prev) => ({
      ...prev,
      [teamId]: { ...prev[teamId], [field]: value },
    }));
  }

  function updatePlayerKill(userId: string, field: "kills" | "damage", value: number) {
    setPlayerKills((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  }

  async function submitResults() {
    if (!selectedMatchId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${selectedMatchId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: Object.values(teamResults),
          playerKills: Object.values(playerKills),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed");
      }
      toast.success("Results posted successfully!");
      setSelectedMatchId(null);
      setTeamResults({});
      setPlayerKills({});
      // Reload to reflect completion
      window.location.reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to post results");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Pending matches */}
      <div>
        <h3 className="font-heading font-bold mb-3 text-[var(--text-2)] uppercase text-xs tracking-wider">
          Awaiting Results ({pending.length})
        </h3>

        {pending.length === 0 && (
          <div className="text-center py-10 text-[var(--text-2)] text-sm">
            No matches awaiting results.
          </div>
        )}

        <div className="space-y-3">
          {pending.map((match) => (
            <div
              key={match._id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"
            >
              {/* Match header */}
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--card)]/50 transition-colors"
                onClick={() =>
                  selectedMatchId === match._id
                    ? setSelectedMatchId(null)
                    : initResultsForMatch(match)
                }
              >
                <div className="flex items-center gap-3">
                  <Trophy size={16} className="text-[var(--primary)]" />
                  <span className="font-heading font-bold">Match #{match.matchNumber}</span>
                  <Badge variant="default">{match.stage}</Badge>
                  {match.groupName && (
                    <span className="text-xs text-[var(--text-2)]">{match.groupName}</span>
                  )}
                  <span className="text-xs text-[var(--text-2)]">
                    {match.teams.map((t) => t.tag).join(" vs ")}
                  </span>
                </div>
                {selectedMatchId === match._id ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {/* Result entry form */}
              {selectedMatchId === match._id && selectedMatch && (
                <div className="border-t border-[var(--border)] px-5 py-4 space-y-6">
                  {/* Team results */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Team Results</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[var(--text-2)] text-xs">
                            <th className="text-left pb-2">Team</th>
                            <th className="text-center pb-2 w-24">Placement</th>
                            <th className="text-center pb-2 w-24">Total Kills</th>
                            <th className="text-center pb-2 w-24">Points</th>
                          </tr>
                        </thead>
                        <tbody className="space-y-1">
                          {selectedMatch.teams.map((team) => {
                            const r = teamResults[team._id];
                            return (
                              <tr key={team._id} className="border-t border-[var(--border)]/50">
                                <td className="py-2 font-medium">
                                  [{team.tag}] {team.name}
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={selectedMatch.teams.length}
                                    className="w-full text-center px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                                    value={r?.placement ?? ""}
                                    onChange={(e) =>
                                      updateTeamResult(team._id, "placement", Number(e.target.value))
                                    }
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full text-center px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                                    value={r?.killCount ?? ""}
                                    onChange={(e) =>
                                      updateTeamResult(team._id, "killCount", Number(e.target.value))
                                    }
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full text-center px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                                    value={r?.points ?? ""}
                                    onChange={(e) =>
                                      updateTeamResult(team._id, "points", Number(e.target.value))
                                    }
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Player kills */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Player Kill Stats</h4>
                    <div className="space-y-4">
                      {selectedMatch.teams.map((team) => (
                        <div key={team._id}>
                          <div className="text-xs font-medium text-[var(--text-2)] mb-2">
                            [{team.tag}] {team.name}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-[var(--text-2)] text-xs">
                                  <th className="text-left pb-1">Player</th>
                                  <th className="text-center pb-1 w-24">Kills</th>
                                  <th className="text-center pb-1 w-24">Damage</th>
                                </tr>
                              </thead>
                              <tbody>
                                {team.members.map((member) => {
                                  const pk = playerKills[member.userId._id];
                                  return (
                                    <tr key={member.userId._id} className="border-t border-[var(--border)]/50">
                                      <td className="py-1.5">
                                        <div className="font-medium text-sm">
                                          {member.userId.pubgName ?? member.userId.name}
                                        </div>
                                        <div className="text-xs text-[var(--text-2)] capitalize">{member.role}</div>
                                      </td>
                                      <td className="py-1.5 px-2">
                                        <input
                                          type="number"
                                          min={0}
                                          className="w-full text-center px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                                          value={pk?.kills ?? ""}
                                          onChange={(e) =>
                                            updatePlayerKill(member.userId._id, "kills", Number(e.target.value))
                                          }
                                        />
                                      </td>
                                      <td className="py-1.5 px-2">
                                        <input
                                          type="number"
                                          min={0}
                                          className="w-full text-center px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                                          value={pk?.damage ?? ""}
                                          onChange={(e) =>
                                            updatePlayerKill(member.userId._id, "damage", Number(e.target.value))
                                          }
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={submitResults}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-black font-semibold text-sm hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
                  >
                    {submitting && <Spinner className="w-4 h-4" />}
                    Post Results
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Completed matches */}
      {completed.length > 0 && (
        <div>
          <h3 className="font-heading font-bold mb-3 text-[var(--text-2)] uppercase text-xs tracking-wider">
            Completed ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.map((match) => (
              <div
                key={match._id}
                className="flex items-center gap-3 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl"
              >
                <Trophy size={14} className="text-[var(--success)]" />
                <span className="font-medium">Match #{match.matchNumber}</span>
                <Badge variant="success">Completed</Badge>
                <Badge variant="default">{match.stage}</Badge>
                <span className="text-xs text-[var(--text-2)] ml-auto">
                  {match.teams.map((t) => t.tag).join(" · ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
