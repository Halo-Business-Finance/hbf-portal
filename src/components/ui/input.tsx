import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface InputProps extends React.ComponentProps<"input"> {
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon: Icon, iconPosition = "left", error, ...props }, ref) => {
    const hasIcon = !!Icon;
    
    return (
      <div className="relative">
        {hasIcon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          type={type}
          className={cn(
            // Base styles
            "flex h-11 w-full rounded-lg border-2 border-blue-500 bg-background text-sm text-foreground",
            "ring-offset-background transition-all duration-200",
            "placeholder:text-muted-foreground",
            // Focus styles
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 focus-visible:ring-offset-0 focus-visible:border-blue-400",
            // Shadow and hover
            "shadow-sm hover:shadow-md hover:border-blue-400",
            // Disabled styles
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm",
            // File input styles
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            // Icon padding
            hasIcon && iconPosition === "left" && "pl-10",
            hasIcon && iconPosition === "right" && "pr-10",
            !hasIcon && "px-4",
            // Error state
            error && "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive",
            // Default border
            !error && "border-blue-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {hasIcon && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
