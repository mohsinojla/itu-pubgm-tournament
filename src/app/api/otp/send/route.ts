import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import OTPToken from "@/lib/db/models/OTPToken";
import { resend, FROM_EMAIL } from "@/lib/resend/client";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_PER_HOUR = 3;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    // Rate limit: max 3 OTPs per hour per email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await OTPToken.countDocuments({
      email: normalizedEmail,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentOTPs >= MAX_OTP_PER_HOUR) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many OTP requests. Please wait before requesting another.",
        },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTPToken.create({
      email: normalizedEmail,
      otp: hashedOTP,
      expiresAt,
    });

    // Send email
    await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: "ITU × PUBGM Supremacy Cup — Email Verification",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 32px; border-radius: 12px; border: 1px solid #2a2a3e;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #f2a316; font-size: 24px; margin: 0;">ITU × PUBGM</h1>
            <p style="color: #a0a0b0; margin: 4px 0 0;">Supremacy Cup</p>
          </div>
          <h2 style="font-size: 20px; margin-bottom: 8px;">Verify Your Email</h2>
          <p style="color: #a0a0b0; margin-bottom: 24px;">Use the code below to verify your email address. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <div style="background: #1a1a2e; border: 2px solid #f2a316; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #f2a316;">${otp}</span>
          </div>
          <p style="color: #a0a0b0; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
