import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeamMember {
  userId: mongoose.Types.ObjectId;
  role: "core" | "substitute";
  joinedAt: Date;
}

export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  tag: string;
  logo?: string;
  leaderId: mongoose.Types.ObjectId;
  members: ITeamMember[];
  isRegistered: boolean;
  totalKills: number;
  totalPoints: number;
  matchesPlayed: number;
  wins: number;
  shareToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    tag: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 5,
    },
    logo: { type: String },
    leaderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
          role: { type: String, enum: ["core", "substitute"], default: "core" },
          joinedAt: { type: Date, default: Date.now },
        },
      ],
      validate: [
        (v: ITeamMember[]) => v.length <= 5,
        "Team cannot have more than 5 members",
      ],
      default: [],
    },
    isRegistered: { type: Boolean, default: false },
    totalKills: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    shareToken: { type: String, unique: true },
  },
  { timestamps: true }
);

TeamSchema.index({ name: 1 });
TeamSchema.index({ tag: 1 });
TeamSchema.index({ leaderId: 1 });
TeamSchema.index({ shareToken: 1 });

const Team: Model<ITeam> =
  mongoose.models.Team ?? mongoose.model<ITeam>("Team", TeamSchema);

export default Team;
