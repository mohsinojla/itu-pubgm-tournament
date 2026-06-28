import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import PlayersTable from "@/components/admin/PlayersTable";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const hasAccess = isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_PLAYERS);
  if (!hasAccess) redirect("/admin");

  await connectDB();
  const players = await User.find({ profileCompleted: true })
    .sort({ createdAt: -1 })
    .select("-password")
    .lean();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Players</h1>
      <PlayersTable players={JSON.parse(JSON.stringify(players))} />
    </div>
  );
}
