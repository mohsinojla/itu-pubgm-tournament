import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Query from "@/lib/db/models/Query";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const canManage =
    isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_QUERIES);

  const queries = await Query.find(canManage ? {} : { userId: session.user.id })
    .sort({ createdAt: -1 })
    .populate("userId", "name email photo pubgName")
    .lean();

  return NextResponse.json({ success: true, queries });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subject, message } = await request.json();
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: "Subject and message are required" }, { status: 400 });
    }

    await connectDB();
    const query = await Query.create({
      userId: session.user.id,
      subject: subject.trim(),
      message: message.trim(),
    });

    return NextResponse.json({ success: true, query }, { status: 201 });
  } catch (error) {
    console.error("POST /api/queries error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit query" }, { status: 500 });
  }
}
