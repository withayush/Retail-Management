import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef(
  ({ className, size = "default", ...props }, ref) => {
    const spacingClass = size === "sm" ? "p-4 gap-3.5" : "p-6 gap-5";
    return (
      <div
        ref={ref}
        data-slot="card"
        data-size={size}
        className={cn(
          "group/card flex flex-col overflow-hidden rounded-[18px] bg-[#161617]/90 backdrop-blur-xl text-sm text-white shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-[#D2D2D7]/12 transition-all duration-300 hover:border-[#D2D2D7]/24",
          spacingClass,
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn("group/card-header flex flex-col gap-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-slot="card-title"
    className={cn("text-base font-semibold text-white tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="card-description"
    className={cn("text-xs text-[#6E6E73] font-normal leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardAction = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-action"
    className={cn("self-start justify-self-end", className)}
    {...props}
  />
));
CardAction.displayName = "CardAction";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-content"
    className={cn("", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-footer"
    className={cn("flex items-center", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
