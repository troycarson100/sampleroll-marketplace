import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full rounded-md border border-sr bg-sr-card px-3 py-2 text-sm text-sr-ink placeholder:text-sr-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-sr-gold",
        className,
      )}
      {...props}
    />
  );
});
