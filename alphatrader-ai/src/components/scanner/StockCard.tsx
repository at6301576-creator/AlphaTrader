"use client";

import { useState } from "react";
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
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

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

        {/* Technical Indicators (4 key indicators) */}
        {stock.technicalData && (
          <div className="bg-gray-800/30 rounded-lg p-2.5 mb-3 border border-gray-700/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Technical</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* RSI */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">RSI:</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    stock.technicalData.rsi !== null
                      ? stock.technicalData.rsi > 70
                        ? "border-red-500 text-red-400"
                        : stock.technicalData.rsi < 30
                        ? "border-emerald-500 text-emerald-400"
                        : "border-amber-500 text-amber-400"
                      : "border-gray-600 text-gray-400"
                  }`}
                >
                  {stock.technicalData.rsi !== null ? stock.technicalData.rsi.toFixed(1) : "N/A"}
                </Badge>
              </div>

              {/* Trend (MA) */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Trend:</span>
                <span className="text-xs font-medium">
                  {stock.currentPrice && stock.technicalData.sma50 !== null ? (
                    stock.currentPrice > stock.technicalData.sma50 ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" />
                        Above MA
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-0.5">
                        <TrendingDown className="h-3 w-3" />
                        Below MA
                      </span>
                    )
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </span>
              </div>

              {/* MACD */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">MACD:</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    stock.technicalData.macd !== null
                      ? stock.technicalData.macd.histogram > 0
                        ? "border-emerald-500 text-emerald-400"
                        : "border-red-500 text-red-400"
                      : "border-gray-600 text-gray-400"
                  }`}
                >
                  {stock.technicalData.macd !== null
                    ? stock.technicalData.macd.histogram > 0
                      ? "Bullish"
                      : "Bearish"
                    : "N/A"}
                </Badge>
              </div>

              {/* Volume */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Volume:</span>
                <span className="text-xs font-medium">
                  {stock.volume && stock.avgVolume && stock.volume >= stock.avgVolume * 1.5 ? (
                    <span className="text-amber-400 flex items-center gap-0.5">
                      <BarChart3 className="h-3 w-3" />
                      High
                    </span>
                  ) : (
                    <span className="text-gray-500">Normal</span>
                  )}
                </span>
              </div>
            </div>

            {/* Toggle for detailed technical view */}
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-center gap-1 mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-400 hover:text-blue-400 transition-colors"
            >
              {showTechnicalDetails ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show Details
                </>
              )}
            </button>
          </div>
        )}

        {/* Expanded Technical Details */}
        {showTechnicalDetails && stock.technicalData && (
          <div className="bg-gray-800/40 rounded-lg p-3 mb-3 border border-gray-700/50 text-xs space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Moving Averages */}
              <div>
                <p className="text-gray-500 mb-1">Moving Averages</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">SMA 50:</span>
                    <span className="text-gray-200">
                      {stock.technicalData.sma50 !== null ? formatPrice(stock.technicalData.sma50) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SMA 200:</span>
                    <span className="text-gray-200">
                      {stock.technicalData.sma200 !== null ? formatPrice(stock.technicalData.sma200) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bollinger Bands */}
              <div>
                <p className="text-gray-500 mb-1">Bollinger Bands</p>
                <div className="space-y-1">
                  {stock.technicalData.bollingerBands !== null ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Upper:</span>
                        <span className="text-gray-200">
                          {formatPrice(stock.technicalData.bollingerBands.upper)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lower:</span>
                        <span className="text-gray-200">
                          {formatPrice(stock.technicalData.bollingerBands.lower)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </div>
              </div>

              {/* Technical Signals */}
              <div>
                <p className="text-gray-500 mb-1">Overall Signal</p>
                <Badge
                  className={`text-xs ${
                    stock.technicalData.overallSignal === "strong_buy" || stock.technicalData.overallSignal === "buy"
                      ? "bg-emerald-600"
                      : stock.technicalData.overallSignal === "sell" || stock.technicalData.overallSignal === "strong_sell"
                      ? "bg-red-600"
                      : "bg-amber-600"
                  }`}
                >
                  {stock.technicalData.overallSignal.replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              {/* Trend */}
              <div>
                <p className="text-gray-500 mb-1">Trend Direction</p>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    stock.technicalData.trendSignal === "bullish"
                      ? "border-emerald-500 text-emerald-400"
                      : stock.technicalData.trendSignal === "bearish"
                      ? "border-red-500 text-red-400"
                      : "border-gray-500 text-gray-400"
                  }`}
                >
                  {stock.technicalData.trendSignal.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )}

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
