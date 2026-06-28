import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import Team from "@/lib/db/models/Team";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const canExport = isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_PLAYERS);
  if (!canExport) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  // Fetch all players who are in a team
  const players = await User.find({
    profileCompleted: true,
    role: "player",
    teamId: { $exists: true, $ne: null },
  })
    .select("name email rollNumber pubgId pubgName degreeProgramme semester whatsapp teamId isVerifiedPlayer")
    .lean();

  // Fetch all relevant teams
  const teamIds = [...new Set(players.map((p) => p.teamId?.toString()).filter((id): id is string => !!id))];
  const teams = await Team.find({ _id: { $in: teamIds } })
    .select("name tag leaderId members")
    .lean();

  const teamMap = new Map(teams.map((t) => [t._id.toString(), t]));

  // Build rows: group by team, ordered alphabetically by team name then player name
  const rows: Record<string, string | number>[] = [];
  let sNo = 1;

  // Sort players by team name then player name
  const sorted = [...players].sort((a, b) => {
    const teamA = teamMap.get(a.teamId?.toString() ?? "")?.name ?? "";
    const teamB = teamMap.get(b.teamId?.toString() ?? "")?.name ?? "";
    if (teamA !== teamB) return teamA.localeCompare(teamB);
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  for (const player of sorted) {
    const team = teamMap.get(player.teamId?.toString() ?? "");
    if (!team) continue;

    const memberEntry = team.members.find(
      (m: { userId: unknown; role: string }) => m.userId?.toString() === player._id.toString()
    );
    const isLeader = team.leaderId?.toString() === player._id.toString();

    rows.push({
      "S.No": sNo++,
      "Team Name": team.name,
      "Team Tag": `[${team.tag}]`,
      "Player Name": player.name ?? "—",
      "Roll Number": player.rollNumber ?? "—",
      "PUBG ID": player.pubgId ?? "—",
      "PUBG In-Game Name": player.pubgName ?? "—",
      "Degree Programme": player.degreeProgramme ?? "—",
      "Semester": player.semester ?? "—",
      "WhatsApp": player.whatsapp ?? "—",
      "Team Role": memberEntry?.role ?? "—",
      "Is Leader": isLeader ? "Yes" : "No",
      "Verified Player": player.isVerifiedPlayer ? "Yes" : "No",
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Column widths
  worksheet["!cols"] = [
    { wch: 6 },   // S.No
    { wch: 22 },  // Team Name
    { wch: 10 },  // Team Tag
    { wch: 22 },  // Player Name
    { wch: 16 },  // Roll Number
    { wch: 14 },  // PUBG ID
    { wch: 22 },  // PUBG In-Game Name
    { wch: 28 },  // Degree Programme
    { wch: 10 },  // Semester
    { wch: 16 },  // WhatsApp
    { wch: 12 },  // Team Role
    { wch: 10 },  // Is Leader
    { wch: 14 },  // Verified Player
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Players & Teams");

  // Summary sheet
  const summaryRows = teams
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t, i) => {
      const memberCount = players.filter((p) => p.teamId?.toString() === t._id.toString()).length;
      return {
        "S.No": i + 1,
        "Team Name": t.name,
        "Team Tag": `[${t.tag}]`,
        "Member Count": memberCount,
      };
    });

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 6 }, { wch: 22 }, { wch: 10 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Teams Summary");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ITU-PUBGM-Players-${date}.xlsx"`,
    },
  });
}
