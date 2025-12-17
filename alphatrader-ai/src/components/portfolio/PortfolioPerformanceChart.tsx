"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, AreaSeries, LineSeries, type IChartApi, type ISeriesApi } from "lightweight-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PerformanceDataPoint {
  date: Date;
  value: number;
  cost: number;
  gainLoss: number;
  gainLossPerc: number;
}

interface PortfolioPerformanceChartProps {
  data: PerformanceDataPoint[];
  currentValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPerc: number;
}

export function PortfolioPerformanceChart({
  data,
  currentValue,
  totalCost,
  totalGainLoss,
  totalGainLossPerc,
}: PortfolioPerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const valueSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const costSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111827" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "#374151",
      },
      crosshair: {
        vertLine: {
          color: "#6b7280",
          width: 1,
          style: 2,
        },
        horzLine: {
          color: "#6b7280",
          width: 1,
          style: 2,
        },
      },
    });

    chartRef.current = chart;

    // Value area series (portfolio value)
    const valueSeries = chart.addSeries(AreaSeries, {
      lineColor: totalGainLoss >= 0 ? "#10b981" : "#ef4444",
      topColor: totalGainLoss >= 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
      bottomColor: "rgba(16, 185, 129, 0)",
      lineWidth: 2,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    valueSeriesRef.current = valueSeries;

    // Cost basis line
    const costSeries = chart.addSeries(LineSeries, {
      color: "#6b7280",
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    costSeriesRef.current = costSeries;

    // Prepare data
    const valueData = data.map((d) => ({
      time: Math.floor(new Date(d.date).getTime() / 1000) as any,
      value: d.value,
    }));

    const costData = data.map((d) => ({
      time: Math.floor(new Date(d.date).getTime() / 1000) as any,
      value: d.cost,
    }));

    valueSeries.setData(valueData);
    costSeries.setData(costData);

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, totalGainLoss]);

  const isPositive = totalGainLoss >= 0;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Portfolio Performance</CardTitle>
            <CardDescription>Historical value and cost basis</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${currentValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className={`flex items-center justify-end gap-1 text-sm ${
              isPositive ? "text-emerald-500" : "text-red-500"
            }`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isPositive ? "+" : ""}
              ${totalGainLoss.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ({isPositive ? "+" : ""}
              {totalGainLossPerc.toFixed(2)}%)
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className="w-full" />
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${isPositive ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="text-gray-400">Portfolio Value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-500" style={{ borderTop: "2px dashed" }} />
            <span className="text-gray-400">Cost Basis</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
