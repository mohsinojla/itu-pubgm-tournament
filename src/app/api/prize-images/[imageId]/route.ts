import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import PrizeImage from "@/lib/db/models/PrizeImage";
import { cloudinary } from "@/lib/cloudinary/config";
import { isSuperAdmin } from "@/lib/auth/permissions";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Only the super admin can delete media — regular admins can upload but not remove it.
  if (!isSuperAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { imageId } = await params;
  await connectDB();

  const image = await PrizeImage.findById(imageId);
  if (!image) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  try {
    await cloudinary.uploader.destroy(image.publicId, { resource_type: "image" });
  } catch {
    // Continue even if Cloudinary delete fails
  }

  await image.deleteOne();
  return NextResponse.json({ success: true });
}
