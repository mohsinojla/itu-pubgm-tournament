import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMatchResult {
  teamId: mongoose.Types.ObjectId;
  placement: number;
  killCount: number;
  points: number;
}

export interface IPlayerKill {
  userId: mongoose.Types.ObjectId;
  kills: number;
  damage: number;
}

export interface IMatch extends Document {
  _id: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  matchNumber: number;
  stage: "group" | "quarterfinal" | "semifinal" | "final";
  groupName?: string;
  teams: mongoose.Types.ObjectId[];
  scheduledAt?: Date;
  map?: string;
  status: "upcoming" | "live" | "completed" | "cancelled";
  results: IMatchResult[];
  playerKills: IPlayerKill[];
  bracketPosition?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    matchNumber: { type: Number, required: true },
    stage: {
      type: String,
      enum: ["group", "quarterfinal", "semifinal", "final"],
      required: true,
    },
    groupName: { type: String },
    teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    scheduledAt: { type: Date },
    map: { type: String },
    status: {
      type: String,
      enum: ["upcoming", "live", "completed", "cancelled"],
      default: "upcoming",
    },
    results: [
      {
        teamId: { type: Schema.Types.ObjectId, ref: "Team" },
        placement: { type: Number },
        killCount: { type: Number, default: 0 },
        points: { type: Number, default: 0 },
      },
    ],
    playerKills: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        kills: { type: Number, default: 0 },
        damage: { type: Number, default: 0 },
      },
    ],
    bracketPosition: { type: Number },
  },
  { timestamps: true }
);

MatchSchema.index({ tournamentId: 1, stage: 1, status: 1 });
MatchSchema.index({ matchNumber: 1 });

const Match: Model<IMatch> =
  mongoose.models.Match ?? mongoose.model<IMatch>("Match", MatchSchema);

export default Match;
