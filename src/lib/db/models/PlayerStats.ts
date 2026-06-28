import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlayerStats extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  matchesPlayed: number;
  totalKills: number;
  totalDeaths: number;
  wins: number;
  top3Finishes: number;
  totalDamage: number;
  avgKillsPerMatch: number;
  killDeathRatio: number;
  mvpCount: number;
  bestMatch?: {
    matchId: mongoose.Types.ObjectId;
    kills: number;
    placement: number;
  };
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerStatsSchema = new Schema<IPlayerStats>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    matchesPlayed: { type: Number, default: 0 },
    totalKills: { type: Number, default: 0 },
    totalDeaths: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    top3Finishes: { type: Number, default: 0 },
    totalDamage: { type: Number, default: 0 },
    avgKillsPerMatch: { type: Number, default: 0 },
    killDeathRatio: { type: Number, default: 0 },
    mvpCount: { type: Number, default: 0 },
    bestMatch: {
      matchId: { type: Schema.Types.ObjectId, ref: "Match" },
      kills: { type: Number },
      placement: { type: Number },
    },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PlayerStatsSchema.index({ totalKills: -1 });
PlayerStatsSchema.index({ isHidden: 1 });

const PlayerStats: Model<IPlayerStats> =
  mongoose.models.PlayerStats ??
  mongoose.model<IPlayerStats>("PlayerStats", PlayerStatsSchema);

export default PlayerStats;
