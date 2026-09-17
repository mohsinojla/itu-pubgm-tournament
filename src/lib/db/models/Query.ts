import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuery extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved";
  adminReply?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuerySchema = new Schema<IQuery>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending",
    },
    adminReply: { type: String, trim: true, maxlength: 2000 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

QuerySchema.index({ userId: 1, createdAt: -1 });
QuerySchema.index({ status: 1, createdAt: -1 });

const Query: Model<IQuery> =
  mongoose.models.Query ?? mongoose.model<IQuery>("Query", QuerySchema);

export default Query;
