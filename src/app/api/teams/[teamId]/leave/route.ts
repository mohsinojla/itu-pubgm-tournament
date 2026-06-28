import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import User from "@/lib/db/models/User";
import { ITeamMember } from "@/lib/db/models/Team";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  await connectDB();

  const team = await Team.findById(teamId);
  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const isMember = team.members.some(
    (m: ITeamMember) => m.userId.toString() === userId
  );
  if (!isMember) {
    return NextResponse.json({ success: false, error: "You are not a member of this team" }, { status: 400 });
  }

  const isLeader = team.leaderId.toString() === userId;
  const otherMembers = team.members.filter(
    (m: ITeamMember) => m.userId.toString() !== userId
  );

  // Clear current user from team
  await User.findByIdAndUpdate(userId, { $unset: { teamId: "", isTeamLeader: "" } });

  if (otherMembers.length === 0) {
    // Last person leaving — delete the team
    await team.deleteOne();
    return NextResponse.json({ success: true, teamDeleted: true });
  }

  if (isLeader) {
    // Auto-promote the first remaining member
    const newLeader = otherMembers[0];
    team.leaderId = newLeader.userId;
    team.members = otherMembers;
    await team.save();
    await User.findByIdAndUpdate(newLeader.userId, { isTeamLeader: true });
    return NextResponse.json({ success: true, newLeaderId: newLeader.userId.toString() });
  }

  // Regular member leaving
  team.members = otherMembers;
  await team.save();
  return NextResponse.json({ success: true });
}
