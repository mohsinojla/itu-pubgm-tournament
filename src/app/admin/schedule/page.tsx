import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { connectDB } from "@/lib/db/mongoose";
import Match from "@/lib/db/models/Match";
import Team from "@/lib/db/models/Team";
import MatchSchedulePanel from "@/components/admin/MatchSchedulePanel";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user, PERMISSIONS.MANAGE_SCHEDULE)) {
    redirect("/admin");
  }

  await connectDB();
  const [matches, teams] = await Promise.all([
    Match.find()
      .populate("teams", "name tag logo")
      .sort({ scheduledAt: 1, matchNumber: 1 })
      .lean(),
    Team.find({ isRegistered: true }).select("name tag").sort({ name: 1 }).lean(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Match Schedule</h1>
      <MatchSchedulePanel
        initialMatches={JSON.parse(JSON.stringify(matches))}
        teams={JSON.parse(JSON.stringify(teams))}
      />
    </div>
  );
}
