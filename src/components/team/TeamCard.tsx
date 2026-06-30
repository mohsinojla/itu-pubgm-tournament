"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Shield, Star } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";

interface TeamMember {
  userId: {
    _id: string;
    name?: string;
    photo?: string;
    pubgName?: string;
    isVerifiedPlayer?: boolean;
  };
  role: "core" | "substitute";
}

interface Team {
  _id: string;
  name: string;
  teamId: string;
  logo?: string;
  leaderId: {
    _id: string;
    name?: string;
    photo?: string;
    pubgName?: string;
  };
  members: TeamMember[];
  isRegistered?: boolean;
  wins?: number;
  matchesPlayed?: number;
}

interface Props {
  team: Team;
  currentUserId?: string;
}

export default function TeamCard({ team, currentUserId }: Props) {
  const isInTeam = team.members.some((m) => m.userId._id === currentUserId);
  const isLeader = team.leaderId._id === currentUserId;
  const coreCount = team.members.filter((m) => m.role === "core").length;
  const subCount = team.members.filter((m) => m.role === "substitute").length;

  return (
    <Link href={`/teams/${team._id}`} className="block group">
      <div className="game-card p-5 h-full flex flex-col gap-4 group-hover:border-[var(--primary-dim)] transition-colors">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shrink-0">
            {team.logo ? (
              <Image src={team.logo} alt={team.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users size={24} className="text-[var(--text-2)]" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-[var(--text-1)] truncate">{team.name}</h3>
              {isLeader && <Star size={12} className="text-[var(--primary)] shrink-0" />}
            </div>
            <p className="text-xs text-[var(--text-2)] font-mono mt-0.5">ID #{team.teamId}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {team.isRegistered && <Badge variant="success" className="text-[10px]">Registered</Badge>}
              {isInTeam && <Badge variant="primary" className="text-[10px]">{isLeader ? "Leader" : "Member"}</Badge>}
            </div>
          </div>
        </div>

        {/* Members */}
        <div>
          <p className="text-xs text-[var(--text-2)] mb-2 flex items-center gap-1">
            <Users size={11} />
            {team.members.length}/5 members
            {coreCount > 0 && ` · ${coreCount} core`}
            {subCount > 0 && ` · ${subCount} sub`}
          </p>
          <div className="flex -space-x-2">
            {team.members.slice(0, 5).map((m) => (
              <div key={m.userId._id} className="relative">
                <Avatar
                  src={m.userId.photo}
                  name={m.userId.name ?? m.userId.pubgName}
                  size="sm"
                  className="border-2 border-[var(--card)]"
                />
                {m.userId.isVerifiedPlayer && (
                  <Shield
                    size={8}
                    className="absolute -bottom-0.5 -right-0.5 text-[var(--success)] bg-[var(--card)] rounded-full"
                  />
                )}
              </div>
            ))}
            {team.members.length < 5 && (
              <div className="w-7 h-7 rounded-full border-2 border-dashed border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
                <span className="text-[8px] text-[var(--text-2)]">+</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {(team.matchesPlayed ?? 0) > 0 && (
          <div className="flex gap-4 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-2)]">
            <span>{team.matchesPlayed} matches</span>
            <span>{team.wins} wins</span>
          </div>
        )}
      </div>
    </Link>
  );
}
