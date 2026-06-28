"use client";

import { useState } from "react";
import { Plus, Trash2, Edit3, Calendar, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { format } from "date-fns";

interface Team {
  _id: string;
  name: string;
  tag: string;
}

interface Match {
  _id: string;
  matchNumber: number;
  stage: string;
  groupName?: string;
  teams: Team[];
  scheduledAt?: string;
  map?: string;
  status: "upcoming" | "live" | "completed" | "cancelled";
}

const STAGE_OPTIONS = ["group", "quarterfinal", "semifinal", "final"] as const;
const STATUS_OPTIONS = ["upcoming", "live", "completed", "cancelled"] as const;

function statusVariant(status: string) {
  const map: Record<string, "default" | "primary" | "success" | "danger" | "warning" | "blue"> = {
    upcoming: "default",
    live: "primary",
    completed: "success",
    cancelled: "danger",
  };
  return map[status] ?? "default";
}

export default function MatchSchedulePanel({
  initialMatches,
  teams,
}: {
  initialMatches: Match[];
  teams: Team[];
}) {
  const [matches, setMatches] = useState(initialMatches);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    matchNumber: "",
    stage: "group",
    groupName: "",
    selectedTeams: [] as string[],
    scheduledAt: "",
    map: "",
  });

  function resetForm() {
    setForm({ matchNumber: "", stage: "group", groupName: "", selectedTeams: [], scheduledAt: "", map: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(match: Match) {
    setForm({
      matchNumber: String(match.matchNumber),
      stage: match.stage,
      groupName: match.groupName ?? "",
      selectedTeams: match.teams.map((t) => t._id),
      scheduledAt: match.scheduledAt
        ? new Date(match.scheduledAt).toISOString().slice(0, 16)
        : "",
      map: match.map ?? "",
    });
    setEditingId(match._id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      matchNumber: Number(form.matchNumber),
      stage: form.stage,
      groupName: form.groupName || undefined,
      teams: form.selectedTeams,
      scheduledAt: form.scheduledAt || undefined,
      map: form.map || undefined,
    };

    setLoadingId("form");
    try {
      if (editingId) {
        const res = await fetch(`/api/matches/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const { match } = await res.json();
        setMatches((prev) => prev.map((m) => (m._id === editingId ? match : m)));
        toast.success("Match updated");
      } else {
        const res = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const { match } = await res.json();
        setMatches((prev) => [...prev, match]);
        toast.success("Match scheduled");
      }
      resetForm();
    } catch {
      toast.error("Failed to save match");
    } finally {
      setLoadingId(null);
    }
  }

  async function updateStatus(matchId: string, status: string) {
    setLoadingId(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setMatches((prev) => prev.map((m) => (m._id === matchId ? { ...m, status: status as Match["status"] } : m)));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteMatch(matchId: string, num: number) {
    if (!confirm(`Delete Match #${num}?`)) return;
    setLoadingId(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMatches((prev) => prev.filter((m) => m._id !== matchId));
      toast.success("Match deleted");
    } catch {
      toast.error("Failed to delete match");
    } finally {
      setLoadingId(null);
    }
  }

  function toggleTeam(teamId: string) {
    setForm((f) => ({
      ...f,
      selectedTeams: f.selectedTeams.includes(teamId)
        ? f.selectedTeams.filter((id) => id !== teamId)
        : [...f.selectedTeams, teamId],
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-2)]">{matches.length} matches</span>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-semibold text-sm hover:bg-[var(--secondary)] transition-colors"
        >
          <Plus size={16} />
          Schedule Match
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4"
        >
          <h3 className="font-heading font-bold text-lg">
            {editingId ? "Edit Match" : "Schedule New Match"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-2)] mb-1">Match Number *</label>
              <input
                type="number"
                required
                min={1}
                className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                value={form.matchNumber}
                onChange={(e) => setForm((f) => ({ ...f, matchNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-2)] mb-1">Stage *</label>
              <select
                required
                className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                value={form.stage}
                onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
              >
                {STAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-2)] mb-1">Group Name</label>
              <input
                type="text"
                placeholder="e.g. Group A"
                className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                value={form.groupName}
                onChange={(e) => setForm((f) => ({ ...f, groupName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-2)] mb-1">Map</label>
              <input
                type="text"
                placeholder="e.g. Erangel"
                className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                value={form.map}
                onChange={(e) => setForm((f) => ({ ...f, map: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-2)] mb-1">Scheduled At</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            />
          </div>

          {teams.length > 0 && (
            <div>
              <label className="block text-xs text-[var(--text-2)] mb-2">
                Teams ({form.selectedTeams.length} selected)
              </label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {teams.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => toggleTeam(t._id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      form.selectedTeams.includes(t._id)
                        ? "bg-[var(--primary)] border-[var(--primary)] text-black"
                        : "bg-[var(--card)] border-[var(--border)] text-[var(--text-2)]"
                    }`}
                  >
                    [{t.tag}] {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loadingId === "form"}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--primary)] text-black font-semibold text-sm hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
            >
              {loadingId === "form" ? <Spinner className="w-4 h-4" /> : null}
              {editingId ? "Save Changes" : "Schedule"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 rounded-xl border border-[var(--border)] text-sm hover:border-[var(--primary-dim)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Matches list */}
      <div className="space-y-3">
        {matches.length === 0 && (
          <div className="text-center py-16 text-[var(--text-2)]">
            No matches scheduled yet.
          </div>
        )}
        {matches.map((match) => (
          <div
            key={match._id}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-heading font-bold">Match #{match.matchNumber}</span>
                  <Badge variant={statusVariant(match.status)}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </Badge>
                  <Badge variant="default">{match.stage}</Badge>
                  {match.groupName && <span className="text-xs text-[var(--text-2)]">{match.groupName}</span>}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-[var(--text-2)]">
                  {match.scheduledAt && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {format(new Date(match.scheduledAt), "d MMM yyyy")}
                      <Clock size={13} />
                      {format(new Date(match.scheduledAt), "HH:mm")}
                    </div>
                  )}
                  {match.map && <span>Map: {match.map}</span>}
                </div>

                {match.teams.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {match.teams.map((t) => (
                      <span
                        key={t._id}
                        className="px-2 py-0.5 rounded-md bg-[var(--card)] border border-[var(--border)] text-xs"
                      >
                        [{t.tag}] {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {loadingId === match._id ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <>
                    <select
                      value={match.status}
                      onChange={(e) => updateStatus(match._id, e.target.value)}
                      className="px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => startEdit(match)}
                      className="p-1.5 rounded-lg hover:bg-[var(--primary)]/10 text-[var(--primary)] transition-colors"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => deleteMatch(match._id, match.matchNumber)}
                      className="p-1.5 rounded-lg hover:bg-[var(--danger)]/10 text-[var(--danger)] transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
