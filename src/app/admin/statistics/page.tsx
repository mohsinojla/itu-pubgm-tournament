import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { connectDB } from "@/lib/db/mongoose";
import PlayerStats from "@/lib/db/models/PlayerStats";
import StatsTable from "@/components/stats/StatsTable";

export const dynamic = "force-dynamic";

export default async function AdminStatisticsPage() {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user, PERMISSIONS.VIEW_STATS)) {
    redirect("/admin");
  }

  await connectDB();
  const stats = await PlayerStats.find()
    .populate("userId", "name pubgName photo rollNumber")
    .populate("teamId", "name tag")
    .sort({ totalKills: -1 })
    .lean();

  const canHide = hasPermission(session.user, PERMISSIONS.HIDE_STATS);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Player Statistics</h1>
      <p className="text-sm text-[var(--text-2)] mb-4">
        Showing all players including hidden. Use the toggle to hide/show individual stat rows.
      </p>
      <StatsTable
        stats={JSON.parse(JSON.stringify(stats))}
        isAdmin
        canHide={canHide}
      />
    </div>
  );
}
