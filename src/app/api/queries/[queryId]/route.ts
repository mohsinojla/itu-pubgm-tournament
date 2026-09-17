import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Query from "@/lib/db/models/Query";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

const VALID_STATUSES = ["pending", "in_progress", "resolved"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const canManage =
    isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_QUERIES);
  if (!canManage) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { queryId } = await params;
  const { status, adminReply } = await request.json();

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
  }

  await connectDB();
  const query = await Query.findByIdAndUpdate(
    queryId,
    {
      ...(status ? { status, resolvedBy: session.user.id } : {}),
      ...(adminReply !== undefined ? { adminReply } : {}),
    },
    { new: true }
  );

  if (!query) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, query });
}
