import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "danger" | "warning" | "blue";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)]",
  primary: "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30",
  success: "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30",
  danger: "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30",
  warning: "bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30",
  blue: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
};

const sizes = {
  sm: "px-2 py-0.5 text-[10px] rounded-md",
  md: "px-2.5 py-1 text-xs rounded-lg",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold uppercase tracking-wider",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
