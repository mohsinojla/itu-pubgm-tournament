import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { isValidObjectId } from "mongoose";
import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import User from "@/lib/db/models/User";
import Notification from "@/lib/db/models/Notification";
import { createTeamSchema } from "@/lib/validators/team.schema";
import { generateUniqueTeamId } from "@/lib/teams/helpers";

// POST /api/admin/teams — admin creates a team and names its leader.
// Works regardless of the player edit lock and skips the PUBG-ID/profile
// prerequisites players face, since the admin is vouching for the roster.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createTeamSchema.safeParse({ name: body.name, logo: body.logo });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const leaderId = typeof body.leaderId === "string" ? body.leaderId : "";
    if (!leaderId || !isValidObjectId(leaderId)) {
      return NextResponse.json({ success: false, error: "Pick a team leader" }, { status: 400 });
    }

    await connectDB();

    const leader = await User.findById(leaderId).select("name teamId");
    if (!leader) {
      return NextResponse.json({ success: false, error: "Leader not found" }, { status: 404 });
    }
    if (leader.teamId) {
      return NextResponse.json(
        { success: false, error: `${leader.name ?? "That player"} is already in a team. Remove them from it first.` },
        { status: 409 }
      );
    }

    const teamId = await generateUniqueTeamId();
    const team = await Team.create({
      name: parsed.data.name,
      teamId,
      logo: parsed.data.logo,
      leaderId: leader._id,
      members: [{ userId: leader._id, role: "core", joinedAt: new Date() }],
      shareToken: nanoid(10),
    });

    await User.findByIdAndUpdate(leader._id, { teamId: team._id, isTeamLeader: true });

    await Notification.create({
      userId: leader._id,
      type: "join_approved",
      title: "You've been made a team leader",
      message: `An admin created the team ${team.name} and made you its leader.`,
      link: `/teams/${team._id}`,
    });

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error: unknown) {
    const mongoError = error as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoError.code === 11000) {
      const field = mongoError.keyPattern ? Object.keys(mongoError.keyPattern)[0] : undefined;
      const message = field === "name" ? "Team name is already taken" : "Could not create team — please try again";
      return NextResponse.json({ success: false, error: message }, { status: 409 });
    }
    console.error("POST /api/admin/teams error:", error);
    return NextResponse.json({ success: false, error: "Failed to create team" }, { status: 500 });
  }
}
