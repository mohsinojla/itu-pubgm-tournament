import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  body: string;
  isPinned: boolean;
  postedBy: mongoose.Types.ObjectId;
  category: "general" | "match" | "result" | "urgent";
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    isPinned: { type: Boolean, default: false },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: ["general", "match", "result", "urgent"],
      default: "general",
    },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ isPinned: -1, createdAt: -1 });

const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ??
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);

export default Announcement;
