import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import AdminTeamMember from "@/lib/db/models/AdminTeamMember";
import { isSuperAdmin } from "@/lib/auth/permissions";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { memberId } = await params;
  const body = await request.json();
  await connectDB();

  const member = await AdminTeamMember.findByIdAndUpdate(
    memberId,
    { $set: body },
    { new: true, runValidators: true }
  );
  if (!member) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, member });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { memberId } = await params;
  await connectDB();
  await AdminTeamMember.findByIdAndDelete(memberId);
  return NextResponse.json({ success: true });
}
