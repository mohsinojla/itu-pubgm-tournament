import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import AdminTeamsPanel from "@/components/admin/AdminTeamsPanel";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user, PERMISSIONS.MANAGE_TEAMS)) {
    redirect("/admin");
  }

  await connectDB();
  const teams = await Team.find()
    .populate("leaderId", "name photo")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Team Management</h1>
      <AdminTeamsPanel initialTeams={JSON.parse(JSON.stringify(teams))} />
    </div>
  );
}
