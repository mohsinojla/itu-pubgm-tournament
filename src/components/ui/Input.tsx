import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            {label}
            {props.required && (
              <span className="text-[var(--danger)] ml-1">*</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border text-[var(--text-1)] placeholder:text-[var(--text-2)]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm",
            error
              ? "border-[var(--danger)] focus:ring-[var(--danger)]"
              : "border-[var(--border)] focus:border-[var(--primary)]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-xs text-[var(--text-2)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
