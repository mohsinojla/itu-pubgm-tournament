import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISiteSettings extends Omit<Document, "_id"> {
  _id: string;
  statsPageVisible: boolean;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    _id: { type: String, default: "global" },
    statsPageVisible: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: false, updatedAt: true }, _id: false }
);

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ?? mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

/** Fetches the singleton settings doc, creating it with defaults if it doesn't exist yet. */
export async function getSiteSettings(): Promise<ISiteSettings> {
  const settings = await SiteSettings.findByIdAndUpdate(
    "global",
    { $setOnInsert: { statsPageVisible: true } },
    { upsert: true, new: true }
  );
  return settings;
}

export default SiteSettings;
