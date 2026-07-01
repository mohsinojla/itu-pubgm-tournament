import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import CommunityMember from "@/lib/db/models/CommunityMember";
import { isSuperAdmin } from "@/lib/auth/permissions";

// GET  /api/admin/event-community?eventId=<id>   — list members for an event (or all if no eventId)
// POST /api/admin/event-community                — add a member to an event
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  await connectDB();
  const filter = eventId ? { eventId } : {};
  const members = await CommunityMember.find(filter)
    .populate("userId", "name photo email degreeProgramme")
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return NextResponse.json({ success: true, members });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const { userId, eventId, communityRole, bio, order, isHighlighted } = await request.json();

    if (!userId || !communityRole?.trim())
      return NextResponse.json({ success: false, error: "userId and communityRole are required" }, { status: 400 });

    await connectDB();

    const existing = await CommunityMember.findOne({
      userId,
      eventId: eventId ?? null,
    });
    if (existing)
      return NextResponse.json(
        { success: false, error: "This person is already in that community section" },
        { status: 409 }
      );

    const member = await CommunityMember.create({
      userId,
      eventId: eventId ?? null,
      communityRole: communityRole.trim(),
      bio: bio?.trim() || undefined,
      order: order ?? 0,
      isHighlighted: isHighlighted ?? false,
    });

    const populated = await member.populate("userId", "name photo email degreeProgramme");
    return NextResponse.json({ success: true, member: populated }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/event-community error:", err);
    return NextResponse.json({ success: false, error: "Failed to add member" }, { status: 500 });
  }
}
