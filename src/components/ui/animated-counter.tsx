import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  formatFn,
  className,
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = formatFn ? formatFn(displayValue) : Math.round(displayValue).toString();

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

interface AnimatedCurrencyProps {
  value: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
}

export function AnimatedCurrency({
  value,
  duration = 1000,
  className,
  showSign = false,
}: AnimatedCurrencyProps) {
  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(val));
    
    if (showSign && val > 0) return `+${formatted}`;
    if (val < 0) return `-${formatted}`;
    return formatted;
  };

  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      formatFn={formatCurrency}
      className={className}
    />
  );
}

interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
  decimals?: number;
}

export function AnimatedPercentage({
  value,
  duration = 1000,
  className,
  showSign = false,
  decimals = 1,
}: AnimatedPercentageProps) {
  const formatPercentage = (val: number) => {
    const formatted = val.toFixed(decimals);
    const sign = showSign && val > 0 ? "+" : "";
    return `${sign}${formatted}%`;
  };

  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      formatFn={formatPercentage}
      className={className}
    />
  );
}
