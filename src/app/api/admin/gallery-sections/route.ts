import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import GallerySection from "@/lib/db/models/GallerySection";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function GET() {
  await connectDB();
  const sections = await GallerySection.find()
    .sort({ order: 1, createdAt: 1 })
    .lean();
  return NextResponse.json({ success: true, sections });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const canManage =
    isSuperAdmin(session.user) ||
    hasPermission(session.user, PERMISSIONS.MANAGE_GALLERY);
  if (!canManage) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, description, order } = await request.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "name is required" }, { status: 400 });
    }

    await connectDB();

    const existing = await GallerySection.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ success: false, error: "A section with this name already exists" }, { status: 409 });
    }

    const section = await GallerySection.create({
      name: name.trim(),
      description: description?.trim(),
      order: order ?? 0,
    });

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/gallery-sections error:", error);
    return NextResponse.json({ success: false, error: "Failed to create section" }, { status: 500 });
  }
}
