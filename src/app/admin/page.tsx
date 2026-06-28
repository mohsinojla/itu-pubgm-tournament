import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import Team from "@/lib/db/models/Team";
import Announcement from "@/lib/db/models/Announcement";
import { auth } from "@/lib/auth/auth";
import Link from "next/link";
import { Users, UsersRound, Megaphone, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  await connectDB();
  const [players, teams, announcements, unverified] = await Promise.all([
    User.countDocuments({ role: "player" }),
    Team.countDocuments(),
    Announcement.countDocuments(),
    User.countDocuments({ role: "player", isVerifiedPlayer: false, profileCompleted: true }),
  ]);
  return { players, teams, announcements, unverified };
}

export default async function AdminDashboard() {
  const [session, stats] = await Promise.all([auth(), getStats()]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-2">
        Welcome back, {session?.user?.name?.split(" ")[0] ?? "Admin"}
      </h1>
      <p className="text-[var(--text-2)] mb-8">ITU × PUBGM Supremacy Cup — Admin Panel</p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          href="/admin/players"
          icon={<Users size={22} className="text-[var(--primary)]" />}
          label="Registered Players"
          value={stats.players}
          sub={stats.unverified > 0 ? `${stats.unverified} unverified` : "All verified"}
        />
        <StatCard
          href="/admin/teams"
          icon={<UsersRound size={22} className="text-[var(--primary)]" />}
          label="Teams"
          value={stats.teams}
          sub="Active teams"
        />
        <StatCard
          href="/admin/announcements"
          icon={<Megaphone size={22} className="text-[var(--primary)]" />}
          label="Announcements"
          value={stats.announcements}
          sub="Total posted"
        />
        <StatCard
          href="/admin/admins"
          icon={<Shield size={22} className="text-[var(--primary)]" />}
          label="Admin Access"
          value="Active"
          sub={session?.user?.role === "super_admin" ? "Super Admin" : "Admin"}
          isText
        />
      </div>

      {/* Quick links */}
      <div className="game-card p-6">
        <h2 className="font-heading font-bold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { href: "/admin/announcements", label: "Post Announcement", desc: "Share news with all players" },
            { href: "/admin/schedule", label: "Manage Schedule", desc: "Add or update match times" },
            { href: "/admin/results", label: "Post Results", desc: "Update match results & stats" },
            { href: "/admin/gallery", label: "Upload Media", desc: "Add photos or videos" },
            { href: "/admin/players", label: "Manage Players", desc: "Edit, verify, or remove players" },
            { href: "/admin/rules", label: "Edit Rules", desc: "Update tournament rules" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary-dim)] transition-colors"
            >
              <p className="font-medium text-sm">{action.label}</p>
              <p className="text-xs text-[var(--text-2)] mt-0.5">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  sub,
  isText,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  isText?: boolean;
}) {
  return (
    <Link href={href} className="game-card p-5 hover:border-[var(--primary-dim)] transition-colors block">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--text-2)] uppercase tracking-wider mb-2">{label}</p>
          <p className={`font-heading font-bold ${isText ? "text-2xl" : "text-3xl"} text-[var(--primary)]`}>
            {value}
          </p>
          <p className="text-xs text-[var(--text-2)] mt-1">{sub}</p>
        </div>
        <div className="p-2 rounded-xl bg-[var(--primary)]/10">{icon}</div>
      </div>
    </Link>
  );
}
