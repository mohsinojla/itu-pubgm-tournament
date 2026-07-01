import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import CommunityMember from "@/lib/db/models/CommunityMember";
import { isSuperAdmin } from "@/lib/auth/permissions";

type Params = { params: Promise<{ memberId: string }> };

// PATCH — update role / bio / order / isHighlighted
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const { memberId } = await params;
    const { communityRole, bio, order, isHighlighted } = await request.json();

    await connectDB();
    const member = await CommunityMember.findById(memberId);
    if (!member)
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });

    if (communityRole !== undefined) member.communityRole = communityRole.trim();
    if (bio !== undefined) member.bio = bio?.trim() || undefined;
    if (order !== undefined) member.order = order;
    if (isHighlighted !== undefined) member.isHighlighted = isHighlighted;

    await member.save();
    return NextResponse.json({ success: true, member });
  } catch (err) {
    console.error("PATCH /api/admin/event-community/[memberId] error:", err);
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
  }
}

// DELETE — remove member from community section
export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const { memberId } = await params;
    await connectDB();
    const result = await CommunityMember.findByIdAndDelete(memberId);
    if (!result)
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/event-community/[memberId] error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  }
}
