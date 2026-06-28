import { cn } from "@/lib/utils/cn";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function PageHero({
  title,
  subtitle,
  children,
  className,
}: PageHeroProps) {
  return (
    <div
      className={cn(
        "relative py-12 sm:py-16 px-4 overflow-hidden grid-bg",
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-glow">
          <span className="gold-text">{title}</span>
        </h1>
        {subtitle && (
          <p className="mt-3 text-[var(--text-2)] text-base sm:text-lg max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />
    </div>
  );
}
