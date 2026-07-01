import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import { isSuperAdmin } from "@/lib/auth/permissions";

// GET /api/admin/users/search?q=<query>
// Returns users whose name or email match the query (case-insensitive, limit 10)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2)
    return NextResponse.json({ success: true, users: [] });

  await connectDB();

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const users = await User.find({
    $or: [{ name: regex }, { email: regex }],
  })
    .select("_id name email photo degreeProgramme")
    .limit(10)
    .lean();

  return NextResponse.json({ success: true, users });
}
