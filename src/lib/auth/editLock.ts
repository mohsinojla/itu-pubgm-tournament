import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { isPlayerEditingLocked } from "@/lib/db/models/SiteSettings";

/**
 * Guard for player-facing write endpoints. Returns a 423 response when the
 * organizers have locked player edits, or null when the request may proceed.
 * Admins and the super admin are never blocked.
 */
export async function playerEditLockResponse(user: { role: string }) {
  if (user.role === "admin" || user.role === "super_admin") return null;
  await connectDB();
  if (await isPlayerEditingLocked()) {
    return NextResponse.json(
      {
        success: false,
        locked: true,
        error: "Editing is currently locked by the organizers. Please contact an admin if you need a change.",
      },
      { status: 423 }
    );
  }
  return null;
}
