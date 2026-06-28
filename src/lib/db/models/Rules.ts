import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRules extends Document {
  _id: mongoose.Types.ObjectId;
  content: string;
  lastEditedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RulesSchema = new Schema<IRules>(
  {
    content: { type: String, default: "" },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Rules: Model<IRules> =
  mongoose.models.Rules ?? mongoose.model<IRules>("Rules", RulesSchema);

export default Rules;
