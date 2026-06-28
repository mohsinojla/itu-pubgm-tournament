import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { connectDB } from "@/lib/db/mongoose";
import PlayerStats from "@/lib/db/models/PlayerStats";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    await connectDB();

    const canViewHidden =
      session?.user &&
      (isSuperAdmin(session.user) ||
        hasPermission(session.user, PERMISSIONS.VIEW_STATS));

    const baseFilter = { teamId: { $exists: true, $ne: null } };
    const filter = canViewHidden ? baseFilter : { ...baseFilter, isHidden: false };

    const stats = await PlayerStats.find(filter)
      .populate("userId", "name pubgName photo rollNumber teamId")
      .populate("teamId", "name tag")
      .sort({ totalKills: -1 })
      .lean();

    return NextResponse.json({ stats });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
