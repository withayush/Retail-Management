import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border border-[#D2D2D7]/16 bg-[#1D1D1F] px-3.5 py-1.5 text-xs text-white placeholder-[#6E6E73] transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-white focus-visible:border-[#0066CC] focus-visible:ring-2 focus-visible:ring-[#0066CC]/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-[#B64400] aria-invalid:ring-2 aria-invalid:ring-[#B64400]/20",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
