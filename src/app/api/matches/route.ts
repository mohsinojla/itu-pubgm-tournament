import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { connectDB } from "@/lib/db/mongoose";
import Match from "@/lib/db/models/Match";
import Tournament from "@/lib/db/models/Tournament";
import { pusherServer } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/constants/pusher-events";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");

    const tournament = await Tournament.findOne().sort({ createdAt: -1 }).lean();
    if (!tournament) return NextResponse.json({ matches: [] });

    const filter: Record<string, unknown> = { tournamentId: tournament._id };
    if (stage) filter.stage = stage;
    if (status) filter.status = status;

    const matches = await Match.find(filter)
      .populate("teams", "name tag logo")
      .sort({ scheduledAt: 1, matchNumber: 1 })
      .lean();

    return NextResponse.json({ matches });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasPermission(session.user, PERMISSIONS.MANAGE_SCHEDULE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { matchNumber, stage, groupName, teams, scheduledAt, map } = body;

    if (!matchNumber || !stage) {
      return NextResponse.json({ error: "matchNumber and stage are required" }, { status: 400 });
    }

    const tournament = await Tournament.findOne().sort({ createdAt: -1 }).lean();
    if (!tournament) {
      return NextResponse.json({ error: "No tournament found" }, { status: 404 });
    }

    const match = await Match.create({
      tournamentId: tournament._id,
      matchNumber,
      stage,
      groupName,
      teams: teams ?? [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      map,
      status: "upcoming",
    });

    const populated = await match.populate("teams", "name tag logo");

    await pusherServer.trigger(
      PUSHER_CHANNELS.tournament(tournament._id.toString()),
      PUSHER_EVENTS.MATCH_SCHEDULED,
      { match: populated }
    );

    return NextResponse.json({ match: populated }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
