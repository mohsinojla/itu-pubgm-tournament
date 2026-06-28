import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Announcement from "@/lib/db/models/Announcement";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

function canManage(user: { role: string; permissions: string[] }) {
  return isSuperAdmin(user) || hasPermission(user, PERMISSIONS.POST_ANNOUNCEMENTS);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !canManage(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const allowed = ["title", "body", "isPinned", "category"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  await connectDB();
  const announcement = await Announcement.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true }
  );
  if (!announcement) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, announcement });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !canManage(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await connectDB();
  await Announcement.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
