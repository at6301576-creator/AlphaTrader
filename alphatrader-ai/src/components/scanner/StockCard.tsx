"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  Sparkles,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ScanResult } from "@/types/scanner";

interface StockCardProps {
  result: ScanResult;
  onAddToWatchlist?: (symbol: string) => void;
  onAddToPortfolio?: (symbol: string) => void;
}

export function StockCard({
  result,
  onAddToWatchlist,
  onAddToPortfolio,
}: StockCardProps) {
  const { stock, score, signals, recommendation, reasonSummary } = result;

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "strong_buy":
        return "bg-emerald-600";
      case "buy":
        return "bg-emerald-500";
      case "hold":
        return "bg-amber-500";
      case "sell":
        return "bg-red-400";
      case "strong_sell":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  const getRecommendationLabel = (rec: string) => {
    return rec.replace("_", " ").toUpperCase();
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: stock.currency || "USD",
    }).format(price);
  };

  const formatMarketCap = (cap: number | null) => {
    if (!cap) return "N/A";
    if (cap >= 1_000_000_000_000) {
      return `$${(cap / 1_000_000_000_000).toFixed(2)}T`;
    }
    if (cap >= 1_000_000_000) {
      return `$${(cap / 1_000_000_000).toFixed(2)}B`;
    }
    if (cap >= 1_000_000) {
      return `$${(cap / 1_000_000).toFixed(2)}M`;
    }
    return `$${cap.toLocaleString()}`;
  };

  const priceChange = stock.currentPrice && stock.previousClose
    ? ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100
    : 0;

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-emerald-800/50 hover:shadow-xl hover:shadow-emerald-900/20 transition-all duration-300 group">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <Link
              href={`/stock/${stock.symbol}`}
              className="text-lg font-bold hover:text-emerald-400 transition-colors group-hover:text-emerald-500"
            >
              {stock.symbol}
            </Link>
            <p className="text-sm text-gray-400 truncate max-w-[180px] group-hover:text-gray-300 transition-colors">
              {stock.name || "Unknown"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={`${getRecommendationColor(recommendation)} text-white text-xs`}>
              {getRecommendationLabel(recommendation)}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-800 border-gray-700">
                  <p className="text-xs">
                    <strong>Scanner Signal:</strong> Based on fundamental metrics for this scan type.
                    <br />
                    <strong>Details Page:</strong> Shows full technical analysis (RSI, MACD, moving averages).
                    <br />
                    Signals may differ as they measure different aspects.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold">
            {formatPrice(stock.currentPrice)}
          </span>
          <span
            className={`flex items-center text-sm ${
              priceChange >= 0 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {priceChange >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-0.5" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-0.5" />
            )}
            {priceChange >= 0 ? "+" : ""}
            {priceChange.toFixed(2)}%
          </span>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
          <div>
            <p className="text-gray-500">Market Cap</p>
            <p className="font-medium">{formatMarketCap(stock.marketCap)}</p>
          </div>
          <div>
            <p className="text-gray-500">P/E</p>
            <p className="font-medium">
              {stock.peRatio ? stock.peRatio.toFixed(1) : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Dividend</p>
            <p className="font-medium">
              {stock.dividendYield ? `${stock.dividendYield.toFixed(1)}%` : "-"}
            </p>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-amber-500 group-hover:text-amber-400 transition-colors" />
          <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Score:</span>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 group-hover:from-emerald-500 group-hover:to-emerald-300"
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium group-hover:text-emerald-400 transition-colors">{score}</span>
        </div>

        {/* Shariah Status */}
        {stock.isShariahCompliant !== null && (
          <div className="flex items-center gap-1 mb-3">
            {stock.isShariahCompliant ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-emerald-500">Shariah Compliant</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-500">Not Shariah Compliant</span>
              </>
            )}
          </div>
        )}

        {/* Reason */}
        <p className="text-xs text-gray-400 mb-4 line-clamp-2">{reasonSummary}</p>

        {/* Top Signals */}
        <div className="flex flex-wrap gap-1 mb-4">
          {signals
            .filter((s) => s.type === "positive")
            .slice(0, 3)
            .map((signal, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs border-emerald-700 text-emerald-400"
              >
                {signal.category}
              </Badge>
            ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/stock/${stock.symbol}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full border-gray-700 hover:border-emerald-700 hover:bg-emerald-900/20 hover:text-emerald-400 transition-all">
              View Details
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/20 transition-all"
            onClick={() => onAddToWatchlist?.(stock.symbol)}
            title="Add to Watchlist"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 transition-all"
            onClick={() => onAddToPortfolio?.(stock.symbol)}
            title="Add to Portfolio"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
