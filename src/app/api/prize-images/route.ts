import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import PrizeImage from "@/lib/db/models/PrizeImage";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function GET() {
  await connectDB();
  const images = await PrizeImage.find().sort({ order: 1, createdAt: -1 }).lean();
  return NextResponse.json({ success: true, images });
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
    const { url, publicId, caption } = await request.json();
    if (!url || !publicId) {
      return NextResponse.json({ success: false, error: "url and publicId are required" }, { status: 400 });
    }

    await connectDB();
    const image = await PrizeImage.create({
      url,
      publicId,
      caption,
      uploadedBy: session.user.id,
    });

    return NextResponse.json({ success: true, image }, { status: 201 });
  } catch (error) {
    console.error("POST /api/prize-images error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
