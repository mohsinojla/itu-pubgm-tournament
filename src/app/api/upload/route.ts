import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSignedUploadParams } from "@/lib/cloudinary/config";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { folder, resourceType } = await request.json();

    // Gallery uploads are admin-only; avatar uploads are for all authenticated users
    if (folder === "gallery") {
      const isAdmin =
        isSuperAdmin(session.user) ||
        hasPermission(session.user, PERMISSIONS.MANAGE_GALLERY);
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const params = getSignedUploadParams(
      folder ?? "uploads",
      resourceType === "video" ? "video" : "image"
    );

    return NextResponse.json({ success: true, ...params });
  } catch (error) {
    console.error("Upload sign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
