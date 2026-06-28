import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGallery extends Document {
  _id: mongoose.Types.ObjectId;
  type: "image" | "video";
  url: string;
  publicId: string;
  thumbnail?: string;
  caption?: string;
  uploadedBy: mongoose.Types.ObjectId;
  tags: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const GallerySchema = new Schema<IGallery>(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    thumbnail: { type: String },
    caption: { type: String, maxlength: 300 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

GallerySchema.index({ type: 1, createdAt: -1 });
GallerySchema.index({ tags: 1 });

const Gallery: Model<IGallery> =
  mongoose.models.Gallery ??
  mongoose.model<IGallery>("Gallery", GallerySchema);

export default Gallery;
