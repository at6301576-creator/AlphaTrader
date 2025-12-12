"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SectorData {
  sector: string;
  value: number;
  percentage: number;
  positionsCount: number;
}

interface DashboardClientProps {
  sectorData: SectorData[];
}

const COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // purple-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
];

export function DashboardClient({ sectorData }: DashboardClientProps) {
  if (!sectorData || sectorData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No sector data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={sectorData as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {sectorData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as SectorData;
                return (
                  <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg">
                    <p className="font-medium text-white">{data.sector}</p>
                    <p className="text-sm text-gray-400">
                      Value: ${data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-400">
                      Percentage: {data.percentage.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-400">
                      Positions: {data.positionsCount}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {sectorData.map((sector, index) => (
          <div key={sector.sector} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-300 truncate">{sector.sector}</p>
              <p className="text-xs text-gray-500">{sector.percentage.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
