import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const ModernTabs = TabsPrimitive.Root;

const ModernTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex w-full items-center gap-1 border-b border-border bg-transparent",
      className
    )}
    {...props}
  />
));
ModernTabsList.displayName = TabsPrimitive.List.displayName;

interface ModernTabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  count?: number;
}

const ModernTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  ModernTabsTriggerProps
>(({ className, count, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all",
      "text-muted-foreground hover:text-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Active state - primary color with underline indicator
      "data-[state=active]:text-primary",
      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent",
      "data-[state=active]:after:bg-primary",
      className
    )}
    {...props}
  >
    {children}
    {count !== undefined && (
      <span
        className={cn(
          "inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium rounded-full transition-colors",
          "bg-muted text-muted-foreground",
          "data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
        )}
        data-state={props["data-state"]}
      >
        {count}
      </span>
    )}
  </TabsPrimitive.Trigger>
));
ModernTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const ModernTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "animate-in fade-in-50 duration-300",
      className
    )}
    {...props}
  />
));
ModernTabsContent.displayName = TabsPrimitive.Content.displayName;

export { ModernTabs, ModernTabsList, ModernTabsTrigger, ModernTabsContent };
