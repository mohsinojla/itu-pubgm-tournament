import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import PageHero from "@/components/common/PageHero";
import DemographicsCharts from "@/components/stats/DemographicsCharts";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  await connectDB();

  const users = await User.find({
    profileCompleted: true,
    role: "player",
    teamId: { $exists: true, $ne: null },
  })
    .select("gender degreeProgramme semester")
    .lean();

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
      <PageHero title="Tournament Stats" subtitle="Demographics of registered team players" />
      <div className="max-w-5xl mx-auto px-4 py-10">
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
