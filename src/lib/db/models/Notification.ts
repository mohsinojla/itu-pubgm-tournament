import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type:
    | "join_request"
    | "join_approved"
    | "join_rejected"
    | "announcement"
    | "match_scheduled"
    | "result_posted"
    | "leadership_transferred"
    | "member_removed"
    | "stats_hidden";
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  relatedId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "join_request",
        "join_approved",
        "join_rejected",
        "announcement",
        "match_scheduled",
        "result_posted",
        "leadership_transferred",
        "member_removed",
        "stats_hidden",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    relatedId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
// TTL: auto-delete after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
