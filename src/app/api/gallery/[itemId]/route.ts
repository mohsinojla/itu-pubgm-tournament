import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Gallery from "@/lib/db/models/Gallery";
import { cloudinary } from "@/lib/cloudinary/config";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const canDelete =
    isSuperAdmin(session.user) ||
    hasPermission(session.user, PERMISSIONS.MANAGE_GALLERY);
  if (!canDelete) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { itemId } = await params;
  await connectDB();

  const item = await Gallery.findById(itemId);
  if (!item) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(item.publicId, { resource_type: item.type });
  } catch {
    // Continue even if Cloudinary delete fails
  }

  await item.deleteOne();
  return NextResponse.json({ success: true });
}
