import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  [key: string]: string | number;
}

interface EnhancedBarChartProps {
  data: DataPoint[];
  xKey: string;
  yKey: string;
  yKey2?: string;
  height?: number;
  layout?: "horizontal" | "vertical";
  showGrid?: boolean;
  animate?: boolean;
  gradientId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
  valueFormatter?: (value: number) => string;
  barRadius?: number;
  barGap?: number;
  stacked?: boolean;
  colorByValue?: boolean;
  colorScale?: { threshold: number; color: string }[];
}

export function EnhancedBarChart({
  data,
  xKey,
  yKey,
  yKey2,
  height = 200,
  layout = "horizontal",
  showGrid = true,
  animate = true,
  gradientId = "barGradient",
  primaryColor = "hsl(213 94% 50%)",
  secondaryColor = "hsl(152 82% 40%)",
  className,
  valueFormatter,
  barRadius = 6,
  barGap = 4,
  stacked = false,
  colorByValue = false,
  colorScale,
}: EnhancedBarChartProps) {
  const [isVisible, setIsVisible] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  const getBarColor = (value: number): string => {
    if (!colorScale || colorScale.length === 0) return primaryColor;
    
    for (let i = colorScale.length - 1; i >= 0; i--) {
      if (value >= colorScale[i].threshold) {
        return colorScale[i].color;
      }
    }
    return colorScale[0].color;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-xl p-3 animate-scale-in">
          <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: entry.fill || entry.color }}
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

  const isVertical = layout === "vertical";
  const radius = isVertical
    ? [0, barRadius, barRadius, 0]
    : [barRadius, barRadius, 0, 0];

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
        <BarChart
          data={data}
          layout={layout}
          margin={{
            top: 10,
            right: 10,
            left: isVertical ? 60 : -20,
            bottom: 0,
          }}
          barGap={barGap}
        >
          <defs>
            <linearGradient id={`${gradientId}-primary`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity={1} />
              <stop offset="100%" stopColor={primaryColor} stopOpacity={0.7} />
            </linearGradient>
            {yKey2 && (
              <linearGradient id={`${gradientId}-secondary`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={secondaryColor} stopOpacity={1} />
                <stop offset="100%" stopColor={secondaryColor} stopOpacity={0.7} />
              </linearGradient>
            )}
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={isVertical}
              vertical={!isVertical}
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
          )}

          {isVertical ? (
            <>
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                dataKey={xKey}
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={55}
              />
            </>
          ) : (
            <>
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
            </>
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />

          <Bar
            dataKey={yKey}
            name={yKey.charAt(0).toUpperCase() + yKey.slice(1).replace(/_/g, " ")}
            fill={colorByValue ? undefined : `url(#${gradientId}-primary)`}
            radius={radius as any}
            stackId={stacked ? "stack" : undefined}
            animationDuration={animate ? 1200 : 0}
            animationEasing="ease-out"
          >
            {colorByValue &&
              data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(Number(entry[yKey]))}
                />
              ))}
          </Bar>

          {yKey2 && (
            <Bar
              dataKey={yKey2}
              name={yKey2.charAt(0).toUpperCase() + yKey2.slice(1).replace(/_/g, " ")}
              fill={`url(#${gradientId}-secondary)`}
              radius={radius as any}
              stackId={stacked ? "stack" : undefined}
              animationDuration={animate ? 1200 : 0}
              animationEasing="ease-out"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
