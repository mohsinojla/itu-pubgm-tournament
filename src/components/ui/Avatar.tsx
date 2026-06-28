import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

const iconSizes = { xs: 10, sm: 14, md: 18, lg: 22, xl: 30 };

export default function Avatar({ src, alt = "User", name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden border border-[var(--border)] bg-[var(--surface)] shrink-0",
        sizes[size],
        className
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[var(--primary)]/15 text-[var(--primary)]">
          {name ? (
            <span className={`font-bold ${size === "xs" ? "text-[8px]" : size === "sm" ? "text-xs" : "text-sm"}`}>
              {name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User size={iconSizes[size]} />
          )}
        </div>
      )}
    </div>
  );
}
