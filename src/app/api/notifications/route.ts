import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/lib/db/models/Notification";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const notifications = await Notification.find({
    userId: session.user.id,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({ success: true, notifications, unreadCount });
}
