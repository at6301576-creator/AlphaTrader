"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BenchmarkComparisonProps {
  portfolioData: Array<{
    date: Date;
    value: number;
  }>;
  period: string;
}

interface BenchmarkData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  historicalData: Array<{
    date: string;
    close: number;
  }>;
}

const BENCHMARKS = [
  { value: "^GSPC", label: "S&P 500" },
  { value: "^IXIC", label: "NASDAQ" },
  { value: "^DJI", label: "Dow Jones" },
  { value: "^FTSE", label: "FTSE 100" },
];

export function BenchmarkComparison({ portfolioData, period }: BenchmarkComparisonProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState("^GSPC");
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<Array<{
    date: string;
    portfolio: number;
    benchmark: number;
  }>>([]);

  useEffect(() => {
    fetchBenchmarkData();
  }, [selectedBenchmark, period]);

  useEffect(() => {
    if (benchmarkData && portfolioData.length > 0) {
      prepareChartData();
    }
  }, [benchmarkData, portfolioData]);

  const fetchBenchmarkData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/benchmarks?symbol=${selectedBenchmark}&period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setBenchmarkData(data);
      }
    } catch (error) {
      console.error("Error fetching benchmark data:", error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!benchmarkData || portfolioData.length === 0) {
      console.log("No data to prepare:", {
        hasBenchmark: !!benchmarkData,
        portfolioLength: portfolioData.length,
        benchmarkLength: benchmarkData?.historicalData?.length
      });
      return;
    }

    console.log("Preparing chart data:", {
      portfolioData: portfolioData.slice(0, 3),
      benchmarkData: benchmarkData.historicalData.slice(0, 3)
    });

    // Normalize both series to start at 100
    const portfolioStart = portfolioData[0]?.value || 1;
    const benchmarkStart = benchmarkData.historicalData[0]?.close || 1;

    // Create a map of benchmark data by date
    const benchmarkMap = new Map(
      benchmarkData.historicalData.map(item => [item.date, item.close])
    );

    console.log("Benchmark dates sample:", Array.from(benchmarkMap.keys()).slice(0, 5));

    // Combine data - try to match dates flexibly
    const combined = portfolioData.map((item) => {
      const dateStr = new Date(item.date).toISOString().split("T")[0];
      let benchmarkValue = benchmarkMap.get(dateStr);

      // If exact match not found, try to find closest date (within 3 days)
      if (!benchmarkValue) {
        const itemDate = new Date(dateStr);
        for (let offset = 1; offset <= 3; offset++) {
          // Try previous days
          const prevDate = new Date(itemDate);
          prevDate.setDate(prevDate.getDate() - offset);
          const prevDateStr = prevDate.toISOString().split("T")[0];
          if (benchmarkMap.has(prevDateStr)) {
            benchmarkValue = benchmarkMap.get(prevDateStr);
            break;
          }
          // Try next days
          const nextDate = new Date(itemDate);
          nextDate.setDate(nextDate.getDate() + offset);
          const nextDateStr = nextDate.toISOString().split("T")[0];
          if (benchmarkMap.has(nextDateStr)) {
            benchmarkValue = benchmarkMap.get(nextDateStr);
            break;
          }
        }
      }

      return {
        date: dateStr,
        portfolio: (item.value / portfolioStart) * 100,
        benchmark: benchmarkValue ? (benchmarkValue / benchmarkStart) * 100 : null,
      };
    }).filter(item => item.benchmark !== null);

    console.log("Combined data length:", combined.length);
    console.log("Combined sample:", combined.slice(0, 3));

    setChartData(combined as Array<{ date: string; portfolio: number; benchmark: number }>);
  };

  const calculatePerformance = () => {
    if (chartData.length === 0) return null;

    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];

    const portfolioReturn = lastPoint.portfolio - firstPoint.portfolio;
    const benchmarkReturn = lastPoint.benchmark - firstPoint.benchmark;
    const alpha = portfolioReturn - benchmarkReturn;

    return {
      portfolioReturn,
      benchmarkReturn,
      alpha,
      outperformance: alpha > 0,
    };
  };

  const performance = calculatePerformance();

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-white">Benchmark Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Benchmark Comparison</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Compare your portfolio performance against market indices
            </CardDescription>
          </div>
          <Select value={selectedBenchmark} onValueChange={setSelectedBenchmark}>
            <SelectTrigger className="w-48 bg-secondary border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              {BENCHMARKS.map((benchmark) => (
                <SelectItem key={benchmark.value} value={benchmark.value}>
                  {benchmark.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {performance && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Your Portfolio</div>
              <div className={`text-2xl font-bold ${performance.portfolioReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                {performance.portfolioReturn >= 0 ? "+" : ""}{performance.portfolioReturn.toFixed(2)}%
              </div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">
                {BENCHMARKS.find(b => b.value === selectedBenchmark)?.label}
              </div>
              <div className={`text-2xl font-bold ${performance.benchmarkReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                {performance.benchmarkReturn >= 0 ? "+" : ""}{performance.benchmarkReturn.toFixed(2)}%
              </div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                Alpha (Outperformance)
                {performance.outperformance ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className={`text-2xl font-bold ${performance.alpha >= 0 ? "text-green-500" : "text-red-500"}`}>
                {performance.alpha >= 0 ? "+" : ""}{performance.alpha.toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {performance.outperformance ? (
                  <Badge className="bg-green-600 text-xs">Beating Market</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-red-500 text-red-500">Underperforming</Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {portfolioData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No portfolio data available</p>
              <p className="text-sm mt-2">Create portfolio snapshots to see benchmark comparison</p>
              <p className="text-xs mt-1 text-emerald-500">Go to Portfolio → Click Snapshot button</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tick={{ fill: "#9ca3af" }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: "#9ca3af" }}
                label={{ value: "Normalized Value (Base 100)", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "0.5rem",
                  color: "#fff",
                }}
                formatter={(value: number) => [`${value.toFixed(2)}`, ""]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="#10b981"
                strokeWidth={2}
                name="Your Portfolio"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#3b82f6"
                strokeWidth={2}
                name={BENCHMARKS.find(b => b.value === selectedBenchmark)?.label}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p className="font-medium">Loading benchmark data...</p>
              <p className="text-sm mt-2">Fetching {BENCHMARKS.find(b => b.value === selectedBenchmark)?.label} data</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
