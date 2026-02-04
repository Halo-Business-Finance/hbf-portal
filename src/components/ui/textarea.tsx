import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative w-full input-animated-focus">
        <textarea
          className={cn(
            // Base styles
            "flex min-h-[120px] w-full rounded-lg border bg-background text-sm text-foreground",
            "px-4 py-3 ring-offset-background transition-all duration-200",
            "placeholder:text-muted-foreground",
            // Focus styles
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0 focus-visible:border-primary",
            // Shadow and hover
            "shadow-sm hover:shadow-md hover:border-muted-foreground/30",
            // Disabled styles
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm",
            // Error state
            error && "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive",
            // Default border
            !error && "border-border",
            "relative z-[1]",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
