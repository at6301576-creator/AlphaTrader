"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: Array<{ date: string; price: number }>;
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color = "#10b981", width = 100, height = 30 }: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-muted-foreground text-xs"
      >
        No data
      </div>
    );
  }

  // Determine color based on trend (first vs last price)
  const firstPrice = data[0]?.price || 0;
  const lastPrice = data[data.length - 1]?.price || 0;
  const trendColor = lastPrice >= firstPrice ? "#10b981" : "#ef4444"; // green or red

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={color || trendColor}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
