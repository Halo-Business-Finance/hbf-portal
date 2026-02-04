import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  [key: string]: string | number;
}

interface EnhancedAreaChartProps {
  data: DataPoint[];
  xKey: string;
  yKey: string;
  yKey2?: string;
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  animate?: boolean;
  gradientId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
  valueFormatter?: (value: number) => string;
  showAverage?: boolean;
}

export function EnhancedAreaChart({
  data,
  xKey,
  yKey,
  yKey2,
  height = 200,
  showGrid = true,
  showDots = true,
  animate = true,
  gradientId = "areaGradient",
  primaryColor = "hsl(213 94% 50%)",
  secondaryColor = "hsl(152 82% 40%)",
  className,
  valueFormatter,
  showAverage = false,
}: EnhancedAreaChartProps) {
  const [isVisible, setIsVisible] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  const average = data.length > 0
    ? data.reduce((sum, item) => sum + (Number(item[yKey]) || 0), 0) / data.length
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-xl p-3 animate-scale-in">
          <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold text-foreground">
                {valueFormatter ? valueFormatter(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`${gradientId}-primary`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity={0.4} />
              <stop offset="50%" stopColor={primaryColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
            </linearGradient>
            {yKey2 && (
              <linearGradient id={`${gradientId}-secondary`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={secondaryColor} stopOpacity={0.4} />
                <stop offset="50%" stopColor={secondaryColor} stopOpacity={0.15} />
                <stop offset="100%" stopColor={secondaryColor} stopOpacity={0} />
              </linearGradient>
            )}
            {/* Glow filter for the line */}
            <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
          )}

          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            width={40}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }} />

          {showAverage && (
            <ReferenceLine
              y={average}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              strokeOpacity={0.6}
              label={{
                value: `Avg: ${valueFormatter ? valueFormatter(average) : average.toFixed(1)}`,
                position: "insideTopRight",
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey={yKey}
            name={yKey.charAt(0).toUpperCase() + yKey.slice(1)}
            stroke={primaryColor}
            strokeWidth={2.5}
            fill={`url(#${gradientId}-primary)`}
            filter={`url(#${gradientId}-glow)`}
            dot={showDots ? {
              fill: primaryColor,
              strokeWidth: 2,
              r: 4,
              stroke: "white",
            } : false}
            activeDot={{
              r: 6,
              stroke: "white",
              strokeWidth: 2,
              fill: primaryColor,
            }}
            animationDuration={animate ? 1500 : 0}
            animationEasing="ease-out"
          />

          {yKey2 && (
            <Area
              type="monotone"
              dataKey={yKey2}
              name={yKey2.charAt(0).toUpperCase() + yKey2.slice(1)}
              stroke={secondaryColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId}-secondary)`}
              dot={showDots ? {
                fill: secondaryColor,
                strokeWidth: 2,
                r: 4,
                stroke: "white",
              } : false}
              activeDot={{
                r: 6,
                stroke: "white",
                strokeWidth: 2,
                fill: secondaryColor,
              }}
              animationDuration={animate ? 1500 : 0}
              animationEasing="ease-out"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
