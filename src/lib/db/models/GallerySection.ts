import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGallerySection extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const GallerySectionSchema = new Schema<IGallerySection>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

GallerySectionSchema.index({ order: 1 });

const GallerySection: Model<IGallerySection> =
  mongoose.models.GallerySection ??
  mongoose.model<IGallerySection>("GallerySection", GallerySectionSchema);

export default GallerySection;
