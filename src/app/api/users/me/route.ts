import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).select(
    "-password -__v"
  );

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Fields that can be updated via this endpoint
    const allowed = [
      "name",
      "rollNumber",
      "pubgId",
      "pubgName",
      "gender",
      "semester",
      "degreeProgramme",
      "photo",
      "whatsapp",
      "profileCompleted",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    await connectDB();

    // Enforce rollNumber uniqueness manually (it's a sparse unique index)
    if (updates.rollNumber) {
      const existing = await User.findOne({
        rollNumber: updates.rollNumber,
        _id: { $ne: session.user.id },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "This roll number is already registered" },
          { status: 409 }
        );
      }
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    const mongoError = error as { code?: number; message?: string };
    if (mongoError.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Roll number already taken" },
        { status: 409 }
      );
    }
    console.error("PATCH /api/users/me error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
