import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Gallery from "@/lib/db/models/Gallery";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function GET() {
  await connectDB();
  const items = await Gallery.find()
    .sort({ order: 1, createdAt: -1 })
    .populate("uploadedBy", "name")
    .lean();
  return NextResponse.json({ success: true, items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const canUpload =
    isSuperAdmin(session.user) ||
    hasPermission(session.user, PERMISSIONS.MANAGE_GALLERY);
  if (!canUpload) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { type, url, publicId, thumbnail, caption, tags } = await request.json();
    if (!type || !url || !publicId) {
      return NextResponse.json({ success: false, error: "type, url, and publicId are required" }, { status: 400 });
    }

    await connectDB();
    const item = await Gallery.create({
      type,
      url,
      publicId,
      thumbnail,
      caption,
      tags: tags ?? [],
      uploadedBy: session.user.id,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/gallery error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
