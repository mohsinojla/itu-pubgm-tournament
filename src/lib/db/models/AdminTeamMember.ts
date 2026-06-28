import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminTeamMember extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  role: string;
  photo?: string;
  bio?: string;
  socials?: {
    instagram?: string;
    linkedin?: string;
  };
  order: number;
  isHighlighted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminTeamMemberSchema = new Schema<IAdminTeamMember>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    photo: { type: String },
    bio: { type: String, maxlength: 300 },
    socials: {
      instagram: { type: String },
      linkedin: { type: String },
    },
    order: { type: Number, default: 0 },
    isHighlighted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AdminTeamMember: Model<IAdminTeamMember> =
  mongoose.models.AdminTeamMember ??
  mongoose.model<IAdminTeamMember>("AdminTeamMember", AdminTeamMemberSchema);

export default AdminTeamMember;
