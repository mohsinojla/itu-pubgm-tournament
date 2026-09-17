import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import PlayerStats from "@/lib/db/models/PlayerStats";
import { getSiteSettings } from "@/lib/db/models/SiteSettings";
import PageHero from "@/components/common/PageHero";
import ComingSoon from "@/components/common/ComingSoon";
import DemographicsCharts from "@/components/stats/DemographicsCharts";
import StatsTable from "@/components/stats/StatsTable";
import StatsVisibilityToggle from "@/components/stats/StatsVisibilityToggle";
import { isAdmin } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const [session] = await Promise.all([auth(), connectDB()]);
  const admin = !!session?.user && isAdmin(session.user);

  const settings = await getSiteSettings();

  if (!settings.statsPageVisible && !admin) {
    return (
      <ComingSoon
        title="Tournament Stats"
        description="Statistics will be published here soon. Check back later!"
      />
    );
  }

  const [users, playerStats] = await Promise.all([
    User.find({
      profileCompleted: true,
      role: "player",
      teamId: { $exists: true, $ne: null },
    })
      .select("gender degreeProgramme semester")
      .lean(),
    PlayerStats.find(admin ? {} : { isHidden: { $ne: true } })
      .populate("userId", "name pubgName photo isVerifiedPlayer")
      .populate("teamId", "name")
      .sort({ totalKills: -1 })
      .lean(),
  ]);

  const genderMap: Record<string, number> = { male: 0, female: 0, other: 0 };
  const degreeMap: Record<string, number> = {};
  const deptMap: Record<string, number> = {};
  const semesterMap: Record<string, number> = {};

  for (const u of users) {
    genderMap[u.gender ?? "other"] = (genderMap[u.gender ?? "other"] ?? 0) + 1;

    if (u.degreeProgramme) {
      const parts = (u.degreeProgramme as string).split(" ");
      const level = parts[0]; // BS / MS / PhD
      const dept = parts.slice(1).join(" ");
      degreeMap[level] = (degreeMap[level] ?? 0) + 1;
      if (dept) deptMap[dept] = (deptMap[dept] ?? 0) + 1;
    }

    if (u.semester) {
      const key = String(u.semester);
      semesterMap[key] = (semesterMap[key] ?? 0) + 1;
    }
  }

  return (
    <>
      <PageHero title="Tournament Stats" subtitle="Player leaderboard & registration demographics" />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {admin && (
          <div className="flex justify-end">
            <StatsVisibilityToggle visible={settings.statsPageVisible} />
          </div>
        )}

        <StatsTable
          stats={JSON.parse(JSON.stringify(playerStats))}
          isAdmin={admin}
          canHide={admin}
        />

        <DemographicsCharts
          total={users.length}
          gender={genderMap}
          degreeLevel={degreeMap}
          department={deptMap}
          semester={semesterMap}
        />
      </div>
    </>
  );
}
