"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { registerSchema, type RegisterInput } from "@/lib/validators/user.schema";

export default function RegisterPage() {
  const router = useRouter();
  const [sendingOTP, setSendingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function sendOTP() {
    const email = getValues("email");
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    setSendingOTP(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        toast.success("OTP sent to your email!");
      } else {
        toast.error(data.error ?? "Failed to send OTP");
      }
    } finally {
      setSendingOTP(false);
    }
  }

  async function onSubmit(values: RegisterInput) {
    if (!otpSent || otp.length !== 6) {
      toast.error("Please verify your email first");
      return;
    }

    setVerifying(true);
    try {
      // Verify OTP + create account
      const verifyRes = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          otp,
          password: values.password,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        toast.error(verifyData.error ?? "Verification failed");
        return;
      }

      // Auto sign in
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Account created! Please log in.");
        router.push("/login");
      } else {
        toast.success("Account created successfully!");
        router.push("/profile?onboarding=true");
      }
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 grid-bg">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/itu_logo.png" alt="ITU" width={40} height={40} className="object-contain" />
            <Image src="/pubg_logo.png" alt="PUBGM" width={40} height={40} className="object-contain" />
          </div>
          <h1 className="font-heading text-3xl font-bold gold-text">Create Account</h1>
          <p className="mt-2 text-sm text-[var(--text-2)]">
            Join the ITU × PUBGM Supremacy Cup
          </p>
        </div>

        {/* Google Sign In */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/profile?onboarding=true" })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-dim)] transition-colors text-sm font-medium mb-4"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-2)]">or register with email</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 game-card p-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            required
            {...register("email")}
          />

          {/* OTP section */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Verification Code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={sendOTP}
              loading={sendingOTP}
              className="h-10 shrink-0 mb-0.5"
            >
              {otpSent ? "Resend" : "Send OTP"}
            </Button>
          </div>
          {otpSent && (
            <p className="text-xs text-[var(--success)]">
              ✓ Code sent to your email (expires in 10 minutes)
            </p>
          )}

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            required
            {...register("password")}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            required
            {...register("confirmPassword")}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={verifying}
          >
            Create Account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--text-2)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--primary)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
