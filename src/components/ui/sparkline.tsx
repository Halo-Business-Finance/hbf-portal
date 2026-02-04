import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  fillOpacity?: number;
  showGradient?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  strokeWidth = 2,
  color = "hsl(var(--primary))",
  fillOpacity = 0.1,
  showGradient = true,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Normalize data points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  // Create SVG path
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  // Create area path for gradient fill
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
    >
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      
      {showGradient && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          className="transition-all duration-300"
        />
      )}
      
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />
      
      {/* End point indicator */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill={color}
        className="transition-all duration-300"
      />
    </svg>
  );
}

interface SparklineCardProps {
  label: string;
  value: string | number;
  data: number[];
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function SparklineCard({
  label,
  value,
  data,
  trend,
  trendValue,
  className,
}: SparklineCardProps) {
  const trendColor = trend === "up" 
    ? "hsl(152 82% 40%)" 
    : trend === "down" 
    ? "hsl(347 77% 50%)" 
    : "hsl(var(--primary))";

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold">{value}</span>
          {trendValue && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-emerald-600",
                trend === "down" && "text-rose-600",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trendValue}
            </span>
          )}
        </div>
      </div>
      <Sparkline data={data} color={trendColor} width={80} height={28} />
    </div>
  );
}
