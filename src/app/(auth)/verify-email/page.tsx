"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { MailCheck, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const password = searchParams.get("password") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function verify() {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Please enter the 6-digit code"); return; }
    setVerifying(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, ...(password && { password }) }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? "Verification failed"); return; }

      if (password) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (!result?.error) {
          toast.success("Email verified! Complete your profile.");
          router.push("/profile?onboarding=true");
          return;
        }
      }
      toast.success("Email verified! Please log in.");
      router.push("/login");
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) toast.success("New code sent!");
      else toast.error(data.error ?? "Failed to resend");
    } finally {
      setResending(false);
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
          <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center mx-auto mb-4">
            <MailCheck size={24} className="text-[var(--primary)]" />
          </div>
          <h1 className="font-heading text-3xl font-bold gold-text">Check Your Email</h1>
          {email && (
            <p className="mt-2 text-sm text-[var(--text-2)]">
              We sent a 6-digit code to{" "}
              <span className="text-[var(--text-1)] font-medium">{email}</span>
            </p>
          )}
        </div>

        <div className="game-card p-6 space-y-6">
          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-2)] mb-3 text-center">
              Enter verification code
            </label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-12 text-center text-xl font-mono font-bold rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-1)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
                />
              ))}
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={verify} loading={verifying}>
            Verify Code
          </Button>

          <div className="flex items-center justify-center">
            <button
              onClick={resend}
              disabled={resending}
              className="flex items-center gap-1.5 text-sm text-[var(--text-2)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
              {resending ? "Sending..." : "Resend code"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-[var(--text-2)]">
          Wrong email?{" "}
          <Link href="/register" className="text-[var(--primary)] hover:underline font-medium">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-[var(--text-2)]">Loading...</div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
