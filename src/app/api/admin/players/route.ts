import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { adminCreatePlayerSchema } from "@/lib/validators/user.schema";

function checkAccess(user: { role: string; permissions: string[] }) {
  return isSuperAdmin(user) || hasPermission(user, PERMISSIONS.MANAGE_PLAYERS);
}

// POST /api/admin/players — admin manually registers a player who signed up
// on paper (e.g. at a marketing desk). Creates a fully profiled, pre-verified
// account with no password. The player later signs in with Google using the
// same email: the existing signIn callback (auth.ts) matches by email and
// just attaches their googleId to this record, leaving everything the admin
// entered untouched.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !checkAccess(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = adminCreatePlayerSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join(".");
      return NextResponse.json(
        { success: false, error: field ? `${field}: ${issue.message}` : issue.message },
        { status: 400 }
      );
    }
    const data = parsed.data;

    await connectDB();

    const email = data.email.toLowerCase().trim();
    const existingEmail = await User.findOne({ email }).select("_id");
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "A player with this email already exists" }, { status: 409 });
    }
    if (data.rollNumber) {
      const existingRoll = await User.findOne({ rollNumber: data.rollNumber }).select("_id");
      if (existingRoll) {
        return NextResponse.json({ success: false, error: "This roll number is already registered" }, { status: 409 });
      }
    }

    const user = await User.create({
      email,
      provider: "google",
      isEmailVerified: true,
      profileCompleted: true,
      role: "player",
      permissions: [],
      name: data.name,
      rollNumber: data.rollNumber,
      pubgId: data.pubgId || undefined,
      pubgName: data.pubgName || undefined,
      gender: data.gender,
      semester: data.semester,
      degreeProgramme: data.degreeProgramme,
      whatsapp: data.whatsapp || undefined,
    });

    return NextResponse.json(
      { success: true, user: { _id: user._id.toString(), email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error: unknown) {
    const mongoError = error as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoError.code === 11000) {
      const field = mongoError.keyPattern ? Object.keys(mongoError.keyPattern)[0] : undefined;
      const message = field === "rollNumber" ? "This roll number is already registered" : "This email is already registered";
      return NextResponse.json({ success: false, error: message }, { status: 409 });
    }
    console.error("POST /api/admin/players error:", error);
    return NextResponse.json({ success: false, error: "Failed to create player" }, { status: 500 });
  }
}
