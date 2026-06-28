"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Shield, Star, Users, Edit2, ExternalLink } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProfileEditModal from "@/components/profile/ProfileEditModal";

interface ProfileUser {
  _id: string;
  name?: string;
  email: string;
  photo?: string;
  pubgId?: string;
  pubgName?: string;
  rollNumber?: string;
  gender?: string;
  semester?: number;
  degreeProgramme?: string;
  role: "player" | "admin" | "super_admin";
  isVerifiedPlayer?: boolean;
  profileCompleted?: boolean;
  teamId?: string;
  isTeamLeader?: boolean;
  createdAt?: string;
}

interface Props {
  user: ProfileUser;
  isOwn?: boolean;
}

export default function ProfileCard({ user, isOwn = false }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  const roleLabel =
    user.role === "super_admin"
      ? "Super Admin"
      : user.role === "admin"
      ? "Admin"
      : "Player";

  const roleBadgeVariant =
    user.role === "super_admin"
      ? "primary"
      : user.role === "admin"
      ? "blue"
      : "default";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Avatar + core info */}
        <div className="md:col-span-1">
          <div className="game-card p-6 flex flex-col items-center text-center gap-4">
            {/* Avatar */}
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-[var(--primary-dim)] ring-4 ring-[var(--primary)]/10">
              {user.photo ? (
                <Image src={user.photo} alt={user.name ?? "Player"} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--surface)]">
                  <User size={48} className="text-[var(--text-2)]" />
                </div>
              )}
            </div>

            {/* Name + badges */}
            <div>
              <h2 className="text-xl font-heading font-bold text-[var(--text-1)]">
                {user.name ?? "—"}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                <Badge variant={roleBadgeVariant}>{roleLabel}</Badge>
                {user.isVerifiedPlayer && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Shield size={10} />
                    Verified
                  </Badge>
                )}
                {user.isTeamLeader && (
                  <Badge variant="primary" className="flex items-center gap-1">
                    <Star size={10} />
                    Leader
                  </Badge>
                )}
              </div>
            </div>

            {/* Edit button */}
            {isOwn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="w-full"
              >
                <Edit2 size={14} className="mr-1.5" />
                Edit Profile
              </Button>
            )}

            {/* Team link */}
            {user.teamId && (
              <Link
                href={`/teams/${user.teamId}`}
                className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
              >
                <Users size={14} />
                View Team
                <ExternalLink size={12} />
              </Link>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="md:col-span-2 game-card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-2)] uppercase tracking-widest mb-4">
            Player Details
          </h3>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <Detail label="Email" value={user.email} />
            <Detail label="Roll Number" value={user.rollNumber} />
            <Detail label="PUBG ID" value={user.pubgId} />
            <Detail label="In-Game Name" value={user.pubgName} monospace />
            <Detail label="Gender" value={user.gender ? capitalize(user.gender) : undefined} />
            <Detail label="Semester" value={user.semester ? `Semester ${user.semester}` : undefined} />
            <Detail
              label="Degree Programme"
              value={user.degreeProgramme}
              className="sm:col-span-2"
            />
          </dl>

          {!user.profileCompleted && isOwn && (
            <div className="mt-4 p-3 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/30">
              <p className="text-xs text-[var(--warning)]">
                Your profile is incomplete. Some features are restricted until you complete your profile.
              </p>
            </div>
          )}
        </div>
      </div>

      {isOwn && (
        <ProfileEditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          user={user}
        />
      )}
    </>
  );
}

function Detail({
  label,
  value,
  monospace,
  className,
}: {
  label: string;
  value?: string | number;
  monospace?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-[var(--text-2)] uppercase tracking-wider mb-0.5">{label}</dt>
      <dd
        className={`text-sm text-[var(--text-1)] ${
          monospace ? "font-mono" : ""
        } ${!value ? "text-[var(--text-2)] italic" : ""}`}
      >
        {value ?? "Not provided"}
      </dd>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
