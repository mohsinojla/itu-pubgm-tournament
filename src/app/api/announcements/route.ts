import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Announcement from "@/lib/db/models/Announcement";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { pusherServer } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/constants/pusher-events";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);
  const skip = (page - 1) * limit;

  await connectDB();

  const [announcements, total] = await Promise.all([
    Announcement.find()
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "name photo")
      .lean(),
    Announcement.countDocuments(),
  ]);

  return NextResponse.json({ success: true, announcements, total, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const canPost =
    isSuperAdmin(session.user) ||
    hasPermission(session.user, PERMISSIONS.POST_ANNOUNCEMENTS);
  if (!canPost) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, body, isPinned, category } = await request.json();
    if (!title || !body) {
      return NextResponse.json({ success: false, error: "Title and body are required" }, { status: 400 });
    }

    await connectDB();

    const announcement = await Announcement.create({
      title: title.trim(),
      body,
      isPinned: isPinned ?? false,
      postedBy: session.user.id,
      category: category ?? "general",
    });

    // Real-time broadcast
    const tournament = process.env.TOURNAMENT_ID ?? "main";
    await pusherServer.trigger(
      PUSHER_CHANNELS.tournament(tournament),
      PUSHER_EVENTS.ANNOUNCEMENT_NEW,
      {
        id: announcement._id.toString(),
        title: announcement.title,
        category: announcement.category,
        isPinned: announcement.isPinned,
      }
    );

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json({ success: false, error: "Failed to post announcement" }, { status: 500 });
  }
}
