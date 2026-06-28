import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/lib/db/models/Notification";

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  await Notification.updateMany(
    { userId: session.user.id, isRead: false },
    { $set: { isRead: true } }
  );

  return NextResponse.json({ success: true });
}
