import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Roadmap 3.4: rounded-token-sm = 6px (radius-sm dla inputów)
          // Roadmap 3.1: border-[var(--border-default)] + bg-[var(--bg-surface)]
          // Roadmap 3.7: focus ring amber (accent-amber), 2px, offset 2px
          "flex h-10 w-full rounded-token-sm border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[var(--text-muted)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-2 focus-visible:border-[var(--accent-amber)] hover:border-[var(--border-default)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
