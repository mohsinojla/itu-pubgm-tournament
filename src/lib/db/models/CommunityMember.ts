import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunityMember extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId; // null = general; set = belongs to this GallerySection event
  communityRole: string;
  bio?: string;
  order: number;
  isHighlighted: boolean; // campus ambassador flag (global, eventId-agnostic)
  createdAt: Date;
  updatedAt: Date;
}

const CommunityMemberSchema = new Schema<ICommunityMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "GallerySection", default: null },
    communityRole: { type: String, required: true, trim: true },
    bio: { type: String, maxlength: 400 },
    order: { type: Number, default: 0 },
    isHighlighted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A user can appear once per event (null counts as a distinct value in MongoDB sparse indexes,
// so we use a regular compound index — this enforces uniqueness within each event bucket)
CommunityMemberSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const CommunityMember: Model<ICommunityMember> =
  mongoose.models.CommunityMember ??
  mongoose.model<ICommunityMember>("CommunityMember", CommunityMemberSchema);

export default CommunityMember;
