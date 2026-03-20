import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "primary", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sr-gold disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-sr-gold text-sr-bg hover:opacity-90",
          variant === "ghost" &&
            "border border-sr bg-transparent text-sr-ink hover:bg-sr-card",
          className,
        )}
        {...props}
      />
    );
  },
);
