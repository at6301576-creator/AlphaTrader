"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart } from "lucide-react";

interface SectorAllocation {
  name: string;
  value: number;
  percentage: number;
}

interface SectorAllocationChartProps {
  sectors: SectorAllocation[];
}

// Color palette for sectors
const SECTOR_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#6366f1", // indigo-500
  "#f97316", // orange-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#a855f7", // purple-500
];

export function SectorAllocationChart({ sectors }: SectorAllocationChartProps) {
  if (sectors.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-500" />
            Sector Allocation
          </CardTitle>
          <CardDescription>Portfolio distribution by sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <PieChart className="h-12 w-12 mb-3 opacity-50" />
            <p>No portfolio data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by percentage descending
  const sortedSectors = [...sectors].sort((a, b) => b.percentage - a.percentage);

  // Calculate SVG pie chart
  const total = sortedSectors.reduce((sum, s) => sum + s.value, 0);
  let currentAngle = 0;

  const pieSegments = sortedSectors.map((sector, index) => {
    const percentage = (sector.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 50 + 45 * Math.cos(startRad);
    const y1 = 50 + 45 * Math.sin(startRad);
    const x2 = 50 + 45 * Math.cos(endRad);
    const y2 = 50 + 45 * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = [
      `M 50 50`,
      `L ${x1} ${y1}`,
      `A 45 45 0 ${largeArc} 1 ${x2} ${y2}`,
      `Z`,
    ].join(" ");

    return {
      sector,
      path,
      color: SECTOR_COLORS[index % SECTOR_COLORS.length],
    };
  });

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-blue-500" />
          Sector Allocation
        </CardTitle>
        <CardDescription>Portfolio distribution by sector</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-64 h-64">
              {pieSegments.map((segment, index) => (
                <g key={index}>
                  <path
                    d={segment.path}
                    fill={segment.color}
                    stroke="#111827"
                    strokeWidth="0.5"
                    className="transition-opacity hover:opacity-80 cursor-pointer"
                  />
                </g>
              ))}
              {/* Center circle for donut effect */}
              <circle cx="50" cy="50" r="20" fill="#111827" />
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {sortedSectors.map((sector, index) => (
              <div
                key={sector.name}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {sector.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">
                    ${sector.value.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  <Badge variant="outline" className="text-xs min-w-[3.5rem] justify-center">
                    {sector.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
