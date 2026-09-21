import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import User from "@/lib/db/models/User";
import AdminTeamsPanel from "@/components/admin/AdminTeamsPanel";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin");
  const canManage = isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_TEAMS);
  if (!canManage) redirect("/admin");

  await connectDB();
  const [teams, availablePlayers] = await Promise.all([
    Team.find()
      .populate("leaderId", "name photo")
      .sort({ createdAt: -1 })
      .lean(),
    // Players with no team yet — candidates to lead a newly created team.
    User.find({ role: "player", profileCompleted: true, teamId: null })
      .select("name email rollNumber")
      .sort({ name: 1 })
      .lean(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Team Management</h1>
      <AdminTeamsPanel
        // Remount when the set of teams/members changes so refreshed server data replaces local state.
        key={teams.map((t) => `${t._id}:${(t.members ?? []).length}`).join(",")}
        initialTeams={JSON.parse(JSON.stringify(teams))}
        isSuperAdmin={isSuperAdmin(session.user)}
        availablePlayers={JSON.parse(JSON.stringify(availablePlayers))}
      />
    </div>
  );
}
