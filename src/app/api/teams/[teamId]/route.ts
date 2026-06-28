import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import User from "@/lib/db/models/User";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  await connectDB();

  const team = await Team.findById(teamId)
    .populate("leaderId", "name photo pubgName isVerifiedPlayer")
    .populate("members.userId", "name photo pubgName isVerifiedPlayer rollNumber")
    .lean();

  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, team });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
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

  const isLeader = team.leaderId.toString() === session.user.id;
  const isAdmin =
    isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_TEAMS);

  if (!isLeader && !isAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const allowed = ["name", "tag", "logo"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (updates.tag) updates.tag = (updates.tag as string).toUpperCase().trim();
  if (updates.name) updates.name = (updates.name as string).trim();

  try {
    const updated = await Team.findByIdAndUpdate(
      teamId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    return NextResponse.json({ success: true, team: updated });
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return NextResponse.json({ success: false, error: "Name or tag already taken" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
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

  const isLeader = team.leaderId.toString() === session.user.id;
  const isAdmin =
    isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_TEAMS);

  if (!isLeader && !isAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Remove team reference from all members
  const memberIds = team.members.map((m: { userId: { toString: () => string } }) => m.userId.toString());
  await User.updateMany(
    { _id: { $in: memberIds } },
    { $unset: { teamId: "", isTeamLeader: "" } }
  );

  await team.deleteOne();

  return NextResponse.json({ success: true });
}
