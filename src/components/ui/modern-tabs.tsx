import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
const ModernTabs = TabsPrimitive.Root;
const ModernTabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({
  className,
  ...props
}, ref) => <TabsPrimitive.List ref={ref} className={cn("inline-flex w-full items-center justify-center rounded-lg p-1 bg-white", className)} {...props} />);
ModernTabsList.displayName = TabsPrimitive.List.displayName;
interface ModernTabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  count?: number;
}
const ModernTabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, ModernTabsTriggerProps>(({
  className,
  count,
  children,
  ...props
}, ref) => <TabsPrimitive.Trigger ref={ref} className={cn("flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-3 text-sm font-medium text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-600 data-[state=active]:shadow-md data-[state=inactive]:bg-black data-[state=inactive]:hover:bg-gray-800", className)} {...props}>
    {children}
    {count !== undefined && <span className="ml-2 rounded-full bg-gray-600 px-2 py-0.5 text-xs text-white data-[state=active]:bg-blue-700">
        {count}
      </span>}
  </TabsPrimitive.Trigger>);
ModernTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
const ModernTabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({
  className,
  ...props
}, ref) => <TabsPrimitive.Content ref={ref} className={cn("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} {...props} />);
ModernTabsContent.displayName = TabsPrimitive.Content.displayName;
export { ModernTabs, ModernTabsList, ModernTabsTrigger, ModernTabsContent };