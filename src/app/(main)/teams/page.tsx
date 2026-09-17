import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import User from "@/lib/db/models/User";
import PageHero from "@/components/common/PageHero";
import TeamCard from "@/components/team/TeamCard";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const [session] = await Promise.all([auth(), connectDB()]);

  const [teams, currentUser] = await Promise.all([
    Team.find()
      .sort({ createdAt: -1 })
      .populate("leaderId", "name photo pubgName")
      .populate("members.userId", "name photo pubgName isVerifiedPlayer")
      .lean(),
    session?.user?.id
      ? User.findById(session.user.id).select("profileCompleted teamId").lean()
      : null,
  ]);

  // Read fresh from the DB — the session JWT only refreshes at sign-in, so a
  // player who just left/was removed from a team would otherwise still be
  // hidden from "Create Team" until they log out and back in.
  const canCreate = !!currentUser?.profileCompleted && !currentUser?.teamId;

  return (
    <>
      <PageHero
        title="Registered Teams"
        subtitle={`${teams.length} team${teams.length !== 1 ? "s" : ""} competing in the Supremacy Cup`}
      />

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Actions */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-[var(--text-2)]">
            {teams.length === 0 ? "No teams yet — be the first!" : `Showing all ${teams.length} teams`}
          </p>
          {canCreate && (
            <Link
              href="/teams/create"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-semibold text-sm hover:bg-[var(--primary-dim)] transition-colors"
            >
              <Plus size={16} />
              Create Team
            </Link>
          )}
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-2)]">
            <div className="text-5xl mb-4">🎮</div>
            <p className="text-lg font-heading">No teams registered yet</p>
            <p className="text-sm mt-2">Register and create the first team!</p>
          </div>
        ) : (
          <div className="stagger-fade grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <TeamCard
                key={team._id.toString()}
                team={JSON.parse(JSON.stringify(team))}
                currentUserId={session?.user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
