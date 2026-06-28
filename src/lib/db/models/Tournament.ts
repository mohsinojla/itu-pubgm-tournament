import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITournament extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  season: number;
  status: "upcoming" | "group_stage" | "knockout" | "completed";
  maxTeams: number;
  groupCount: number;
  prizePool?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema = new Schema<ITournament>(
  {
    name: { type: String, required: true },
    season: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["upcoming", "group_stage", "knockout", "completed"],
      default: "upcoming",
    },
    maxTeams: { type: Number, default: 16 },
    groupCount: { type: Number, default: 4 },
    prizePool: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

const Tournament: Model<ITournament> =
  mongoose.models.Tournament ??
  mongoose.model<ITournament>("Tournament", TournamentSchema);

export default Tournament;
