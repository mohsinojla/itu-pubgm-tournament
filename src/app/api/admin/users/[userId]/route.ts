import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import Team from "@/lib/db/models/Team";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

function checkAccess(user: { role: string; permissions: string[] }) {
  return isSuperAdmin(user) || hasPermission(user, PERMISSIONS.MANAGE_PLAYERS);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !checkAccess(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await request.json();

  const allowed = ["isVerifiedPlayer", "statsHidden", "role", "permissions"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // Only super admin can change roles / permissions
  if ((updates.role || updates.permissions) && !isSuperAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Only super admin can change roles" }, { status: 403 });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true }
  ).select("-password");

  if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

  return NextResponse.json({ success: true, user });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !checkAccess(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  // Cannot delete yourself
  if (userId === session.user.id) {
    return NextResponse.json({ success: false, error: "Cannot delete your own account" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

  // Only super_admin can delete another super_admin (and even then it's guarded above for self)
  if (user.role === "super_admin") {
    return NextResponse.json({ success: false, error: "Cannot delete the super admin account" }, { status: 403 });
  }

  // Remove from team
  if (user.teamId) {
    const team = await Team.findById(user.teamId);
    if (team) {
      if (team.leaderId.toString() === userId) {
        // If deleting a leader and team has other members, promote next member
        const otherMembers = team.members.filter(
          (m: { userId: { toString: () => string } }) => m.userId.toString() !== userId
        );
        if (otherMembers.length > 0) {
          team.leaderId = otherMembers[0].userId;
          await User.findByIdAndUpdate(otherMembers[0].userId, { isTeamLeader: true });
        } else {
          await team.deleteOne();
        }
      }
      if (team && !team.isNew) {
        await Team.findByIdAndUpdate(user.teamId, {
          $pull: { members: { userId } },
        });
      }
    }
  }

  await user.deleteOne();
  return NextResponse.json({ success: true });
}
