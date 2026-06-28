import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import PlayerStats from "@/lib/db/models/PlayerStats";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import PageHero from "@/components/common/PageHero";
import StatsTable from "@/components/stats/StatsTable";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const [session] = await Promise.all([auth(), connectDB()]);

  const canViewHidden =
    session?.user &&
    (isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.VIEW_STATS));

  const query = canViewHidden ? {} : { isHidden: { $ne: true } };

  const stats = await PlayerStats.find(query)
    .sort({ totalKills: -1 })
    .populate("userId", "name photo pubgName rollNumber isVerifiedPlayer")
    .populate("teamId", "name tag")
    .lean();

  return (
    <>
      <PageHero title="Statistics" subtitle="Player performance across all matches" />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <StatsTable
          stats={JSON.parse(JSON.stringify(stats))}
          isAdmin={!!canViewHidden}
        />
      </div>
    </>
  );
}
