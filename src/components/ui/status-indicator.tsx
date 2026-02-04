import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "active" | "pending" | "success" | "warning" | "error" | "inactive";
  label?: string;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusStyles = {
  active: {
    dot: "bg-blue-500",
    ring: "ring-blue-500/30",
    text: "text-blue-600",
  },
  pending: {
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    text: "text-amber-600",
  },
  success: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    text: "text-emerald-600",
  },
  warning: {
    dot: "bg-orange-500",
    ring: "ring-orange-500/30",
    text: "text-orange-600",
  },
  error: {
    dot: "bg-rose-500",
    ring: "ring-rose-500/30",
    text: "text-rose-600",
  },
  inactive: {
    dot: "bg-slate-400",
    ring: "ring-slate-400/30",
    text: "text-slate-500",
  },
};

const sizeStyles = {
  sm: {
    dot: "w-2 h-2",
    ring: "ring-2",
    text: "text-xs",
  },
  md: {
    dot: "w-2.5 h-2.5",
    ring: "ring-2",
    text: "text-sm",
  },
  lg: {
    dot: "w-3 h-3",
    ring: "ring-3",
    text: "text-base",
  },
};

export function StatusIndicator({
  status,
  label,
  pulse = false,
  size = "md",
  className,
}: StatusIndicatorProps) {
  const styles = statusStyles[status];
  const sizes = sizeStyles[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex">
        <span
          className={cn(
            "rounded-full",
            sizes.dot,
            styles.dot,
            pulse && "animate-pulse"
          )}
        />
        {pulse && (
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-75",
              styles.dot
            )}
          />
        )}
      </span>
      {label && (
        <span className={cn("font-medium", sizes.text, styles.text)}>
          {label}
        </span>
      )}
    </div>
  );
}

interface LiveIndicatorProps {
  label?: string;
  className?: string;
}

export function LiveIndicator({ label = "Live", className }: LiveIndicatorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-xs font-semibold text-emerald-600">{label}</span>
    </div>
  );
}
