import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import GallerySection from "@/lib/db/models/GallerySection";
import Gallery from "@/lib/db/models/Gallery";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

type Params = { params: Promise<{ sectionId: string }> };

export async function PATCH(request: Request, { params }: Params) {
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
    const { sectionId } = await params;
    const { name, description, order } = await request.json();

    await connectDB();

    const section = await GallerySection.findById(sectionId);
    if (!section) {
      return NextResponse.json({ success: false, error: "Section not found" }, { status: 404 });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ success: false, error: "name must be a non-empty string" }, { status: 400 });
      }
      const duplicate = await GallerySection.findOne({
        name: name.trim(),
        _id: { $ne: sectionId },
      });
      if (duplicate) {
        return NextResponse.json({ success: false, error: "A section with this name already exists" }, { status: 409 });
      }
      section.name = name.trim();
    }

    if (description !== undefined) {
      section.description = description?.trim() ?? undefined;
    }

    if (order !== undefined) {
      section.order = order;
    }

    await section.save();

    return NextResponse.json({ success: true, section });
  } catch (error) {
    console.error("PATCH /api/admin/gallery-sections/[sectionId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
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
    const { sectionId } = await params;

    await connectDB();

    const section = await GallerySection.findById(sectionId);
    if (!section) {
      return NextResponse.json({ success: false, error: "Section not found" }, { status: 404 });
    }

    // Clear sectionId from all Gallery items belonging to this section
    await Gallery.updateMany(
      { sectionId: section._id },
      { $unset: { sectionId: "" } }
    );

    await GallerySection.findByIdAndDelete(sectionId);

    return NextResponse.json({ success: true, message: "Section deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/gallery-sections/[sectionId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete section" }, { status: 500 });
  }
}
