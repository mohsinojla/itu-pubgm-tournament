import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJoinRequest extends Document {
  _id: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  requestedRole: "core" | "substitute";
  message?: string;
  status: "pending" | "approved" | "rejected";
  decidedAt?: Date;
  decidedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JoinRequestSchema = new Schema<IJoinRequest>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedRole: {
      type: String,
      enum: ["core", "substitute"],
      default: "core",
    },
    message: { type: String, maxlength: 200 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    decidedAt: { type: Date },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

JoinRequestSchema.index({ teamId: 1, userId: 1, status: 1 });

const JoinRequest: Model<IJoinRequest> =
  mongoose.models.JoinRequest ??
  mongoose.model<IJoinRequest>("JoinRequest", JoinRequestSchema);

export default JoinRequest;
