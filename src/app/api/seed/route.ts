import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const SEED_SECRET = "itu-pubgm-seed-2025";
const SUPER_ADMIN_EMAIL = "mohsinrazaojla32@gmail.com";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false },
  provider: { type: String, default: "credentials" },
  isEmailVerified: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },
  role: { type: String, default: "player" },
  permissions: [String],
}, { timestamps: true });

const RulesSchema = new mongoose.Schema({
  content: { type: String, required: true },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const TournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  season: { type: String, default: "2025" },
  status: { type: String, default: "upcoming" },
  maxTeams: { type: Number, default: 16 },
  groupCount: { type: Number, default: 4 },
  prizePool: String,
  startDate: Date,
  endDate: Date,
}, { timestamps: true });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const Rules = mongoose.models.Rules || mongoose.model("Rules", RulesSchema);
  const Tournament = mongoose.models.Tournament || mongoose.model("Tournament", TournamentSchema);

  const results: string[] = [];

  // Super admin
  const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL });
  if (existing) {
    existing.role = "super_admin";
    existing.isEmailVerified = true;
    await existing.save();
    results.push("Super admin role updated");
  } else {
    const password = await bcrypt.hash("ChangeMe@123", 12);
    await User.create({
      email: SUPER_ADMIN_EMAIL,
      password,
      provider: "credentials",
      isEmailVerified: true,
      profileCompleted: false,
      role: "super_admin",
      permissions: [],
    });
    results.push("Super admin created (password: ChangeMe@123) — CHANGE IT IMMEDIATELY");
  }

  // Rules
  const rulesCount = await Rules.countDocuments();
  if (rulesCount === 0) {
    await Rules.create({
      content: `<h1>ITU × PUBGM Supremacy Cup — Rules & Regulations</h1><p>Rules will be published here. Admins can edit this page from the admin panel.</p>`,
    });
    results.push("Default rules document created");
  } else {
    results.push("Rules already exists, skipped");
  }

  // Tournament
  const tourCount = await Tournament.countDocuments();
  if (tourCount === 0) {
    await Tournament.create({
      name: "ITU × PUBGM Supremacy Cup",
      season: "2025",
      status: "upcoming",
      maxTeams: 16,
      groupCount: 4,
      prizePool: "TBD",
    });
    results.push("Default tournament document created");
  } else {
    results.push("Tournament already exists, skipped");
  }

  return NextResponse.json({ success: true, results });
}
