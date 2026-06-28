import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import JoinRequest from "@/lib/db/models/JoinRequest";
import User from "@/lib/db/models/User";

export async function GET(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  await connectDB();

  const team = await Team.findById(teamId).select("leaderId");
  if (!team) return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });

  if (team.leaderId.toString() !== session.user.id) {
    return NextResponse.json({ success: false, error: "Only team leader can view requests" }, { status: 403 });
  }

  const requests = await JoinRequest.find({ teamId, status: "pending" })
    .populate("userId", "name photo pubgName rollNumber semester degreeProgramme isVerifiedPlayer")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, requests });
}

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.profileCompleted) {
    return NextResponse.json({ success: false, error: "Complete your profile first" }, { status: 403 });
  }

  const { teamId } = await params;

  try {
    const { role, message } = await request.json();
    if (!role || !["core", "substitute"].includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

    await connectDB();

    // Check user has PUBG ID and PUBG name set
    const user = await User.findById(session.user.id).select("teamId pubgId pubgName");
    if (!user?.pubgId || !user?.pubgName) {
      return NextResponse.json(
        { success: false, error: "You must set your PUBG ID and PUBG In-Game Name in your profile before joining a team." },
        { status: 400 }
      );
    }

    // Check user is not already in a team
    if (user?.teamId) {
      return NextResponse.json({ success: false, error: "You are already in a team" }, { status: 409 });
    }

    const team = await Team.findById(teamId).select("members leaderId");
    if (!team) return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });

    if (team.members.length >= 5) {
      return NextResponse.json({ success: false, error: "Team is full (5 members max)" }, { status: 409 });
    }

    // Check for pending/approved request
    const existing = await JoinRequest.findOne({
      teamId,
      userId: session.user.id,
      status: "pending",
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "You already have a pending request for this team" }, { status: 409 });
    }

    const joinRequest = await JoinRequest.create({
      teamId,
      userId: session.user.id,
      requestedRole: role,
      message: message?.trim() || undefined,
      status: "pending",
    });

    return NextResponse.json({ success: true, joinRequest }, { status: 201 });
  } catch (error) {
    console.error("POST /join-requests error:", error);
    return NextResponse.json({ success: false, error: "Failed to send request" }, { status: 500 });
  }
}
