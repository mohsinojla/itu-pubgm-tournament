import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI ?? "";
const SUPER_ADMIN_EMAIL = "mohsinrazaojla32@gmail.com";

// Inline schemas to avoid import issues in Node script context
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false },
  provider: { type: String, enum: ["credentials", "google"], default: "credentials" },
  isEmailVerified: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },
  name: String,
  rollNumber: { type: String, sparse: true, unique: true },
  pubgId: String,
  pubgName: String,
  gender: { type: String, enum: ["male", "female", "other"] },
  semester: Number,
  degreeProgramme: String,
  photo: String,
  isVerifiedPlayer: { type: Boolean, default: false },
  role: { type: String, enum: ["player", "admin", "super_admin"], default: "player" },
  permissions: [String],
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  isTeamLeader: Boolean,
  statsHidden: { type: Boolean, default: false },
  stayLoggedIn: { type: Boolean, default: false },
}, { timestamps: true });

const RulesSchema = new mongoose.Schema({
  content: { type: String, required: true },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const TournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  season: { type: String, default: "2025" },
  status: {
    type: String,
    enum: ["upcoming", "group_stage", "knockout", "completed"],
    default: "upcoming",
  },
  maxTeams: { type: Number, default: 16 },
  groupCount: { type: Number, default: 4 },
  prizePool: String,
  startDate: Date,
  endDate: Date,
}, { timestamps: true });

async function seed() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const Rules = mongoose.models.Rules || mongoose.model("Rules", RulesSchema);
  const Tournament = mongoose.models.Tournament || mongoose.model("Tournament", TournamentSchema);

  // 1. Create or update super admin
  const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL });
  if (existing) {
    existing.role = "super_admin";
    existing.isEmailVerified = true;
    await existing.save();
    console.log("✅ Super admin role updated");
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
    console.log("✅ Super admin created (email: " + SUPER_ADMIN_EMAIL + ", password: ChangeMe@123)");
    console.log("   ⚠️  Change the password immediately after first login!");
  }

  // 2. Create default Rules document if not exists
  const rulesCount = await Rules.countDocuments();
  if (rulesCount === 0) {
    await Rules.create({
      content: `<h1>ITU × PUBGM Supremacy Cup — Rules & Regulations</h1>
<p>Rules will be published here. Admins can edit this page from the admin panel.</p>`,
    });
    console.log("✅ Default rules document created");
  } else {
    console.log("ℹ️  Rules document already exists, skipping");
  }

  // 3. Create default Tournament document if not exists
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
    console.log("✅ Default tournament document created");
  } else {
    console.log("ℹ️  Tournament document already exists, skipping");
  }

  console.log("\n🎮 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
