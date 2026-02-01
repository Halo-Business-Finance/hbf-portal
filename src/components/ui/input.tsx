import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
export interface InputProps extends React.ComponentProps<"input"> {
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  error?: boolean;
}
const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  type,
  icon: Icon,
  iconPosition = "left",
  error,
  ...props
}, ref) => {
  const hasIcon = !!Icon;
  return <div className="relative">
        {hasIcon && iconPosition === "left" && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon className="h-4 w-4" />
          </div>}
        
        {hasIcon && iconPosition === "right" && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon className="h-4 w-4" />
          </div>}
      </div>;
});
Input.displayName = "Input";
export { Input };