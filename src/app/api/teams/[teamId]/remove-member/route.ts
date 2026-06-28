import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import User from "@/lib/db/models/User";
import Notification from "@/lib/db/models/Notification";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const { memberId } = await request.json();

  if (!memberId) {
    return NextResponse.json({ success: false, error: "memberId is required" }, { status: 400 });
  }

  await connectDB();

  const team = await Team.findById(teamId);
  if (!team) return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });

  const isLeader = team.leaderId.toString() === session.user.id;
  const isAdmin =
    isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_TEAMS);

  if (!isLeader && !isAdmin) {
    return NextResponse.json({ success: false, error: "Only team leader or admin can remove members" }, { status: 403 });
  }

  // Cannot remove the leader via this route — use transfer-leadership first
  if (memberId === team.leaderId.toString()) {
    return NextResponse.json(
      { success: false, error: "Leader cannot be removed. Transfer leadership first." },
      { status: 400 }
    );
  }

  const wasMember = team.members.some(
    (m: { userId: { toString: () => string } }) => m.userId.toString() === memberId
  );
  if (!wasMember) {
    return NextResponse.json({ success: false, error: "User is not a member of this team" }, { status: 404 });
  }

  await Team.findByIdAndUpdate(teamId, {
    $pull: { members: { userId: memberId } },
  });

  await User.findByIdAndUpdate(memberId, {
    $unset: { teamId: "", isTeamLeader: "" },
  });

  await Notification.create({
    userId: memberId,
    type: "member_removed",
    title: "Removed from Team",
    message: `You have been removed from ${team.name}.`,
    link: "/teams",
  });

  return NextResponse.json({ success: true });
}
