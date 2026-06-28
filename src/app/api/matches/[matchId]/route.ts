import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { connectDB } from "@/lib/db/mongoose";
import Match from "@/lib/db/models/Match";
import { pusherServer } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/constants/pusher-events";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    await connectDB();
    const { matchId } = await params;
    const match = await Match.findById(matchId)
      .populate("teams", "name tag logo members leaderId")
      .lean();

    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ match });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasPermission(session.user, PERMISSIONS.MANAGE_SCHEDULE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { matchId } = await params;
    const body = await req.json();
    const { scheduledAt, status, map, teams, groupName, matchNumber, stage } = body;

    const update: Record<string, unknown> = {};
    if (scheduledAt !== undefined) update.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (status !== undefined) update.status = status;
    if (map !== undefined) update.map = map;
    if (teams !== undefined) update.teams = teams;
    if (groupName !== undefined) update.groupName = groupName;
    if (matchNumber !== undefined) update.matchNumber = Number(matchNumber);
    if (stage !== undefined) update.stage = stage;

    const match = await Match.findByIdAndUpdate(matchId, update, { new: true })
      .populate("teams", "name tag logo");

    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (status === "live") {
      const tournamentId = match.tournamentId.toString();
      await pusherServer.trigger(
        PUSHER_CHANNELS.tournament(tournamentId),
        PUSHER_EVENTS.MATCH_LIVE,
        { matchId, matchNumber: match.matchNumber }
      );
    }

    return NextResponse.json({ match });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasPermission(session.user, PERMISSIONS.MANAGE_SCHEDULE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { matchId } = await params;
    const match = await Match.findByIdAndDelete(matchId);
    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
