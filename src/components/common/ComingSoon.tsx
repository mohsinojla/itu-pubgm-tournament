"use client";

import { Clock } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({
  title = "Coming Soon",
  description = "This feature is being prepared. Check back soon!",
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-[var(--primary)]/10 flex items-center justify-center glow-primary">
          <Clock size={40} className="text-[var(--primary)]" />
        </div>
        <div className="absolute inset-0 rounded-full bg-[var(--primary)]/5 animate-ping" />
      </div>
      <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3 gold-text">
        {title}
      </h2>
      <p className="text-[var(--text-2)] max-w-md text-sm sm:text-base">
        {description}
      </p>
    </div>
  );
}
