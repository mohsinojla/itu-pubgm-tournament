import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import mongoose from "mongoose";
import Team from "@/lib/db/models/Team";
import JoinRequest from "@/lib/db/models/JoinRequest";
import User from "@/lib/db/models/User";
import Notification from "@/lib/db/models/Notification";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string; reqId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, reqId } = await params;
  const { action } = await request.json(); // "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  }

  await connectDB();

  const team = await Team.findById(teamId);
  if (!team) return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });

  if (team.leaderId.toString() !== session.user.id) {
    return NextResponse.json({ success: false, error: "Only team leader can decide requests" }, { status: 403 });
  }

  const joinRequest = await JoinRequest.findOne({ _id: reqId, teamId, status: "pending" });
  if (!joinRequest) {
    return NextResponse.json({ success: false, error: "Request not found or already decided" }, { status: 404 });
  }

  if (action === "reject") {
    joinRequest.status = "rejected";
    joinRequest.decidedAt = new Date();
    joinRequest.decidedBy = new mongoose.Types.ObjectId(session.user.id);
    await joinRequest.save();

    await Notification.create({
      userId: joinRequest.userId,
      type: "join_rejected",
      title: "Join Request Rejected",
      message: `Your request to join ${team.name} was declined.`,
      link: `/teams/${teamId}`,
    });

    return NextResponse.json({ success: true });
  }

  // Approve — atomic guard: only if team has < 5 members
  const updated = await Team.findOneAndUpdate(
    { _id: teamId, "members.4": { $exists: false } },
    {
      $push: {
        members: {
          userId: joinRequest.userId,
          role: joinRequest.requestedRole,
          joinedAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ success: false, error: "Team is now full" }, { status: 409 });
  }

  // Mark request approved + update user
  joinRequest.status = "approved";
  joinRequest.decidedAt = new Date();
  joinRequest.decidedBy = new mongoose.Types.ObjectId(session.user.id);
  await joinRequest.save();

  await User.findByIdAndUpdate(joinRequest.userId, {
    teamId,
    isTeamLeader: false,
  });

  // Reject all other pending requests from this user
  await JoinRequest.updateMany(
    { userId: joinRequest.userId, status: "pending", _id: { $ne: reqId } },
    { $set: { status: "rejected", decidedAt: new Date() } }
  );

  await Notification.create({
    userId: joinRequest.userId,
    type: "join_approved",
    title: "Join Request Approved!",
    message: `You are now a member of ${team.name}. Welcome!`,
    link: `/teams/${teamId}`,
  });

  return NextResponse.json({ success: true });
}
