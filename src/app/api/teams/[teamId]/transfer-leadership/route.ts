import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import User from "@/lib/db/models/User";
import Notification from "@/lib/db/models/Notification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const { newLeaderId } = await request.json();

  if (!newLeaderId) {
    return NextResponse.json({ success: false, error: "newLeaderId is required" }, { status: 400 });
  }

  await connectDB();

  const team = await Team.findById(teamId);
  if (!team) return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });

  if (team.leaderId.toString() !== session.user.id) {
    return NextResponse.json({ success: false, error: "Only current leader can transfer leadership" }, { status: 403 });
  }

  // Ensure new leader is a team member
  const isMember = team.members.some(
    (m: { userId: { toString: () => string } }) => m.userId.toString() === newLeaderId
  );
  if (!isMember) {
    return NextResponse.json({ success: false, error: "New leader must be a team member" }, { status: 400 });
  }

  // Transfer
  team.leaderId = newLeaderId;
  await team.save();

  await Promise.all([
    User.findByIdAndUpdate(session.user.id, { isTeamLeader: false }),
    User.findByIdAndUpdate(newLeaderId, { isTeamLeader: true }),
  ]);

  await Notification.create({
    userId: newLeaderId,
    type: "leadership_transferred",
    title: "You are now Team Leader!",
    message: `Leadership of ${team.name} has been transferred to you.`,
    link: `/teams/${teamId}`,
  });

  return NextResponse.json({ success: true });
}
