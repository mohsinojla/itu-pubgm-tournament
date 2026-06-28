import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import { isSuperAdmin } from "@/lib/auth/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const admins = await User.find({ role: { $in: ["admin", "super_admin"] } })
    .select("-password")
    .sort({ role: -1, createdAt: 1 })
    .lean();

  return NextResponse.json({ success: true, admins });
}
