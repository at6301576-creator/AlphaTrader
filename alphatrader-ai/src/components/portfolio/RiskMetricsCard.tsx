"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Activity, AlertTriangle } from "lucide-react";

interface PerformanceMetrics {
  bestDay: { date: Date; return: number } | null;
  worstDay: { date: Date; return: number } | null;
  avgDailyReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  maxDrawdownPeriod: { start: Date | null; end: Date | null };
  winRate: number;
  annualizedReturn: number;
  totalReturn: number;
}

interface RiskMetricsCardProps {
  metrics: PerformanceMetrics;
}

export function RiskMetricsCard({ metrics }: RiskMetricsCardProps) {
  const getRiskLevel = (volatility: number): { label: string; color: string } => {
    if (volatility < 1) return { label: "Low", color: "bg-emerald-600" };
    if (volatility < 2) return { label: "Moderate", color: "bg-yellow-600" };
    return { label: "High", color: "bg-red-600" };
  };

  const getSharpeLabel = (sharpe: number): { label: string; color: string } => {
    if (sharpe > 2) return { label: "Excellent", color: "text-emerald-500" };
    if (sharpe > 1) return { label: "Good", color: "text-blue-500" };
    if (sharpe > 0) return { label: "Fair", color: "text-yellow-500" };
    return { label: "Poor", color: "text-red-500" };
  };

  const risk = getRiskLevel(metrics.volatility);
  const sharpeLabel = getSharpeLabel(metrics.sharpeRatio);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-500" />
          Risk Metrics
        </CardTitle>
        <CardDescription>Portfolio risk and performance analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Volatility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Volatility (Daily)</span>
            </div>
            <Badge className={risk.color}>
              {risk.label}
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {metrics.volatility.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-500">
              (±{(metrics.volatility * Math.sqrt(252)).toFixed(2)}% annualized)
            </span>
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Sharpe Ratio</span>
            </div>
            <span className={`text-sm font-medium ${sharpeLabel.color}`}>
              {sharpeLabel.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {metrics.sharpeRatio.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">
              Risk-adjusted return
            </span>
          </div>
        </div>

        {/* Total Return */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Total Return</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${
              metrics.totalReturn >= 0 ? "text-emerald-500" : "text-red-500"
            }`}>
              {metrics.totalReturn >= 0 ? "+" : ""}
              {metrics.totalReturn.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-500">
              All-time
            </span>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Max Drawdown</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-500">
              {metrics.maxDrawdown.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-500">
              Peak decline
            </span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Win Rate</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${
              metrics.winRate >= 50 ? "text-emerald-500" : "text-yellow-500"
            }`}>
              {metrics.winRate.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500">
              Positive days
            </span>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 space-y-3">
          {/* Best Day */}
          {metrics.bestDay && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-900/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-xs text-gray-400">Best Day</p>
                  <p className="text-sm font-medium text-emerald-500">
                    +{metrics.bestDay.return.toFixed(2)}%
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(metrics.bestDay.date)}
              </span>
            </div>
          )}

          {/* Worst Day */}
          {metrics.worstDay && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-900/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-xs text-gray-400">Worst Day</p>
                  <p className="text-sm font-medium text-red-500">
                    {metrics.worstDay.return.toFixed(2)}%
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(metrics.worstDay.date)}
              </span>
            </div>
          )}
        </div>

        {/* Advanced Ratios */}
        <div className="border-t border-gray-800 pt-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Advanced Metrics</h4>

          {/* Sortino Ratio */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/30">
            <div>
              <p className="text-xs text-gray-400">Sortino Ratio</p>
              <p className="text-sm font-medium">
                {metrics.sortinoRatio.toFixed(2)}
              </p>
            </div>
            <span className="text-xs text-gray-500">Downside risk-adjusted</span>
          </div>

          {/* Calmar Ratio */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/30">
            <div>
              <p className="text-xs text-gray-400">Calmar Ratio</p>
              <p className="text-sm font-medium">
                {metrics.calmarRatio.toFixed(2)}
              </p>
            </div>
            <span className="text-xs text-gray-500">Return vs max drawdown</span>
          </div>

          {/* Annualized Return */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/30">
            <div>
              <p className="text-xs text-gray-400">Annualized Return</p>
              <p className={`text-sm font-medium ${
                metrics.annualizedReturn >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {metrics.annualizedReturn >= 0 ? "+" : ""}
                {metrics.annualizedReturn.toFixed(2)}%
              </p>
            </div>
            <span className="text-xs text-gray-500">Projected yearly</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
