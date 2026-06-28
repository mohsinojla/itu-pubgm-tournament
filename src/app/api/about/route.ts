import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import AdminTeamMember from "@/lib/db/models/AdminTeamMember";
import { isSuperAdmin } from "@/lib/auth/permissions";

export async function GET() {
  await connectDB();
  const members = await AdminTeamMember.find().sort({ order: 1, createdAt: 1 }).lean();
  return NextResponse.json({ success: true, members });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, role, photo, bio, socials, order, isHighlighted } = await request.json();
    if (!name || !role) {
      return NextResponse.json({ success: false, error: "Name and role are required" }, { status: 400 });
    }

    await connectDB();
    const member = await AdminTeamMember.create({
      name: name.trim(),
      role: role.trim(),
      photo,
      bio,
      socials,
      order: order ?? 999,
      isHighlighted: isHighlighted ?? false,
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    console.error("POST /api/about error:", error);
    return NextResponse.json({ success: false, error: "Failed to create member" }, { status: 500 });
  }
}
