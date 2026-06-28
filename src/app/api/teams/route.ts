import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Team from "@/lib/db/models/Team";
import User from "@/lib/db/models/User";
import { createTeamSchema } from "@/lib/validators/team.schema";
import { nanoid } from "nanoid";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "12", 10);
  const skip = (page - 1) * limit;

  await connectDB();

  const [teams, total] = await Promise.all([
    Team.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("leaderId", "name photo pubgName")
      .populate("members.userId", "name photo pubgName isVerifiedPlayer")
      .lean(),
    Team.countDocuments(),
  ]);

  return NextResponse.json({ success: true, teams, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.profileCompleted) {
    return NextResponse.json({ success: false, error: "Complete your profile first" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    // Check user has PUBG ID and PUBG name set
    const currentUser = await User.findById(session.user.id).select("teamId pubgId pubgName");
    if (!currentUser?.pubgId || !currentUser?.pubgName) {
      return NextResponse.json(
        { success: false, error: "You must set your PUBG ID and PUBG In-Game Name in your profile before creating a team." },
        { status: 400 }
      );
    }

    // Check user doesn't already have a team
    const existingUser = currentUser;
    if (existingUser?.teamId) {
      return NextResponse.json(
        { success: false, error: "You are already in a team. Leave your current team first." },
        { status: 409 }
      );
    }

    const { name, tag, logo } = parsed.data;

    const team = await Team.create({
      name: name.trim(),
      tag: tag.toUpperCase().trim(),
      logo,
      leaderId: session.user.id,
      members: [{ userId: session.user.id, role: "core", joinedAt: new Date() }],
      shareToken: nanoid(10),
    });

    // Update user
    await User.findByIdAndUpdate(session.user.id, {
      teamId: team._id,
      isTeamLeader: true,
    });

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error: unknown) {
    const mongoError = error as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoError.code === 11000) {
      const field = Object.keys(mongoError.keyPattern ?? {})[0];
      return NextResponse.json(
        { success: false, error: `Team ${field === "tag" ? "tag" : "name"} is already taken` },
        { status: 409 }
      );
    }
    console.error("POST /api/teams error:", error);
    return NextResponse.json({ success: false, error: "Failed to create team" }, { status: 500 });
  }
}
