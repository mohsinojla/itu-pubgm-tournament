import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not set");

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      minPoolSize: 1,
      maxPoolSize: 10,
    });
  }

  cached.conn = await cached.promise;

  // Drop legacy single-field unique index on CommunityMember.userId that was
  // replaced by the compound { userId, eventId } index. Mongoose never removes
  // old indexes automatically, so this runs once per cold start and is a no-op
  // once the index is gone.
  try {
    await cached.conn.connection.db
      ?.collection("communitymembers")
      .dropIndex("userId_1");
  } catch {
    // Index already gone or collection doesn't exist yet — ignore.
  }

  return cached.conn;
}
