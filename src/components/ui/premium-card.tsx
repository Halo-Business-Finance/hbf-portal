import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const premiumCardVariants = cva(
  "relative rounded-xl transition-all duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-card border border-border shadow-card",
        glass: "glass-card",
        "glass-strong": "frosted-panel",
        "glass-glow": "glass-card-glow",
        elevated: "bg-card border border-border/60 shadow-card",
        gradient: "bg-card border border-border/40 shadow-card",
        metric: "bg-card border border-border/60 shadow-card",
        glow: "bg-card border border-border shadow-card",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface PremiumCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof premiumCardVariants> {
  glowColor?: string;
  gradientBorder?: boolean;
}

const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, variant, size, glowColor, gradientBorder, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          premiumCardVariants({ variant, size }),
          // Keep keyboard accessibility (focus-within) without hover effects
          gradientBorder &&
            "before:absolute before:inset-0 before:rounded-xl before:p-px before:bg-gradient-primary before:opacity-0 focus-within:before:opacity-100 before:transition-opacity before:duration-300 before:-z-10",
          className
        )}
        style={glowColor ? { "--glow-color": glowColor } as React.CSSProperties : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PremiumCard.displayName = "PremiumCard";

const PremiumCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
PremiumCardHeader.displayName = "PremiumCardHeader";

const PremiumCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
PremiumCardTitle.displayName = "PremiumCardTitle";

const PremiumCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
PremiumCardDescription.displayName = "PremiumCardDescription";

const PremiumCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
PremiumCardContent.displayName = "PremiumCardContent";

const PremiumCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
PremiumCardFooter.displayName = "PremiumCardFooter";

export {
  PremiumCard,
  PremiumCardHeader,
  PremiumCardTitle,
  PremiumCardDescription,
  PremiumCardContent,
  PremiumCardFooter,
  premiumCardVariants,
};
