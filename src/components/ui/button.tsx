/**
 * Button Component
 *
 * A versatile button component with multiple variants, sizes, and states.
 * Built with Radix UI Slot for composition and CVA for variant management.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 *
 * // With variants
 * <Button variant="destructive">Delete</Button>
 * <Button variant="outline" size="lg">Large Outline</Button>
 *
 * // Icon button
 * <Button variant="ghost" size="icon" aria-label="Close">
 *   <X className="h-4 w-4" />
 * </Button>
 *
 * // As child (render as link)
 * <Button asChild>
 *   <a href="/dashboard">Dashboard</a>
 * </Button>
 * ```
 */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

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
 * @property {ButtonVariant} variant - Visual style variant (default, destructive, outline, etc.)
 * @property {ButtonSize} size - Size variant (default, sm, lg, xl, icon, etc.)
 * @property {boolean} asChild - Render as child element (uses Radix Slot)
 *
 * @extends React.ButtonHTMLAttributes<HTMLButtonElement>
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, renders the child element instead of a button */
  asChild?: boolean;
}

/**
 * Button component with forward ref support.
 * Supports all standard button HTML attributes plus variant and size props.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
