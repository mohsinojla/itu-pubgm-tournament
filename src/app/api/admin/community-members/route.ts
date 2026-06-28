import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import CommunityMember from "@/lib/db/models/CommunityMember";
import User from "@/lib/db/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const members = await CommunityMember.find()
    .populate("userId", "name photo email degreeProgramme semester")
    .sort({ isHighlighted: -1, order: 1, createdAt: 1 })
    .lean();

  // Also get all registered users for the "add member" dropdown
  const allUsers = await User.find({ profileCompleted: true })
    .select("name email photo")
    .sort({ name: 1 })
    .lean();

  // Exclude users already added as community members
  const existingUserIds = new Set(members.map((m) => m.userId.toString()));
  const availableUsers = allUsers.filter((u) => !existingUserIds.has(u._id.toString()));

  return NextResponse.json({
    members: JSON.parse(JSON.stringify(members)),
    availableUsers: JSON.parse(JSON.stringify(availableUsers)),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, communityRole, bio, order, isHighlighted } = body;

  if (!userId || !communityRole?.trim()) {
    return NextResponse.json({ error: "userId and communityRole are required" }, { status: 400 });
  }

  await connectDB();

  // Verify the user exists and has a completed profile
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await CommunityMember.findOne({ userId });
  if (existing) {
    return NextResponse.json({ error: "This user is already a community member" }, { status: 409 });
  }

  const member = await CommunityMember.create({
    userId,
    communityRole: communityRole.trim(),
    bio: bio?.trim() || undefined,
    order: order ?? 0,
    isHighlighted: isHighlighted ?? false,
  });

  await member.populate("userId", "name photo email degreeProgramme");

  return NextResponse.json({ success: true, member: JSON.parse(JSON.stringify(member)) });
}
