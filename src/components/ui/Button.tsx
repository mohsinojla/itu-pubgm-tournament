import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary:
    "bg-[var(--primary)] text-black font-semibold hover:bg-[var(--primary-dim)] glow-primary-sm",
  secondary:
    "bg-[var(--surface)] text-[var(--text-1)] border border-[var(--border)] hover:border-[var(--primary-dim)]",
  outline:
    "border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10",
  ghost:
    "text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface)]",
  danger:
    "bg-[var(--danger)] text-white hover:bg-red-600",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3.5 text-base rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin shrink-0" />}
      {children}
    </button>
  );
}
