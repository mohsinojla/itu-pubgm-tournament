import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import { isSuperAdmin } from "@/lib/auth/permissions";
import mongoose from "mongoose";

// One-time endpoint to drop the legacy adminteammembers collection from MongoDB.
// Call once after deployment, then this endpoint becomes a no-op.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    return NextResponse.json({ success: false, error: "No DB connection" }, { status: 500 });
  }

  const collections = await db.listCollections({ name: "adminteammembers" }).toArray();
  if (collections.length === 0) {
    return NextResponse.json({ success: true, message: "Collection does not exist — nothing to drop." });
  }

  await db.dropCollection("adminteammembers");
  return NextResponse.json({ success: true, message: "adminteammembers collection dropped successfully." });
}
