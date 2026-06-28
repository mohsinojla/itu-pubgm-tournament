import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/lib/db/models/Notification";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  await Notification.updateOne(
    { _id: id, userId: session.user.id },
    { $set: { isRead: true } }
  );

  return NextResponse.json({ success: true });
}
