import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import CommunityMember from "@/lib/db/models/CommunityMember";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { memberId } = await params;
  const body = await request.json();
  const { communityRole, bio, order, isHighlighted } = body;

  await connectDB();

  const member = await CommunityMember.findById(memberId);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (communityRole !== undefined) member.communityRole = communityRole.trim();
  if (bio !== undefined) member.bio = bio?.trim() || undefined;
  if (order !== undefined) member.order = order;
  if (isHighlighted !== undefined) member.isHighlighted = isHighlighted;

  await member.save();
  await member.populate("userId", "name photo email degreeProgramme");

  return NextResponse.json({ success: true, member: JSON.parse(JSON.stringify(member)) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { memberId } = await params;

  await connectDB();
  await CommunityMember.findByIdAndDelete(memberId);

  return NextResponse.json({ success: true });
}
