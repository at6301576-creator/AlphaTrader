"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, PieChart as PieChartIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BenchmarkComparison } from "@/components/analysis/BenchmarkComparison";
import { OptimizationSuggestionsCard } from "@/components/portfolio/OptimizationSuggestionsCard";

interface AnalyticsData {
  currentValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPerc: number;
  historicalData: Array<{
    date: Date;
    value: number;
    cost: number;
    gainLoss: number;
    gainLossPerc: number;
  }>;
  performanceMetrics: {
    bestDay: { date: Date; return: number } | null;
    worstDay: { date: Date; return: number } | null;
    avgDailyReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
  sectorAllocation: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  topPerformers: Array<{
    symbol: string;
    name: string;
    gainPercent: number;
    gain: number;
  }>;
  topLosers: Array<{
    symbol: string;
    name: string;
    gainPercent: number;
    gain: number;
  }>;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export default function AnalysisPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/portfolio/analytics?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No analytics data available</h3>
        <p className="text-muted-foreground mt-2">Add holdings to your portfolio to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
          <p className="text-muted-foreground mt-1">Detailed performance metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics} className="border-border">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.totalGainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
              {analytics.totalGainLossPerc >= 0 ? "+" : ""}{analytics.totalGainLossPerc.toFixed(2)}%
            </div>
            <p className={`text-xs mt-1 ${analytics.totalGainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
              {analytics.totalGainLoss >= 0 ? "+" : ""}${analytics.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Daily Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.performanceMetrics.avgDailyReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
              {analytics.performanceMetrics.avgDailyReturn >= 0 ? "+" : ""}{analytics.performanceMetrics.avgDailyReturn.toFixed(3)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per day</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.performanceMetrics.volatility.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Standard deviation</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.performanceMetrics.sharpeRatio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Risk-adjusted return</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analytics.historicalData.map(d => ({
              ...d,
              date: formatDate(d.date),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "6px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="Portfolio Value"
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#6b7280"
                fill="#6b7280"
                fillOpacity={0.1}
                name="Cost Basis"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Benchmark Comparison */}
      <BenchmarkComparison
        portfolioData={analytics.historicalData.map(d => ({
          date: d.date,
          value: d.value
        }))}
        period={period}
      />

      {/* Portfolio Optimization Suggestions */}
      <OptimizationSuggestionsCard period={period} />

      {/* Best/Worst Days & Sector Allocation */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Best/Worst Days */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Performance Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.performanceMetrics.bestDay && (
              <div className="p-4 rounded bg-green-900/20 border border-green-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Best Day</span>
                </div>
                <div className="text-2xl font-bold text-green-500">
                  +{analytics.performanceMetrics.bestDay.return.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(analytics.performanceMetrics.bestDay.date)}
                </p>
              </div>
            )}

            {analytics.performanceMetrics.worstDay && (
              <div className="p-4 rounded bg-red-900/20 border border-red-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">Worst Day</span>
                </div>
                <div className="text-2xl font-bold text-red-500">
                  {analytics.performanceMetrics.worstDay.return.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(analytics.performanceMetrics.worstDay.date)}
                </p>
              </div>
            )}

            {!analytics.performanceMetrics.bestDay && !analytics.performanceMetrics.worstDay && (
              <p className="text-muted-foreground text-center py-8">
                Not enough data yet. Add more snapshots to see performance highlights.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sector Allocation */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Sector Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.sectorAllocation.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.sectorAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.sectorAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                    }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No sector data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers & Losers */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performers */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <TrendingUp className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topPerformers.map((stock, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded bg-secondary">
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-500">+{stock.gainPercent.toFixed(2)}%</div>
                      <div className="text-sm text-green-500">+${stock.gain.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <TrendingDown className="h-5 w-5" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topLosers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topLosers.map((stock, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded bg-secondary">
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-500">{stock.gainPercent.toFixed(2)}%</div>
                      <div className="text-sm text-red-500">${stock.gain.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
