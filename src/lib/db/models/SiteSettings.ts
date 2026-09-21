import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISiteSettings extends Omit<Document, "_id"> {
  _id: string;
  statsPageVisible: boolean;
  playerEditsLocked: boolean;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    _id: { type: String, default: "global" },
    statsPageVisible: { type: Boolean, default: true },
    playerEditsLocked: { type: Boolean, default: false },
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

/**
 * Read-only lock check for hot paths (every player write). A missing doc or a
 * doc created before this field existed both mean "not locked".
 */
export async function isPlayerEditingLocked(): Promise<boolean> {
  const doc = await SiteSettings.findById("global").select("playerEditsLocked").lean();
  return !!doc?.playerEditsLocked;
}

export default SiteSettings;
