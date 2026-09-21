import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/lib/auth/auth";
import { isAdmin, isSuperAdmin } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import User from "@/lib/db/models/User";
import JoinRequest from "@/lib/db/models/JoinRequest";
import Notification from "@/lib/db/models/Notification";
import { detachUserFromTeam } from "@/lib/teams/helpers";

// PUT /api/admin/users/[userId]/team
// Body: { teamId: string | null, role?: "core" | "substitute" }
// Assigns the player to any team (moving them out of their current one), or
// removes them from their team when teamId is null. Bypasses join requests and
// the player edit lock.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  if (!isValidObjectId(userId)) {
    return NextResponse.json({ success: false, error: "Invalid player" }, { status: 400 });
  }

  const body = await request.json();
  const targetTeamId: string | null = body.teamId ?? null;
  const role: "core" | "substitute" = body.role === "substitute" ? "substitute" : "core";

  if (targetTeamId !== null && !isValidObjectId(targetTeamId)) {
    return NextResponse.json({ success: false, error: "Invalid team" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(userId).select("name teamId role");
  if (!user) {
    return NextResponse.json({ success: false, error: "Player not found" }, { status: 404 });
  }
  if (user.role === "super_admin" && !isSuperAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Only the super admin can change their own team" }, { status: 403 });
  }

  // ── Remove from team ─────────────────────────────────────────────────────
  if (targetTeamId === null) {
    const result = await detachUserFromTeam(userId);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }
    if (result.team) {
      await Notification.create({
        userId,
        type: "member_removed",
        title: "Removed from Team",
        message: `An admin removed you from ${result.team.name}.`,
        link: "/teams",
      });
    }
    return NextResponse.json({ success: true });
  }

  // ── Assign to team ───────────────────────────────────────────────────────
  const team = await Team.findById(targetTeamId);
  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  // Already on this team → only the role can change.
  const alreadyMember = team.members.some(
    (m: { userId: { toString: () => string } }) => m.userId.toString() === userId
  );
  if (alreadyMember) {
    await Team.updateOne(
      { _id: team._id, "members.userId": user._id },
      { $set: { "members.$.role": role } }
    );
    return NextResponse.json({ success: true });
  }

  if (team.members.length >= 5) {
    return NextResponse.json({ success: false, error: `${team.name} is full (5 members max)` }, { status: 409 });
  }

  // If the player is on a different team, make sure they can be taken off it
  // BEFORE adding them here, so a refusal leaves everything untouched.
  if (user.teamId) {
    const current = await Team.findById(user.teamId).select("members name");
    if (current && current.members.length <= 1) {
      return NextResponse.json(
        {
          success: false,
          error: `This player is the only member of "${current.name}". Add another player to that team first, or delete the team from Team Management.`,
        },
        { status: 409 }
      );
    }
  }

  // Atomic add — guards against the team filling up between the check above
  // and this write.
  const updated = await Team.findOneAndUpdate(
    { _id: team._id, "members.4": { $exists: false } },
    { $push: { members: { userId: user._id, role, joinedAt: new Date() } } },
    { new: true }
  );
  if (!updated) {
    return NextResponse.json({ success: false, error: `${team.name} is full (5 members max)` }, { status: 409 });
  }

  if (user.teamId) {
    const detached = await detachUserFromTeam(userId);
    if (!detached.ok) {
      // Undo the add so the player isn't left on two rosters.
      await Team.updateOne({ _id: team._id }, { $pull: { members: { userId: user._id } } });
      return NextResponse.json({ success: false, error: detached.error }, { status: 409 });
    }
  }

  await User.findByIdAndUpdate(userId, { teamId: team._id, isTeamLeader: false });

  // Any join requests the player had open are now moot.
  await JoinRequest.updateMany(
    { userId, status: "pending" },
    { $set: { status: "rejected", decidedAt: new Date() } }
  );

  await Notification.create({
    userId,
    type: "join_approved",
    title: "Added to a Team",
    message: `An admin added you to ${team.name}.`,
    link: `/teams/${team._id}`,
  });

  return NextResponse.json({ success: true });
}
