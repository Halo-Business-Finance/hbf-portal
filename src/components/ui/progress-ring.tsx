import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  children?: ReactNode;
  showValue?: boolean;
  animate?: boolean;
}

export function ProgressRing({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  color = "hsl(var(--primary))",
  trackColor = "hsl(var(--border))",
  className,
  children,
  showValue = false,
  animate = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(animate && "transition-all duration-700 ease-out")}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <span className="text-sm font-bold">
            {Math.round(percentage * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

interface MultiProgressRingProps {
  segments: {
    value: number;
    color: string;
    label?: string;
  }[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}

export function MultiProgressRing({
  segments,
  size = 100,
  strokeWidth = 10,
  className,
  children,
}: MultiProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  let accumulatedOffset = 0;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        
        {/* Segments */}
        {segments.map((segment, index) => {
          const percentage = total > 0 ? segment.value / total : 0;
          const strokeDasharray = `${percentage * circumference} ${circumference}`;
          const rotation = (accumulatedOffset / total) * 360;
          accumulatedOffset += segment.value;

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              className="transition-all duration-700 ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "center",
              }}
            />
          );
        })}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
