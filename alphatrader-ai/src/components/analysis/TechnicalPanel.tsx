"use client";

import { TrendingUp, TrendingDown, Minus, Activity, BarChart2, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TechnicalIndicators } from "@/types/stock";

interface TechnicalPanelProps {
  technicals: TechnicalIndicators;
}

export function TechnicalPanel({ technicals }: TechnicalPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Moving Averages */}
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 flex items-center gap-2 transition-colors">
            <Activity className="h-4 w-4 group-hover:scale-110 transition-transform" />
            Moving Averages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <IndicatorRow label="SMA 20" value={technicals.sma20} />
          <IndicatorRow label="SMA 50" value={technicals.sma50} />
          <IndicatorRow label="SMA 200" value={technicals.sma200} />
          <div className="border-t border-gray-800 pt-3 mt-3">
            <IndicatorRow label="EMA 20" value={technicals.ema20} />
            <IndicatorRow label="EMA 50" value={technicals.ema50} />
            <IndicatorRow label="EMA 200" value={technicals.ema200} />
          </div>
        </CardContent>
      </Card>

      {/* RSI */}
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 flex items-center gap-2 transition-colors">
            <BarChart2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
            RSI (14)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {technicals.rsi !== null ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">{technicals.rsi.toFixed(1)}</span>
                <RSISignal value={technicals.rsi} />
              </div>
              <div className="space-y-2">
                <Progress
                  value={technicals.rsi}
                  className="h-2"
                  style={{
                    background: `linear-gradient(to right,
                      rgba(34, 197, 94, 0.3) 0%,
                      rgba(34, 197, 94, 0.3) 30%,
                      rgba(234, 179, 8, 0.3) 30%,
                      rgba(234, 179, 8, 0.3) 70%,
                      rgba(239, 68, 68, 0.3) 70%,
                      rgba(239, 68, 68, 0.3) 100%
                    )`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Oversold</span>
                  <span>30</span>
                  <span>50</span>
                  <span>70</span>
                  <span>Overbought</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Insufficient data</div>
          )}
        </CardContent>
      </Card>

      {/* MACD */}
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 flex items-center gap-2 transition-colors">
            <Waves className="h-4 w-4 group-hover:scale-110 transition-transform" />
            MACD
          </CardTitle>
        </CardHeader>
        <CardContent>
          {technicals.macd !== null ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">MACD Line</span>
                <span className={`font-medium ${technicals.macd.value >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {technicals.macd.value.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Signal Line</span>
                <span className="font-medium text-white">{technicals.macd.signal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Histogram</span>
                <span className={`font-medium ${technicals.macd.histogram >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {technicals.macd.histogram.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-800">
                <MACDSignal macd={technicals.macd} />
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Insufficient data</div>
          )}
        </CardContent>
      </Card>

      {/* Bollinger Bands */}
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Bollinger Bands (20, 2)</CardTitle>
        </CardHeader>
        <CardContent>
          {technicals.bollingerBands !== null ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Upper Band</span>
                <span className="font-medium text-white">${technicals.bollingerBands.upper.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Middle (SMA)</span>
                <span className="font-medium text-white">${technicals.bollingerBands.middle.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Lower Band</span>
                <span className="font-medium text-white">${technicals.bollingerBands.lower.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Band Width</span>
                <span className="font-medium text-white">{(technicals.bollingerBands.width * 100).toFixed(1)}%</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Insufficient data</div>
          )}
        </CardContent>
      </Card>

      {/* Support & Resistance */}
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Support & Resistance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-2">Resistance Levels</div>
              <div className="space-y-1">
                {technicals.resistanceLevels.slice(0, 3).map((level, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-red-400">R{i + 1}</span>
                    <span className="font-medium text-white">${level.toFixed(2)}</span>
                  </div>
                ))}
                {technicals.resistanceLevels.length === 0 && (
                  <div className="text-gray-500 text-sm">No levels found</div>
                )}
              </div>
            </div>
            <div className="border-t border-gray-800 pt-4">
              <div className="text-xs text-gray-500 mb-2">Support Levels</div>
              <div className="space-y-1">
                {technicals.supportLevels.slice(0, 3).map((level, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-green-400">S{i + 1}</span>
                    <span className="font-medium text-white">${level.toFixed(2)}</span>
                  </div>
                ))}
                {technicals.supportLevels.length === 0 && (
                  <div className="text-gray-500 text-sm">No levels found</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume */}
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Volume Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">On-Balance Volume</span>
              <span className="font-medium text-white">
                {technicals.obv !== null ? formatLargeNumber(technicals.obv) : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">VWAP</span>
              <span className="font-medium text-white">
                {technicals.vwap !== null ? `$${technicals.vwap.toFixed(2)}` : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Signal Summary */}
      <Card className="bg-gray-900 border-gray-800 hover:border-emerald-700/50 hover:shadow-lg hover:shadow-emerald-900/20 transition-all duration-300 md:col-span-2 lg:col-span-3 group">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Technical Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <SignalIcon signal={technicals.overallSignal} />
              <div>
                <div className="text-sm text-gray-400">Overall Signal</div>
                <div className={`font-bold text-lg ${getSignalColor(technicals.overallSignal)}`}>
                  {technicals.overallSignal.replace("_", " ").toUpperCase()}
                </div>
              </div>
            </div>
            <div className="border-l border-gray-800 pl-8">
              <div className="text-sm text-gray-400">Trend</div>
              <div className={`font-bold text-lg ${getTrendColor(technicals.trendSignal)}`}>
                {technicals.trendSignal.toUpperCase()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IndicatorRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="font-medium text-white">{value !== null ? `$${value.toFixed(2)}` : "N/A"}</span>
    </div>
  );
}

function RSISignal({ value }: { value: number }) {
  if (value <= 30) {
    return (
      <span className="text-xs font-medium px-2 py-1 rounded bg-green-900/50 text-green-400">Oversold</span>
    );
  }
  if (value >= 70) {
    return (
      <span className="text-xs font-medium px-2 py-1 rounded bg-red-900/50 text-red-400">Overbought</span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-900/50 text-yellow-400">Neutral</span>
  );
}

function MACDSignal({ macd }: { macd: { value: number; signal: number; histogram: number } }) {
  const isBullish = macd.value > macd.signal;
  const momentum = macd.histogram > 0 ? "Increasing" : "Decreasing";

  return (
    <div className="flex items-center gap-2">
      {isBullish ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-500" />
      )}
      <span className={`text-sm ${isBullish ? "text-green-500" : "text-red-500"}`}>
        {isBullish ? "Bullish" : "Bearish"} ({momentum})
      </span>
    </div>
  );
}

function SignalIcon({ signal }: { signal: string }) {
  if (signal.includes("buy")) {
    return <TrendingUp className="h-8 w-8 text-green-500" />;
  }
  if (signal.includes("sell")) {
    return <TrendingDown className="h-8 w-8 text-red-500" />;
  }
  return <Minus className="h-8 w-8 text-yellow-500" />;
}

function getSignalColor(signal: string): string {
  if (signal === "strong_buy") return "text-green-400";
  if (signal === "buy") return "text-green-500";
  if (signal === "strong_sell") return "text-red-400";
  if (signal === "sell") return "text-red-500";
  return "text-yellow-500";
}

function getTrendColor(trend: string): string {
  if (trend === "bullish") return "text-green-500";
  if (trend === "bearish") return "text-red-500";
  return "text-yellow-500";
}

function formatLargeNumber(value: number): string {
  if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
}
