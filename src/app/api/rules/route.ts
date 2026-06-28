import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Rules from "@/lib/db/models/Rules";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function GET() {
  await connectDB();
  const rules = await Rules.findOne().lean();
  return NextResponse.json({ success: true, rules });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const canEdit =
    isSuperAdmin(session.user) ||
    hasPermission(session.user, PERMISSIONS.POST_ANNOUNCEMENTS);
  if (!canEdit) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { content } = await request.json();
  if (!content) {
    return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
  }

  await connectDB();
  const rules = await Rules.findOneAndUpdate(
    {},
    { content, lastEditedBy: session.user.id },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true, rules });
}
