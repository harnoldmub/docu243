import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

// Shared button styles. Every size keeps a 44px minimum touch target.
const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold leading-none " +
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out " +
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-[1.15em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-royal text-white hover:bg-brand-deep",
        primary: "bg-brand-royal text-white hover:bg-brand-deep",
        // On a blue background: yellow with dark text.
        yellow: "bg-brand-yellow text-brand-ink hover:bg-[#ffe14d]",
        // Sober white on blue backgrounds.
        "on-blue": "border border-white/70 bg-transparent text-white hover:bg-white hover:text-brand-deep",
        outline: "border border-[hsl(var(--input))] bg-white text-brand-ink hover:border-brand-ink hover:bg-brand-mist",
        secondary: "border border-[hsl(var(--input))] bg-white text-brand-ink hover:border-brand-ink hover:bg-brand-mist",
        ghost: "text-brand-ink hover:bg-brand-mist",
        tertiary: "px-1 text-brand-royal underline-offset-4 hover:underline",
        destructive: "bg-[var(--st-danger)] text-white hover:bg-[#8f0e22]",
      },
      size: {
        default: "min-h-11 px-5 text-[0.9375rem]",
        sm: "min-h-11 px-3.5 text-sm",
        lg: "min-h-[3.25rem] px-6 text-base",
        xl: "min-h-14 px-7 text-[1.0625rem]",
        icon: "h-11 w-11",
      },
    },
    compoundVariants: [{ variant: "tertiary", class: "px-1" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
        <Slottable>{children}</Slottable>
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
