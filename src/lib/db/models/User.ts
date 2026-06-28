import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  provider: "credentials" | "google";
  googleId?: string;
  isEmailVerified: boolean;
  profileCompleted: boolean;
  name?: string;
  rollNumber?: string;
  pubgId?: string;
  pubgName?: string;
  gender?: "male" | "female" | "other";
  semester?: number;
  degreeProgramme?: string;
  photo?: string;
  whatsapp?: string;
  isVerifiedPlayer: boolean;
  role: "player" | "admin" | "super_admin";
  permissions: string[];
  teamId?: mongoose.Types.ObjectId;
  isTeamLeader: boolean;
  statsHidden: boolean;
  stayLoggedIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    googleId: { type: String, sparse: true, unique: true },
    isEmailVerified: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    name: { type: String, trim: true },
    rollNumber: { type: String, sparse: true, unique: true, trim: true },
    pubgId: { type: String, trim: true },
    pubgName: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    semester: { type: Number, min: 1, max: 8 },
    degreeProgramme: { type: String },
    photo: { type: String },
    whatsapp: { type: String, trim: true },
    isVerifiedPlayer: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["player", "admin", "super_admin"],
      default: "player",
    },
    permissions: { type: [String], default: [] },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    isTeamLeader: { type: Boolean, default: false },
    statsHidden: { type: Boolean, default: false },
    stayLoggedIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ rollNumber: 1 }, { sparse: true });
UserSchema.index({ googleId: 1 }, { sparse: true });

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
