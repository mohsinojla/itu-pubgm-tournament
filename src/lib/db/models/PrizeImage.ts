import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPrizeImage extends Document {
  _id: mongoose.Types.ObjectId;
  url: string;
  publicId: string;
  caption?: string;
  uploadedBy: mongoose.Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PrizeImageSchema = new Schema<IPrizeImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, maxlength: 200 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PrizeImageSchema.index({ order: 1, createdAt: -1 });

const PrizeImage: Model<IPrizeImage> =
  mongoose.models.PrizeImage ?? mongoose.model<IPrizeImage>("PrizeImage", PrizeImageSchema);

export default PrizeImage;
