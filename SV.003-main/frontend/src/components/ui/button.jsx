import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        /** Gradientes GUIAA (login/consulta/historial) — coherentes con App.css */
        guiaaPrimary:
          "border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none disabled:opacity-100",
        guiaaPrimarySm:
          "border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:from-slate-400 disabled:to-slate-500 disabled:opacity-70",
        guiaaSoft:
          "border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-700",
        guiaaDiagnosis:
          "relative w-full overflow-hidden border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        consult: "h-11 rounded-xl px-6 text-base font-semibold",
        consultWide: "min-h-[52px] w-full rounded-[14px] px-8 py-4 text-base font-bold",
        compactGradient: "h-8 rounded-lg px-4 text-[13px] font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
