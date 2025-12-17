"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  AlertCircle,
  Info,
  DollarSign,
  PieChart,
} from "lucide-react";

interface RebalancingAction {
  symbol: string;
  companyName: string;
  action: "buy" | "sell" | "hold";
  currentShares: number;
  targetShares: number;
  sharesToTrade: number;
  currentValue: number;
  targetValue: number;
  valueDifference: number;
  reason: string;
}

interface CurrentAllocation {
  symbol: string;
  companyName: string;
  allocation: number;
  value: number;
  sector: string;
}

interface RebalancingData {
  strategy: string;
  strategyDescription: string;
  totalValue: number;
  actions: RebalancingAction[];
  estimatedCost: number;
  taxImplications: string;
  riskReduction: number;
  summary: {
    buyOrders: number;
    sellOrders: number;
    holdPositions: number;
    totalTrades: number;
  };
  currentAllocations: CurrentAllocation[];
}

const STRATEGIES = [
  { value: "equal_weight", label: "Equal Weight", icon: Scale },
  { value: "sector_balanced", label: "Sector Balanced", icon: PieChart },
  { value: "risk_parity", label: "Risk Parity", icon: Shield },
];

function Shield({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function RebalancingCard() {
  const [data, setData] = useState<RebalancingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState("equal_weight");

  const fetchRebalancing = async (selectedStrategy: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/portfolio/rebalancing?strategy=${selectedStrategy}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch rebalancing data");
      }

      const rebalancingData = await response.json();
      setData(rebalancingData);
    } catch (err) {
      console.error("Error fetching rebalancing:", err);
      setError(err instanceof Error ? err.message : "Failed to load rebalancing recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRebalancing(strategy);
  }, [strategy]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "buy":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "sell":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "buy":
        return <Badge className="bg-green-600 hover:bg-green-700">Buy</Badge>;
      case "sell":
        return <Badge className="bg-red-600 hover:bg-red-700">Sell</Badge>;
      default:
        return <Badge variant="secondary">Hold</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-500" />
            Portfolio Rebalancing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-500" />
            Portfolio Rebalancing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
              <p className="text-gray-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRebalancing(strategy)}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-500" />
              Portfolio Rebalancing
            </CardTitle>
            <CardDescription className="mt-1">
              Optimize your portfolio allocation
            </CardDescription>
          </div>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
              {STRATEGIES.map((strat) => {
                const Icon = strat.icon;
                return (
                  <SelectItem key={strat.value} value={strat.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {strat.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy Description */}
        <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800/30">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-300 mb-1">Strategy: {data.strategy}</p>
              <p className="text-sm text-gray-400">{data.strategyDescription}</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gray-800/50">
            <div className="text-sm text-gray-400 mb-1">Total Value</div>
            <div className="text-xl font-bold text-gray-200">
              ${data.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50">
            <div className="text-sm text-gray-400 mb-1">Total Trades</div>
            <div className="text-xl font-bold text-gray-200">{data.summary.totalTrades}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50">
            <div className="text-sm text-gray-400 mb-1">Buy Orders</div>
            <div className="text-xl font-bold text-green-500">{data.summary.buyOrders}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50">
            <div className="text-sm text-gray-400 mb-1">Sell Orders</div>
            <div className="text-xl font-bold text-red-500">{data.summary.sellOrders}</div>
          </div>
        </div>

        {/* Rebalancing Actions */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Recommended Actions
          </h4>

          {data.actions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Scale className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Your portfolio is already well-balanced!</p>
              <p className="text-sm mt-2">No rebalancing needed at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.actions.map((action, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-colors ${
                    action.action === "hold"
                      ? "bg-gray-800/20 border-gray-800/40"
                      : "bg-gray-800/30 border-gray-800/50 hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getActionIcon(action.action)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-200">
                            {action.symbol}
                          </h5>
                          <span className="text-sm text-gray-400">{action.companyName}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{action.reason}</p>

                        {action.action !== "hold" && (
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-gray-500">Current: </span>
                              <span className="text-gray-300">{action.currentShares.toFixed(2)} shares</span>
                              <span className="text-gray-500"> (${action.currentValue.toFixed(0)})</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Target: </span>
                              <span className="text-gray-300">{action.targetShares.toFixed(2)} shares</span>
                              <span className="text-gray-500"> (${action.targetValue.toFixed(0)})</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Trade: </span>
                              <span className={`font-medium ${action.sharesToTrade > 0 ? "text-green-400" : "text-red-400"}`}>
                                {action.sharesToTrade > 0 ? "+" : ""}{action.sharesToTrade.toFixed(2)} shares
                              </span>
                              <span className="text-gray-500">
                                {" "}({action.valueDifference > 0 ? "+" : ""}${action.valueDifference.toFixed(0)})
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {getActionBadge(action.action)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tax Implications */}
        {data.summary.sellOrders > 0 && (
          <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-800/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300 mb-1">Tax Considerations</p>
                <p className="text-sm text-gray-400">{data.taxImplications}</p>
              </div>
            </div>
          </div>
        )}

        {/* Risk Reduction Info */}
        {data.riskReduction > 0 && (
          <div className="p-4 rounded-lg bg-green-900/20 border border-green-800/30">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-300 mb-1">Risk Reduction</p>
                <p className="text-sm text-gray-400">
                  This rebalancing reduces your maximum position concentration by{" "}
                  <span className="font-semibold text-green-400">{data.riskReduction.toFixed(1)}%</span>,
                  improving portfolio diversification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
          <p>
            <strong>Disclaimer:</strong> These are automated recommendations for educational purposes.
            Rebalancing may have tax implications and transaction costs. Always consult with a financial
            advisor before making investment decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
