import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-xs font-semibold whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0,0,0.5,1)] outline-none select-none focus-visible:border-[#0066CC] focus-visible:ring-2 focus-visible:ring-[#0066CC]/30 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-[#B64400] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer active:scale-95 tracking-tight",
  {
    variants: {
      variant: {
        default: "bg-[#0066CC] text-white hover:bg-[#0077ED] shadow-[0_2px_10px_rgba(0,102,204,0.3)] hover:shadow-[0_4px_18px_rgba(0,102,204,0.45)] border-white/10",
        primary: "bg-[#0066CC] text-white hover:bg-[#0077ED] shadow-[0_2px_10px_rgba(0,102,204,0.3)] hover:shadow-[0_4px_18px_rgba(0,102,204,0.45)] border-white/10",
        secondary:
          "bg-[#D2D2D7]/10 text-white border border-[#D2D2D7]/16 hover:bg-[#D2D2D7]/18 hover:border-[#D2D2D7]/28",
        outline:
          "border-[#D2D2D7]/20 bg-transparent text-white hover:bg-white/10 hover:border-[#D2D2D7]/35",
        ghost:
          "hover:bg-white/10 hover:text-white text-[#D2D2D7]",
        destructive:
          "bg-[#B64400]/20 text-[#FF791B] border border-[#B64400]/40 hover:bg-[#B64400]/30 hover:border-[#FF791B]/60 focus-visible:ring-[#B64400]/30",
        link: "text-[#0066CC] underline-offset-4 hover:underline hover:text-[#54A7FF] p-0 h-auto",
        orange: "bg-[#FF791B] text-white hover:bg-[#FF8A4C] shadow-[0_2px_10px_rgba(255,121,27,0.3)]",
      },
      size: {
        default: "h-9 gap-2 px-4 text-xs",
        xs: "h-6 gap-1 px-2.5 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-xs",
        lg: "h-11 gap-2 px-6 text-sm font-semibold",
        icon: "size-9 rounded-full",
        "icon-xs": "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-full",
        "icon-lg": "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        data-slot="button"
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
