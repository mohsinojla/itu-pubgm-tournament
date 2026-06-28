import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { currentPassword, newPassword } = body as {
    currentPassword: string;
    newPassword: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ success: false, error: "Both fields are required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ success: false, error: "New password must be at least 8 characters" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(session.user.id).select("+password");
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }
  if (user.provider !== "credentials" || !user.password) {
    return NextResponse.json(
      { success: false, error: "Password change is not available for Google sign-in accounts" },
      { status: 400 }
    );
  }

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  return NextResponse.json({ success: true });
}
