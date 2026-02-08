import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./premium-card";
import { AnimatedCounter, AnimatedCurrency } from "./animated-counter";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: "number" | "currency" | "percentage";
  icon?: ReactNode;
  iconBackground?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  trendLabel?: string;
  className?: string;
  loading?: boolean;
  children?: ReactNode;
}

export function MetricCard({
  title,
  value,
  previousValue,
  format = "number",
  icon,
  iconBackground = "bg-primary/10",
  trend,
  trendValue,
  trendLabel,
  className,
  loading = false,
  children,
}: MetricCardProps) {
  // Calculate trend if previous value is provided
  const calculatedTrend = trend ?? (previousValue !== undefined
    ? value > previousValue
      ? "up"
      : value < previousValue
      ? "down"
      : "neutral"
    : undefined);

  const calculatedTrendValue = trendValue ?? (previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : undefined);

  const TrendIcon = calculatedTrend === "up" 
    ? TrendingUp 
    : calculatedTrend === "down" 
    ? TrendingDown 
    : Minus;

  const trendColor = calculatedTrend === "up" 
    ? "text-emerald-600" 
    : calculatedTrend === "down" 
    ? "text-rose-600" 
    : "text-muted-foreground";

  const formatValue = () => {
    if (format === "currency") {
      return <AnimatedCurrency value={value} className="text-3xl font-bold tracking-tight" />;
    }
    if (format === "percentage") {
      return (
        <AnimatedCounter
          value={value}
          formatFn={(v) => `${v.toFixed(1)}%`}
          className="text-3xl font-bold tracking-tight"
        />
      );
    }
    return (
      <AnimatedCounter
        value={value}
        formatFn={(v) => new Intl.NumberFormat("en-US").format(Math.round(v))}
        className="text-3xl font-bold tracking-tight"
      />
    );
  };

  if (loading) {
    return (
      <PremiumCard variant="metric" className={cn("animate-pulse", className)}>
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
        <div className="h-8 w-24 rounded bg-muted mb-2" />
        <div className="h-4 w-20 rounded bg-muted" />
      </PremiumCard>
    );
  }

  return (
    <PremiumCard variant="metric" className={className}>
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className={cn("p-2.5 rounded-lg", iconBackground)}>
            {icon}
          </div>
        )}
        {calculatedTrend && calculatedTrendValue !== undefined && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(calculatedTrendValue).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        {formatValue()}
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
      </div>

      {(trendLabel || children) && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {trendLabel && (
            <p className="text-xs text-muted-foreground">{trendLabel}</p>
          )}
          {children}
        </div>
      )}
    </PremiumCard>
  );
}

interface MiniMetricProps {
  label: string;
  value: number;
  format?: "number" | "currency" | "percentage";
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MiniMetric({
  label,
  value,
  format = "number",
  trend,
  className,
}: MiniMetricProps) {
  const trendColor = trend === "up" 
    ? "text-emerald-600" 
    : trend === "down" 
    ? "text-rose-600" 
    : "text-foreground";

  const formatValue = () => {
    if (format === "currency") {
      return <AnimatedCurrency value={value} className={cn("text-xl font-bold", trendColor)} />;
    }
    if (format === "percentage") {
      return (
        <AnimatedCounter
          value={value}
          formatFn={(v) => `${v.toFixed(1)}%`}
          className={cn("text-xl font-bold", trendColor)}
        />
      );
    }
    return (
      <AnimatedCounter
        value={value}
        className={cn("text-xl font-bold", trendColor)}
      />
    );
  };

  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      {formatValue()}
    </div>
  );
}
