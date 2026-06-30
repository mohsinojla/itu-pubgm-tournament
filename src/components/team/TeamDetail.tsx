"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Users, Shield, Share2, UserPlus, Check, X,
  ChevronRight, Crown, UserMinus, LogOut, Trash2, Phone,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

interface Member {
  userId: {
    _id: string;
    name?: string;
    photo?: string;
    pubgName?: string;
    rollNumber?: string;
    isVerifiedPlayer?: boolean;
    whatsapp?: string;
  };
  role: "core" | "substitute";
  joinedAt: string;
}

interface JoinReq {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    photo?: string;
    pubgName?: string;
    rollNumber?: string;
  };
  requestedRole: string;
  message?: string;
  createdAt: string;
}

interface Team {
  _id: string;
  name: string;
  teamId: string;
  logo?: string;
  leaderId: { _id: string; name?: string; photo?: string; pubgName?: string; whatsapp?: string };
  members: Member[];
  isRegistered?: boolean;
  wins?: number;
  totalKills?: number;
  matchesPlayed?: number;
  shareToken: string;
}

interface Props {
  team: Team;
  currentUserId?: string;
  joinRequests: JoinReq[];
  myPendingRequest: JoinReq | null;
}

export default function TeamDetail({ team, currentUserId, joinRequests, myPendingRequest }: Props) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [joinRole, setJoinRole] = useState<"core" | "substitute">("core");
  const [joinMessage, setJoinMessage] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [processingReq, setProcessingReq] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLeader = currentUserId === team.leaderId._id;
  const isMember = team.members.some((m) => m.userId._id === currentUserId);
  const canJoin = currentUserId && !isMember && team.members.length < 5 && !myPendingRequest;
  const isFull = team.members.length >= 5;

  async function handleJoinRequest() {
    setJoining(true);
    try {
      const res = await fetch(`/api/teams/${team._id}/join-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: joinRole, message: joinMessage }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Join request sent!");
        setShowJoinForm(false);
        router.refresh();
      } else {
        toast.error(data.error ?? "Request failed");
      }
    } finally {
      setJoining(false);
    }
  }

  async function handleRequest(reqId: string, action: "approve" | "reject") {
    setProcessingReq(reqId);
    try {
      const res = await fetch(`/api/teams/${team._id}/join-requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "approve" ? "Player added!" : "Request rejected");
        router.refresh();
      } else {
        toast.error(data.error ?? "Action failed");
      }
    } finally {
      setProcessingReq(null);
    }
  }

  async function handleTransfer() {
    if (!transferTarget) return;
    try {
      const res = await fetch(`/api/teams/${team._id}/transfer-leadership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newLeaderId: transferTarget }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Leadership transferred!");
        setShowTransfer(false);
        router.refresh();
      } else {
        toast.error(data.error ?? "Transfer failed");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingMember(memberId);
    try {
      const res = await fetch(`/api/teams/${team._id}/remove-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Member removed");
        router.refresh();
      } else {
        toast.error(data.error ?? "Remove failed");
      }
    } finally {
      setRemovingMember(null);
    }
  }

  async function handleLeave() {
    const msg = isLeader
      ? team.members.length === 1
        ? "You are the only member. Leaving will delete the team permanently."
        : "As leader, leaving will automatically transfer leadership to another member."
      : "Are you sure you want to leave this team?";
    if (!confirm(msg)) return;

    setLeaving(true);
    try {
      const res = await fetch(`/api/teams/${team._id}/leave`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.teamDeleted ? "Team deleted — you have left." : "You have left the team.");
        router.push("/teams");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to leave team");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLeaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this team permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teams/${team._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Team deleted.");
        router.push("/teams");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to delete team");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/teams/${team._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Team link copied!");
  }

  return (
    <div className="space-y-6">
      {/* Team header */}
      <div className="game-card p-6 flex items-start gap-5">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shrink-0">
          {team.logo ? (
            <Image src={team.logo} alt={team.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users size={32} className="text-[var(--text-2)]" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h2 className="font-heading text-2xl font-bold">{team.name}</h2>
              <p className="text-sm text-[var(--text-2)] font-mono">Team ID #{team.teamId}</p>
            </div>
            <div className="flex items-center gap-2">
              {team.isRegistered && <Badge variant="success">Registered</Badge>}
              <button
                onClick={handleShare}
                className="p-2 rounded-xl border border-[var(--border)] hover:border-[var(--primary-dim)] transition-colors"
              >
                <Share2 size={16} className="text-[var(--text-2)]" />
              </button>
            </div>
          </div>

          {/* Stats */}
          {(team.matchesPlayed ?? 0) > 0 && (
            <div className="flex gap-4 mt-3 text-sm">
              <div>
                <span className="text-[var(--text-2)] text-xs">Matches</span>
                <p className="font-bold">{team.matchesPlayed ?? 0}</p>
              </div>
              <div>
                <span className="text-[var(--text-2)] text-xs">Wins</span>
                <p className="font-bold text-[var(--success)]">{team.wins ?? 0}</p>
              </div>
              <div>
                <span className="text-[var(--text-2)] text-xs">Total Kills</span>
                <p className="font-bold text-[var(--primary)]">{team.totalKills ?? 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roster */}
      <div className="game-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg">Roster</h3>
          <span className="text-sm text-[var(--text-2)]">{team.members.length}/5 members</span>
        </div>

        <div className="space-y-3">
          {team.members.map((m) => {
            const isCurrentLeader = m.userId._id === team.leaderId._id;
            return (
              <div key={m.userId._id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)]">
                <Avatar src={m.userId.photo} name={m.userId.name ?? m.userId.pubgName} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/profile/${m.userId._id}`}
                      className="font-medium hover:text-[var(--primary)] transition-colors truncate"
                    >
                      {m.userId.name ?? "Unknown"}
                    </Link>
                    {isCurrentLeader && <Crown size={12} className="text-[var(--primary)] shrink-0" />}
                    {m.userId.isVerifiedPlayer && <Shield size={12} className="text-[var(--success)] shrink-0" />}
                  </div>
                  <p className="text-xs text-[var(--text-2)] font-mono">{m.userId.pubgName ?? "—"}</p>
                  {m.userId.whatsapp && (
                    <a
                      href={`https://wa.me/92${m.userId.whatsapp.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[var(--success)] hover:underline mt-0.5"
                    >
                      <Phone size={9} />
                      {m.userId.whatsapp}
                      {isCurrentLeader && (
                        <span className="text-[var(--text-2)] ml-1">(leader)</span>
                      )}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.role === "core" ? "blue" : "default"} className="text-[10px]">
                    {m.role}
                  </Badge>
                  {isLeader && !isCurrentLeader && (
                    <button
                      onClick={() => handleRemove(m.userId._id)}
                      disabled={removingMember === m.userId._id}
                      className="p-1 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 5 - team.members.length) }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-2)] text-sm"
            >
              <div className="w-8 h-8 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center">
                <UserPlus size={14} />
              </div>
              Open slot
            </div>
          ))}
        </div>
      </div>

      {/* Join Request Form */}
      {canJoin && !isFull && (
        <div className="game-card p-6">
          {!showJoinForm ? (
            <Button onClick={() => setShowJoinForm(true)} variant="outline" className="w-full">
              <UserPlus size={16} className="mr-2" />
              Request to Join
            </Button>
          ) : (
            <div className="space-y-4">
              <h3 className="font-heading font-bold">Request to Join</h3>
              <div>
                <label className="block text-sm text-[var(--text-2)] mb-2">Role preference</label>
                <div className="flex gap-3">
                  {(["core", "substitute"] as const).map((r) => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={r}
                        checked={joinRole === r}
                        onChange={() => setJoinRole(r)}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm capitalize">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-2)] mb-1">Message (optional)</label>
                <textarea
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Introduce yourself to the team leader..."
                  rows={3}
                  maxLength={300}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-1)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowJoinForm(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleJoinRequest} loading={joining}>Send Request</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending request info */}
      {myPendingRequest && (
        <div className="game-card p-4 border-[var(--warning)]/30 bg-[var(--warning)]/5">
          <p className="text-sm text-[var(--warning)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--warning)] animate-pulse" />
            Your join request is pending approval from the team leader.
          </p>
        </div>
      )}

      {/* Join Requests (leader view) */}
      {isLeader && joinRequests.length > 0 && (
        <div className="game-card p-6">
          <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-[var(--primary)]" />
            Pending Requests ({joinRequests.length})
          </h3>
          <div className="space-y-3">
            {joinRequests.map((req) => (
              <div key={req._id} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface)]">
                <Avatar src={req.userId.photo} name={req.userId.name ?? req.userId.pubgName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{req.userId.name}</p>
                  <p className="text-xs text-[var(--text-2)] font-mono">{req.userId.pubgName}</p>
                  <p className="text-xs text-[var(--text-2)]">
                    Wants to join as <span className="text-[var(--text-1)]">{req.requestedRole}</span>
                    {req.userId.rollNumber && ` · ${req.userId.rollNumber}`}
                  </p>
                  {req.message && (
                    <p className="mt-1 text-xs text-[var(--text-2)] italic">&ldquo;{req.message}&rdquo;</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleRequest(req._id, "approve")}
                    disabled={processingReq === req._id}
                    className="p-1.5 text-[var(--success)] hover:bg-[var(--success)]/10 rounded-lg transition-colors"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleRequest(req._id, "reject")}
                    disabled={processingReq === req._id}
                    className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leader actions */}
      {isLeader && (
        <div className="game-card p-6">
          <h3 className="font-heading font-bold text-lg mb-4">Leader Actions</h3>
          <div className="space-y-3">
            {/* Transfer leadership — only if there are other members */}
            {team.members.length > 1 && (
              <>
                <button
                  onClick={() => setShowTransfer(!showTransfer)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary-dim)] transition-colors text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Crown size={16} className="text-[var(--primary)]" />
                    Transfer Leadership
                  </span>
                  <ChevronRight size={14} className="text-[var(--text-2)]" />
                </button>

                {showTransfer && (
                  <div className="p-4 rounded-xl bg-[var(--surface)] space-y-3">
                    <p className="text-sm text-[var(--text-2)]">Select a member to become the new leader:</p>
                    <div className="space-y-2">
                      {team.members
                        .filter((m) => m.userId._id !== currentUserId)
                        .map((m) => (
                          <label key={m.userId._id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="transfer"
                              value={m.userId._id}
                              onChange={() => setTransferTarget(m.userId._id)}
                              className="accent-[var(--primary)]"
                            />
                            <Avatar src={m.userId.photo} name={m.userId.name} size="sm" />
                            <span className="text-sm">{m.userId.name ?? m.userId.pubgName}</span>
                          </label>
                        ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowTransfer(false)}>Cancel</Button>
                      <Button size="sm" variant="danger" disabled={!transferTarget} onClick={handleTransfer}>
                        Confirm Transfer
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Leave team */}
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--warning)]/50 text-[var(--warning)] transition-colors text-sm disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <LogOut size={16} />
                {leaving ? "Leaving…" : "Leave Team"}
              </span>
              <ChevronRight size={14} className="opacity-50" />
            </button>

            {/* Delete team — only when no other members */}
            {team.members.length <= 1 && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--danger)]/30 hover:border-[var(--danger)] text-[var(--danger)] transition-colors text-sm disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  {deleting ? "Deleting…" : "Delete Team"}
                </span>
                <ChevronRight size={14} className="opacity-50" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Leave team — non-leader members */}
      {isMember && !isLeader && (
        <div className="game-card p-4">
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--warning)]/50 text-[var(--warning)] transition-colors text-sm disabled:opacity-50"
          >
            <LogOut size={16} />
            {leaving ? "Leaving…" : "Leave Team"}
          </button>
        </div>
      )}
    </div>
  );
}
