import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { connectDB } from "@/lib/db/mongoose";
import Match from "@/lib/db/models/Match";
import Team from "@/lib/db/models/Team";
import PlayerStats from "@/lib/db/models/PlayerStats";
import Notification from "@/lib/db/models/Notification";
import User from "@/lib/db/models/User";
import { pusherServer } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/constants/pusher-events";
import mongoose from "mongoose";

interface ResultInput {
  teamId: string;
  placement: number;
  killCount: number;
  points: number;
}

interface PlayerKillInput {
  userId: string;
  kills: number;
  damage: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasPermission(session.user, PERMISSIONS.MANAGE_RESULTS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { matchId } = await params;
    const body = await req.json();
    const {
      results,
      playerKills,
    }: { results: ResultInput[]; playerKills: PlayerKillInput[] } = body;

    if (!results?.length) {
      return NextResponse.json({ error: "results array required" }, { status: 400 });
    }

    // Step 1: Load and validate match
    const match = await Match.findById(matchId).populate("teams");
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (match.status === "completed") {
      return NextResponse.json({ error: "Match already completed" }, { status: 409 });
    }

    // Step 2: Update match with results
    match.results = results.map((r) => ({
      teamId: new mongoose.Types.ObjectId(r.teamId),
      placement: r.placement,
      killCount: r.killCount,
      points: r.points,
    }));
    match.playerKills = (playerKills ?? []).map((pk) => ({
      userId: new mongoose.Types.ObjectId(pk.userId),
      kills: pk.kills,
      damage: pk.damage,
    }));
    match.status = "completed";
    await match.save();

    // Step 3: Upsert PlayerStats for each player
    const topKillsEntry = [...(playerKills ?? [])].sort((a, b) => b.kills - a.kills)[0];
    const winnerTeamId = results.find((r) => r.placement === 1)?.teamId;

    for (const pk of playerKills ?? []) {
      // Find user's team and their placement
      const user = await User.findById(pk.userId).select("teamId").lean();
      const userTeamId = user?.teamId?.toString();
      const isWinner = userTeamId === winnerTeamId;
      const teamResult = results.find((r) => r.teamId === userTeamId);
      const placement = teamResult?.placement ?? 99;
      const isTop3 = placement <= 3;

      const existing = await PlayerStats.findOne({ userId: pk.userId });
      if (existing) {
        const newMatchesPlayed = existing.matchesPlayed + 1;
        const newTotalKills = existing.totalKills + pk.kills;
        const newTotalDamage = existing.totalDamage + pk.damage;
        const newWins = existing.wins + (isWinner ? 1 : 0);
        const newTop3 = existing.top3Finishes + (isTop3 ? 1 : 0);

        const isBestMatch =
          !existing.bestMatch || pk.kills > (existing.bestMatch.kills ?? 0);

        await PlayerStats.findOneAndUpdate(
          { userId: pk.userId },
          {
            $set: {
              matchesPlayed: newMatchesPlayed,
              totalKills: newTotalKills,
              totalDamage: newTotalDamage,
              wins: newWins,
              top3Finishes: newTop3,
              avgKillsPerMatch: newTotalKills / newMatchesPlayed,
              killDeathRatio:
                existing.totalDeaths > 0 ? newTotalKills / existing.totalDeaths : newTotalKills,
              ...(isBestMatch && {
                bestMatch: {
                  matchId: match._id,
                  kills: pk.kills,
                  placement,
                },
              }),
              // MVP: most kills in match
              ...(topKillsEntry?.userId === pk.userId && {
                mvpCount: existing.mvpCount + 1,
              }),
            },
          }
        );
      } else {
        await PlayerStats.create({
          userId: pk.userId,
          teamId: user?.teamId,
          matchesPlayed: 1,
          totalKills: pk.kills,
          totalDamage: pk.damage,
          wins: isWinner ? 1 : 0,
          top3Finishes: isTop3 ? 1 : 0,
          avgKillsPerMatch: pk.kills,
          killDeathRatio: pk.kills,
          mvpCount: topKillsEntry?.userId === pk.userId ? 1 : 0,
          bestMatch: { matchId: match._id, kills: pk.kills, placement },
        });
      }
    }

    // Step 4: Update Team denormalized totals
    for (const result of results) {
      await Team.findByIdAndUpdate(result.teamId, {
        $inc: {
          totalKills: result.killCount,
          totalPoints: result.points,
          matchesPlayed: 1,
          wins: result.placement === 1 ? 1 : 0,
        },
      });
    }

    // Step 5: Trigger Pusher
    const tournamentId = match.tournamentId.toString();
    await pusherServer.trigger(
      PUSHER_CHANNELS.tournament(tournamentId),
      PUSHER_EVENTS.MATCH_RESULT,
      { matchId, matchNumber: match.matchNumber, results }
    );

    // Step 6: Notify team members of both teams
    const allTeamIds = results.map((r) => r.teamId);
    const teamsData = await Team.find({ _id: { $in: allTeamIds } })
      .select("members leaderId")
      .lean();

    const allUserIds = new Set<string>();
    for (const team of teamsData) {
      allUserIds.add(team.leaderId.toString());
      for (const member of team.members) {
        allUserIds.add(member.userId.toString());
      }
    }

    const notificationDocs = Array.from(allUserIds).map((userId) => ({
      userId,
      type: "result_posted",
      title: `Match #${match.matchNumber} Results Posted`,
      message: "The results for your match have been posted. Check the stats!",
      link: `/results`,
      isRead: false,
      relatedId: match._id,
    }));

    if (notificationDocs.length) {
      await Notification.insertMany(notificationDocs);
    }

    for (const userId of allUserIds) {
      await pusherServer.trigger(
        PUSHER_CHANNELS.user(userId),
        PUSHER_EVENTS.NOTIFICATION_NEW,
        {}
      );
    }

    return NextResponse.json({ success: true, match });
  } catch (err) {
    console.error("Results POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
