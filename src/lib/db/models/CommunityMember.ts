import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunityMember extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  communityRole: string;
  bio?: string;
  order: number;
  isHighlighted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityMemberSchema = new Schema<ICommunityMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    communityRole: { type: String, required: true, trim: true },
    bio: { type: String, maxlength: 400 },
    order: { type: Number, default: 0 },
    isHighlighted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const CommunityMember: Model<ICommunityMember> =
  mongoose.models.CommunityMember ??
  mongoose.model<ICommunityMember>("CommunityMember", CommunityMemberSchema);

export default CommunityMember;
