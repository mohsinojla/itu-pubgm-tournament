import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import SiteSettings, { getSiteSettings } from "@/lib/db/models/SiteSettings";
import { isAdmin } from "@/lib/auth/permissions";

export async function GET() {
  await connectDB();
  const settings = await getSiteSettings();
  return NextResponse.json({ success: true, settings });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updates: Record<string, boolean> = {};

    for (const key of ["statsPageVisible", "playerEditsLocked"] as const) {
      if (body[key] === undefined) continue;
      if (typeof body[key] !== "boolean") {
        return NextResponse.json({ success: false, error: `${key} must be a boolean` }, { status: 400 });
      }
      updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid settings provided" }, { status: 400 });
    }

    await connectDB();
    const settings = await SiteSettings.findByIdAndUpdate(
      "global",
      { $set: updates },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("PATCH /api/admin/settings error:", error);
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
