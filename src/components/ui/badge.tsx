import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Roadmap 3.4: rounded-token-full = 9999px (pills/avatary). Focus ring amber.
  "inline-flex items-center rounded-token-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-amber)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:   "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Roadmap 3.1: używamy state tokenów bezpośrednio
        destructive: "border-transparent bg-[var(--state-error)]/15 text-[var(--state-error)] border-[var(--state-error)]/25 hover:bg-[var(--state-error)]/20",
        outline:     "text-[var(--text-primary)] border-[var(--border-default)]",
        success:     "border-[var(--state-success)]/25 bg-[var(--state-success)]/15 text-[var(--state-success)] hover:bg-[var(--state-success)]/20",
        warning:     "border-[var(--state-warning)]/25 bg-[var(--state-warning)]/15 text-[var(--state-warning)] hover:bg-[var(--state-warning)]/20",
        info:        "border-[var(--state-info)]/25 bg-[var(--state-info)]/15 text-[var(--state-info)] hover:bg-[var(--state-info)]/20",
        premium:     "border-transparent bg-gradient-primary text-primary-foreground hover:opacity-90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
