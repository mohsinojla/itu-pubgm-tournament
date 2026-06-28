import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function Card({ children, className, hover, glow }: CardProps) {
  return (
    <div
      className={cn(
        "game-card p-5",
        hover && "transition-all duration-200 hover:border-[var(--primary-dim)] hover:-translate-y-0.5",
        glow && "glow-primary-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
