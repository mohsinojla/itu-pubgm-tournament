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
    const { statsPageVisible } = await request.json();
    if (typeof statsPageVisible !== "boolean") {
      return NextResponse.json({ success: false, error: "statsPageVisible must be a boolean" }, { status: 400 });
    }

    await connectDB();
    const settings = await SiteSettings.findByIdAndUpdate(
      "global",
      { statsPageVisible },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("PATCH /api/admin/settings error:", error);
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
