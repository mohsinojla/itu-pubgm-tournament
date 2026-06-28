import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { connectDB } from "@/lib/db/mongoose";
import Match from "@/lib/db/models/Match";
import MatchResultsPanel from "@/components/admin/MatchResultsPanel";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  const session = await auth();
  if (!session?.user?.id || !hasPermission(session.user, PERMISSIONS.MANAGE_RESULTS)) {
    redirect("/admin");
  }

  await connectDB();
  const matches = await Match.find({ status: { $ne: "cancelled" } })
    .populate({
      path: "teams",
      select: "name tag members leaderId",
      populate: [
        { path: "members.userId", select: "name pubgName" },
        { path: "leaderId", select: "name pubgName" },
      ],
    })
    .sort({ matchNumber: 1 })
    .lean();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Post Match Results</h1>
      <MatchResultsPanel matches={JSON.parse(JSON.stringify(matches))} />
    </div>
  );
}
