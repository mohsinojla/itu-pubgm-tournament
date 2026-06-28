import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOTPToken extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const OTPTokenSchema = new Schema<IOTPToken>(
  {
    email: { type: String, required: true, lowercase: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL: auto-delete expired tokens from MongoDB
OTPTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OTPTokenSchema.index({ email: 1 });

const OTPToken: Model<IOTPToken> =
  mongoose.models.OTPToken ??
  mongoose.model<IOTPToken>("OTPToken", OTPTokenSchema);

export default OTPToken;
