import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import GallerySection from "@/lib/db/models/GallerySection";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

// POST /api/admin/gallery-sections/reorder
// Body: [{ id: string, order: number }, ...]
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const canManage =
    isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_GALLERY);
  if (!canManage)
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const items: { id: string; order: number }[] = await request.json();
    if (!Array.isArray(items))
      return NextResponse.json({ success: false, error: "Expected array" }, { status: 400 });

    await connectDB();

    await Promise.all(
      items.map(({ id, order }) =>
        GallerySection.findByIdAndUpdate(id, { order })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/admin/gallery-sections/reorder error:", err);
    return NextResponse.json({ success: false, error: "Failed to reorder" }, { status: 500 });
  }
}
