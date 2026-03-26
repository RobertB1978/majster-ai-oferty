/**
 * Button Component — §8 Micro-Interactions + §11.1 Core Components
 *
 * A versatile button with loading/success/error feedback states.
 * Built with Radix UI Slot for composition and CVA for variant management.
 *
 * @example
 * ```tsx
 * <Button>Click me</Button>
 * <Button isLoading>Saving…</Button>
 * <Button feedbackState="success">Saved</Button>
 * <Button variant="destructive">Delete</Button>
 * ```
 */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Button style variants using class-variance-authority.
 * Supports 10 visual variants and 7 size options.
 */
const buttonVariants = cva(
  // Roadmap 3.4: rounded-token-md = 10px (radius-md). Roadmap 3.7: focus ring = amber 2px offset 2px.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-token-md text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] active:duration-75",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-amber",
        destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline: "border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-muted hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-primary text-primary-foreground shadow-md hover:shadow-lg hover:opacity-90",
        success: "bg-success text-success-foreground shadow-xs hover:bg-success/90",
        warning: "bg-warning text-warning-foreground shadow-xs hover:bg-warning/90",
        // Roadmap 3.3: shadow-amber i shadow-amber-lg dla glow variant
        glow: "bg-primary text-primary-foreground shadow-amber hover:bg-primary/90 hover:shadow-amber-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-token-sm px-3 text-xs",
        lg: "h-12 rounded-token-md px-6 text-base",
        xl: "h-14 rounded-token-lg px-8 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Button component props.
 *
 * Roadmap §8 feedback states:
 * - isLoading: spinner replaces first child icon
 * - feedbackState "success": green flash + check (1.5s auto-reset)
 * - feedbackState "error": red + shake 200ms
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows spinner and disables button. Roadmap §8: "Loading (spinner replaces icon)" */
  isLoading?: boolean;
  /** Transient feedback state. Roadmap §8: success = green flash + check, error = shake */
  feedbackState?: 'idle' | 'success' | 'error';
}

/**
 * Button component with forward ref support.
 * Supports loading spinner, success flash, and error shake per §8 micro-interactions.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, feedbackState = 'idle', children, disabled, ...props }, ref) => {
    if (asChild) {
      return <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>{children}</Slot>;
    }

    const isDisabled = disabled || isLoading;

    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          feedbackState === 'success' && 'bg-[var(--state-success)] text-white shadow-none',
          feedbackState === 'error' && 'animate-shake bg-[var(--state-error)] text-white',
          className,
        )}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {children}
          </>
        ) : feedbackState === 'success' ? (
          <>
            <Check className="size-4" aria-hidden="true" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
