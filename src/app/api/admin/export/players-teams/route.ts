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

  // Fetch every registered player, in a team or not (matches the admin Players table)
  const allPlayers = await User.find({ profileCompleted: true, role: "player" })
    .select("name email rollNumber pubgId pubgName degreeProgramme semester whatsapp teamId")
    .sort({ name: 1 })
    .lean();

  // Fetch every team, with members populated for the Teams sheet
  const teams = await Team.find()
    .select("name teamId leaderId members")
    .populate("members.userId", "name pubgName")
    .sort({ name: 1 })
    .lean();

  const teamMap = new Map(teams.map((t) => [t._id.toString(), t]));

  // ─── Sheet 1: All Players ───────────────────────────────────────────────
  const playerRows = allPlayers.map((player, i) => {
    const team = teamMap.get(player.teamId?.toString() ?? "");
    const memberEntry = team?.members.find(
      (m: { userId: unknown; role: string }) =>
        (m.userId as { _id?: unknown })?._id?.toString?.() === player._id.toString() ||
        m.userId?.toString() === player._id.toString()
    );
    const isLeader = team?.leaderId?.toString() === player._id.toString();

    return {
      "S.No": i + 1,
      "Player Name": player.name ?? "—",
      "Email": player.email,
      "Roll Number": player.rollNumber ?? "—",
      "PUBG ID": player.pubgId ?? "—",
      "PUBG In-Game Name": player.pubgName ?? "—",
      "Degree Programme": player.degreeProgramme ?? "—",
      "Semester": player.semester ?? "—",
      "WhatsApp": player.whatsapp ?? "—",
      "Team Name": team?.name ?? "—",
      "Team Role": memberEntry?.role ?? "—",
      "Is Leader": isLeader ? "Yes" : "No",
    };
  });

  const playersSheet = XLSX.utils.json_to_sheet(playerRows);
  playersSheet["!cols"] = [
    { wch: 6 },   // S.No
    { wch: 22 },  // Player Name
    { wch: 26 },  // Email
    { wch: 16 },  // Roll Number
    { wch: 14 },  // PUBG ID
    { wch: 22 },  // PUBG In-Game Name
    { wch: 28 },  // Degree Programme
    { wch: 10 },  // Semester
    { wch: 16 },  // WhatsApp
    { wch: 22 },  // Team Name
    { wch: 12 },  // Team Role
    { wch: 10 },  // Is Leader
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, playersSheet, "All Players");

  // ─── Sheet 2: Teams only ────────────────────────────────────────────────
  const teamRows = teams.map((t, i) => {
    const leader = t.members.find(
      (m: { userId: { _id?: unknown } | unknown }) =>
        (m.userId as { _id?: unknown })?._id?.toString?.() === t.leaderId?.toString()
    )?.userId as { name?: string; pubgName?: string } | undefined;

    const memberNames = t.members
      .map((m: { userId: { name?: string; pubgName?: string } | unknown }) => {
        const u = m.userId as { name?: string; pubgName?: string };
        return u?.name ?? u?.pubgName ?? "—";
      })
      .join(", ");

    return {
      "S.No": i + 1,
      "Team Name": t.name,
      "Team ID": `#${t.teamId}`,
      "Leader": leader?.name ?? "—",
      "Member Count": t.members.length,
      "Members": memberNames || "—",
    };
  });

  const teamsSheet = XLSX.utils.json_to_sheet(teamRows);
  teamsSheet["!cols"] = [
    { wch: 6 },   // S.No
    { wch: 22 },  // Team Name
    { wch: 10 },  // Team ID
    { wch: 22 },  // Leader
    { wch: 14 },  // Member Count
    { wch: 50 },  // Members
  ];
  XLSX.utils.book_append_sheet(workbook, teamsSheet, "Teams");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ITU-PUBGM-Players-${date}.xlsx"`,
    },
  });
}
