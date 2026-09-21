import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import Team from "@/lib/db/models/Team";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { z } from "zod";

function checkAccess(user: { role: string; permissions: string[] }) {
  return isSuperAdmin(user) || hasPermission(user, PERMISSIONS.MANAGE_PLAYERS);
}

// Profile fields an admin may edit on any player. Mirrors the rules players
// themselves are held to (see completeProfileSchema), each optional so a
// partial update only touches what was sent.
const PROFILE_KEYS = [
  "name", "rollNumber", "pubgId", "pubgName", "gender", "semester", "degreeProgramme", "whatsapp",
] as const;

const adminProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    rollNumber: z.string().trim().min(2, "Roll number is required").max(30, "Roll number too long"),
    pubgId: z.string().trim().regex(/^\d{7,12}$/, "PUBG ID must be 7-12 digits").or(z.literal("")),
    pubgName: z.string().trim().max(50, "PUBG name too long"),
    gender: z.enum(["male", "female", "other"]),
    semester: z.number().int().min(1).max(8),
    degreeProgramme: z.string().trim().min(1, "Degree programme is required"),
    whatsapp: z
      .string()
      .trim()
      .regex(/^(\+92|0)3[0-9]{9}$/, "Enter a valid Pakistani number e.g. 03001234567")
      .or(z.literal("")),
  })
  .partial();

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

  // Profile edits — validated, and a regular admin can't touch the super admin's data.
  const profileInput: Record<string, unknown> = {};
  for (const key of PROFILE_KEYS) {
    if (body[key] !== undefined) profileInput[key] = body[key];
  }
  if (Object.keys(profileInput).length > 0) {
    const target = await User.findById(userId).select("role");
    if (!target) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    if (target.role === "super_admin" && !isSuperAdmin(session.user)) {
      return NextResponse.json({ success: false, error: "Only the super admin can edit the super admin's profile" }, { status: 403 });
    }

    const parsed = adminProfileSchema.safeParse(profileInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join(".");
      return NextResponse.json(
        { success: false, error: field ? `${field}: ${issue.message}` : issue.message },
        { status: 400 }
      );
    }

    if (parsed.data.rollNumber) {
      const taken = await User.findOne({ rollNumber: parsed.data.rollNumber, _id: { $ne: userId } }).select("_id");
      if (taken) {
        return NextResponse.json({ success: false, error: "This roll number is already registered" }, { status: 409 });
      }
    }
    Object.assign(updates, parsed.data);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
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

  if (user.role === "super_admin") {
    return NextResponse.json({ success: false, error: "Cannot delete the super admin account" }, { status: 403 });
  }

  // Only the super admin can remove another admin's account — a regular
  // admin (MANAGE_PLAYERS is enough to reach this route) must not be able
  // to delete a fellow admin, only players.
  if (user.role === "admin" && !isSuperAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Only the super admin can remove an admin account" }, { status: 403 });
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
