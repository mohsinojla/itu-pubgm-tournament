import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import JoinRequest from "@/lib/db/models/JoinRequest";
import TeamDetail from "@/components/team/TeamDetail";
import PageHero from "@/components/common/PageHero";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [session] = await Promise.all([auth(), connectDB()]);

  const team = await Team.findById(teamId)
    .populate("leaderId", "name photo pubgName isVerifiedPlayer _id whatsapp")
    .populate("members.userId", "name photo pubgName isVerifiedPlayer rollNumber _id whatsapp")
    .lean();

  if (!team) notFound();

  const teamJson = JSON.parse(JSON.stringify(team));

  // Determine if the viewer is a team member
  const viewerIsTeamMember =
    !!session?.user?.id &&
    teamJson.members.some(
      (m: { userId: { _id: string } }) => m.userId._id === session!.user.id
    );

  // Non-members can only see the leader's WhatsApp. Strip from other members.
  if (!viewerIsTeamMember) {
    teamJson.members = teamJson.members.map(
      (m: { userId: Record<string, unknown>; role: string; joinedAt: string }) =>
        m.userId._id === teamJson.leaderId._id
          ? m
          : { ...m, userId: { ...m.userId, whatsapp: undefined } }
    );
  }

  // Fetch join requests if current user is the leader
  let joinRequests: unknown[] = [];
  if (session?.user?.id === teamJson.leaderId._id) {
    joinRequests = await JoinRequest.find({ teamId, status: "pending" })
      .populate("userId", "name photo pubgName rollNumber isVerifiedPlayer _id")
      .sort({ createdAt: -1 })
      .lean();
    joinRequests = JSON.parse(JSON.stringify(joinRequests));
  }

  // Check if current user has a pending request for this team
  let myPendingRequest = null;
  if (session?.user?.id && session.user.id !== teamJson.leaderId._id) {
    const req = await JoinRequest.findOne({
      teamId,
      userId: session.user.id,
      status: "pending",
    }).lean();
    if (req) myPendingRequest = JSON.parse(JSON.stringify(req));
  }

  return (
    <>
      <PageHero
        title={teamJson.name}
        subtitle={`[${teamJson.tag}] · ${teamJson.members.length} member${teamJson.members.length !== 1 ? "s" : ""}`}
      />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <TeamDetail
          team={teamJson}
          currentUserId={session?.user?.id}
          joinRequests={joinRequests as never[]}
          myPendingRequest={myPendingRequest as never}
        />
      </div>
    </>
  );
}
