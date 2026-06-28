import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
    </div>
  );
}
