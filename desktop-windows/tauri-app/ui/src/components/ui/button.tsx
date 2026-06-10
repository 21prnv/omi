import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Omi buttons. Primary = purple; secondary = bg3; ghost = transparent hover.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-omi-purple text-white hover:bg-omi-purple/90",
        secondary: "bg-omi-bg3 text-omi-text2 hover:bg-omi-bg3/70",
        ghost: "text-omi-text3 hover:bg-omi-bg3/75 hover:text-omi-text",
        destructive: "bg-omi-error text-white hover:bg-omi-error/90",
        light: "bg-white text-black hover:bg-white/90",
      },
      size: {
        default: "h-9 px-4 rounded-control text-[13px]",
        sm: "h-8 px-3 rounded-chip text-xs",
        icon: "h-9 w-9 rounded-control",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = "Button";
