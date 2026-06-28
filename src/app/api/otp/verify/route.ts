import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import OTPToken from "@/lib/db/models/OTPToken";
import User from "@/lib/db/models/User";

const SUPER_ADMIN_EMAIL = "mohsinrazaojla32@gmail.com";

export async function POST(request: Request) {
  try {
    const { email, otp, password } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    // Find the most recent valid OTP for this email
    const token = await OTPToken.findOne({
      email: normalizedEmail,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!token) {
      return NextResponse.json(
        { success: false, error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (token.attempts >= 3) {
      token.isUsed = true;
      await token.save();
      return NextResponse.json(
        {
          success: false,
          error: "Too many failed attempts. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(otp, token.otp);

    if (!isValid) {
      token.attempts += 1;
      await token.save();
      const remaining = 3 - token.attempts;
      return NextResponse.json(
        {
          success: false,
          error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        },
        { status: 400 }
      );
    }

    // Mark OTP as used
    token.isUsed = true;
    await token.save();

    // Create or update user
    const isSuperAdmin = normalizedEmail === SUPER_ADMIN_EMAIL;
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      if (!password) {
        return NextResponse.json(
          { success: false, error: "Password is required for new accounts" },
          { status: 400 }
        );
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      user = await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        provider: "credentials",
        isEmailVerified: true,
        profileCompleted: false,
        role: isSuperAdmin ? "super_admin" : "player",
        permissions: [],
      });
    } else {
      user.isEmailVerified = true;
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
      }
      await user.save();
    }

    return NextResponse.json({ success: true, userId: user._id.toString() });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
