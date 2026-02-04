import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface EnhancedPieChartProps {
  data: DataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  animate?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
  valueFormatter?: (value: number) => string;
  centerContent?: React.ReactNode;
  colors?: string[];
  paddingAngle?: number;
  strokeWidth?: number;
}

const DEFAULT_COLORS = [
  "hsl(213 94% 50%)",
  "hsl(152 82% 40%)",
  "hsl(38 92% 50%)",
  "hsl(262 83% 58%)",
  "hsl(0 84% 60%)",
  "hsl(186 94% 41%)",
];

export function EnhancedPieChart({
  data,
  height = 200,
  innerRadius = 50,
  outerRadius = 80,
  animate = true,
  showLabels = false,
  showLegend = false,
  showTooltip = true,
  className,
  valueFormatter,
  centerContent,
  colors = DEFAULT_COLORS,
  paddingAngle = 2,
  strokeWidth = 0,
}: EnhancedPieChartProps) {
  const [isVisible, setIsVisible] = useState(!animate);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-xl p-3 animate-scale-in">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.payload.fill || item.payload.color }}
            />
            <span className="font-semibold text-foreground">{item.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Value:{" "}
            <span className="font-semibold text-foreground">
              {valueFormatter ? valueFormatter(item.value) : item.value}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Share: <span className="font-semibold text-foreground">{percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={11}
        fontWeight={500}
      >
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    ) : null;
  };

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div
      className={cn(
        "relative transition-all duration-700 ease-out",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {data.map((_, index) => {
              const color = colors[index % colors.length];
              return (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`pieGradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.75} />
                </linearGradient>
              );
            })}
            <filter id="pieShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={strokeWidth}
            label={showLabels ? renderCustomLabel : undefined}
            labelLine={showLabels}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            animationDuration={animate ? 1200 : 0}
            animationEasing="ease-out"
            filter="url(#pieShadow)"
          >
            {data.map((entry, index) => {
              const isActive = activeIndex === index;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || `url(#pieGradient-${index})`}
                  style={{
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                    transformOrigin: "center",
                    transition: "transform 0.2s ease-out",
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </Pie>

          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Center content for donut chart */}
      {centerContent && innerRadius > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {centerContent}
        </div>
      )}
    </div>
  );
}
