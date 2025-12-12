"use client";

import { DollarSign, TrendingUp, BarChart2, PieChart, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stock } from "@/types/stock";

interface FundamentalsPanelProps {
  stock: Stock;
}

export function FundamentalsPanel({ stock }: FundamentalsPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Valuation Metrics */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Valuation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MetricRow label="Market Cap" value={formatMarketCap(stock.marketCap)} />
          <MetricRow label="P/E Ratio" value={stock.peRatio !== null && stock.peRatio !== undefined ? stock.peRatio.toFixed(2) : null} />
          <MetricRow label="Forward P/E" value={stock.forwardPE !== null && stock.forwardPE !== undefined ? stock.forwardPE.toFixed(2) : null} />
          <MetricRow label="P/B Ratio" value={stock.pbRatio !== null && stock.pbRatio !== undefined ? stock.pbRatio.toFixed(2) : null} />
          <MetricRow label="P/S Ratio" value={stock.psRatio !== null && stock.psRatio !== undefined ? stock.psRatio.toFixed(2) : null} />
          <MetricRow label="PEG Ratio" value={stock.pegRatio !== null && stock.pegRatio !== undefined ? stock.pegRatio.toFixed(2) : null} />
        </CardContent>
      </Card>

      {/* Profitability */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Profitability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MetricRow
            label="Profit Margin"
            value={stock.profitMargin !== null && stock.profitMargin !== undefined ? `${(stock.profitMargin * 100).toFixed(1)}%` : null}
          />
          <MetricRow
            label="Operating Margin"
            value={stock.operatingMargin !== null && stock.operatingMargin !== undefined ? `${(stock.operatingMargin * 100).toFixed(1)}%` : null}
          />
          <MetricRow
            label="ROE"
            value={stock.roe !== null && stock.roe !== undefined ? `${(stock.roe * 100).toFixed(1)}%` : null}
          />
          <MetricRow
            label="ROA"
            value={stock.roa !== null && stock.roa !== undefined ? `${(stock.roa * 100).toFixed(1)}%` : null}
          />
        </CardContent>
      </Card>

      {/* Growth */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MetricRow
            label="Revenue Growth"
            value={stock.revenueGrowth !== null && stock.revenueGrowth !== undefined ? `${(stock.revenueGrowth * 100).toFixed(1)}%` : null}
            isGrowth
          />
          <MetricRow
            label="Earnings Growth"
            value={stock.earningsGrowth !== null && stock.earningsGrowth !== undefined ? `${(stock.earningsGrowth * 100).toFixed(1)}%` : null}
            isGrowth
          />
          <MetricRow label="EPS" value={stock.eps !== null && stock.eps !== undefined ? `$${stock.eps.toFixed(2)}` : null} />
        </CardContent>
      </Card>

      {/* Dividends */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Dividends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MetricRow
            label="Dividend Yield"
            value={stock.dividendYield !== null && stock.dividendYield !== undefined ? `${stock.dividendYield.toFixed(2)}%` : null}
          />
          <MetricRow
            label="Dividend Rate"
            value={stock.dividendRate !== null && stock.dividendRate !== undefined ? `$${stock.dividendRate.toFixed(2)}` : null}
          />
          <MetricRow
            label="Payout Ratio"
            value={stock.payoutRatio !== null && stock.payoutRatio !== undefined ? `${(stock.payoutRatio * 100).toFixed(1)}%` : null}
          />
        </CardContent>
      </Card>

      {/* Financial Health */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Financial Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MetricRow label="Debt/Equity" value={stock.debtToEquity !== null && stock.debtToEquity !== undefined ? stock.debtToEquity.toFixed(2) : null} />
          <MetricRow label="Current Ratio" value={stock.currentRatio !== null && stock.currentRatio !== undefined ? stock.currentRatio.toFixed(2) : null} />
          <MetricRow label="Quick Ratio" value={stock.quickRatio !== null && stock.quickRatio !== undefined ? stock.quickRatio.toFixed(2) : null} />
          <MetricRow label="Free Cash Flow" value={formatCashFlow(stock.freeCashFlow)} />
        </CardContent>
      </Card>

      {/* Trading Info */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Trading Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MetricRow label="Beta" value={stock.beta !== null && stock.beta !== undefined ? stock.beta.toFixed(2) : null} />
          <MetricRow
            label="52-Week High"
            value={stock.week52High !== null && stock.week52High !== undefined ? `$${stock.week52High.toFixed(2)}` : null}
          />
          <MetricRow
            label="52-Week Low"
            value={stock.week52Low !== null && stock.week52Low !== undefined ? `$${stock.week52Low.toFixed(2)}` : null}
          />
          <MetricRow label="Avg Volume" value={formatVolume(stock.avgVolume)} />
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card className="bg-gray-900 border-gray-800 md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500">Sector</div>
              <div className="text-sm font-medium text-white">{stock.sector || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Industry</div>
              <div className="text-sm font-medium text-white">{stock.industry || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Exchange</div>
              <div className="text-sm font-medium text-white">{stock.exchange || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Country</div>
              <div className="text-sm font-medium text-white">{stock.country || "N/A"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string | null | undefined;
  isGrowth?: boolean;
}

function MetricRow({ label, value, isGrowth }: MetricRowProps) {
  const displayValue = value ?? "N/A";
  let valueColor = "text-white";

  if (isGrowth && value) {
    const numValue = parseFloat(value);
    if (numValue > 0) valueColor = "text-green-500";
    else if (numValue < 0) valueColor = "text-red-500";
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`font-medium ${valueColor}`}>{displayValue}</span>
    </div>
  );
}

function formatMarketCap(value: number | null): string | null {
  if (value === null) return null;
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

function formatCashFlow(value: number | null): string | null {
  if (value === null) return null;
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absValue >= 1e9) return `${sign}$${(absValue / 1e9).toFixed(2)}B`;
  if (absValue >= 1e6) return `${sign}$${(absValue / 1e6).toFixed(2)}M`;
  return `${sign}$${absValue.toFixed(0)}`;
}

function formatVolume(value: number | null): string | null {
  if (value === null) return null;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}
