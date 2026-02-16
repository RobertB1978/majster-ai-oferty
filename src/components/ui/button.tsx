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
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg",
        success: "bg-success text-success-foreground shadow-sm hover:bg-success/90",
        warning: "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90",
        glow: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        xl: "h-14 rounded-xl px-8 text-lg",
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
