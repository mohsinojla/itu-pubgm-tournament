"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mb-6">
        <AlertTriangle size={28} className="text-[var(--danger)]" />
      </div>
      <h2 className="font-heading text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-[var(--text-2)] mb-8 max-w-sm text-sm">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-black font-semibold text-sm hover:bg-[var(--primary-dim)] transition-colors"
        >
          Try Again
        </button>
        <a
          href="/"
          className="px-6 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:border-[var(--primary-dim)] transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
