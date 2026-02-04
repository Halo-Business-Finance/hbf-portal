import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  [key: string]: string | number;
}

interface LineConfig {
  key: string;
  color: string;
  name?: string;
  strokeWidth?: number;
  dashed?: boolean;
}

interface EnhancedLineChartProps {
  data: DataPoint[];
  xKey: string;
  lines: LineConfig[];
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  animate?: boolean;
  showLegend?: boolean;
  className?: string;
  valueFormatter?: (value: number) => string;
  curveType?: "monotone" | "linear" | "step" | "natural";
  showGlow?: boolean;
  referenceLines?: { value: number; color: string; label?: string }[];
}

export function EnhancedLineChart({
  data,
  xKey,
  lines,
  height = 200,
  showGrid = true,
  showDots = true,
  animate = true,
  showLegend = false,
  className,
  valueFormatter,
  curveType = "monotone",
  showGlow = true,
  referenceLines = [],
}: EnhancedLineChartProps) {
  const [isVisible, setIsVisible] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-xl p-3 animate-scale-in">
          <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
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
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {lines.map((line, index) => (
              <filter
                key={`glow-${index}`}
                id={`lineGlow-${index}`}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood floodColor={line.color} floodOpacity="0.3" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
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

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }}
          />

          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          )}

          {referenceLines.map((refLine, index) => (
            <ReferenceLine
              key={`ref-${index}`}
              y={refLine.value}
              stroke={refLine.color}
              strokeDasharray="5 5"
              strokeOpacity={0.6}
              label={
                refLine.label
                  ? {
                      value: refLine.label,
                      position: "insideTopRight",
                      fontSize: 10,
                      fill: refLine.color,
                    }
                  : undefined
              }
            />
          ))}

          {lines.map((line, index) => (
            <Line
              key={line.key}
              type={curveType}
              dataKey={line.key}
              name={line.name || line.key.charAt(0).toUpperCase() + line.key.slice(1)}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2.5}
              strokeDasharray={line.dashed ? "5 5" : undefined}
              filter={showGlow ? `url(#lineGlow-${index})` : undefined}
              dot={
                showDots
                  ? {
                      fill: line.color,
                      strokeWidth: 2,
                      r: 4,
                      stroke: "white",
                    }
                  : false
              }
              activeDot={{
                r: 6,
                stroke: "white",
                strokeWidth: 2,
                fill: line.color,
              }}
              animationDuration={animate ? 1500 : 0}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
