"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, type IChartApi, type Time, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChartDataPoint } from "@/types/stock";
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateParabolicSAR,
  calculateWilliamsR,
  calculateCCI,
} from "@/lib/technical-indicators";

interface StockChartProps {
  data: ChartDataPoint[];
  symbol: string;
  technicalData?: {
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    ema20: number | null;
    ema50: number | null;
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
    } | null;
  };
}

type ChartType = "candlestick" | "line" | "area";
type TimeRange = "1M" | "3M" | "6M" | "1Y" | "ALL";
type IndicatorType = "none" | "sma20" | "sma50" | "sma200" | "ema20" | "ema50" | "bb" | "psar";
type OscillatorType = "none" | "rsi" | "macd" | "stochastic" | "williams" | "cci";

export function StockChart({ data, symbol, technicalData }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const oscillatorContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const oscillatorChartRef = useRef<IChartApi | null>(null);

  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [timeRange, setTimeRange] = useState<TimeRange>("1Y");
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorType[]>(["none"]);
  const [selectedOscillator, setSelectedOscillator] = useState<OscillatorType>("none");

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Clear previous chart
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        // Ignore errors from already disposed charts
        console.debug("Chart already disposed:", error);
      }
      chartRef.current = null;
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111827" },
        textColor: "#9CA3AF",
      },
      grid: {
        vertLines: { color: "#1F2937" },
        horzLines: { color: "#1F2937" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#374151",
      },
      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    chartRef.current = chart;

    // Filter data by time range
    const filteredData = filterDataByRange(data, timeRange);

    // Create main series based on chart type
    if (chartType === "candlestick") {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#10B981",
        downColor: "#EF4444",
        borderDownColor: "#EF4444",
        borderUpColor: "#10B981",
        wickDownColor: "#EF4444",
        wickUpColor: "#10B981",
      });

      candlestickSeries.setData(
        filteredData.map((d) => ({
          time: d.time as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );
    } else if (chartType === "line") {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#3B82F6",
        lineWidth: 2,
      });

      lineSeries.setData(
        filteredData.map((d) => ({
          time: d.time as Time,
          value: d.close,
        }))
      );
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: "rgba(59, 130, 246, 0.4)",
        bottomColor: "rgba(59, 130, 246, 0.0)",
        lineColor: "#3B82F6",
        lineWidth: 2,
      });

      areaSeries.setData(
        filteredData.map((d) => ({
          time: d.time as Time,
          value: d.close,
        }))
      );
    }

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeries.setData(
      filteredData.map((d) => ({
        time: d.time as Time,
        value: d.volume,
        color: d.close >= d.open ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)",
      }))
    );

    // Add technical indicators
    selectedIndicators.forEach((indicator) => {
      if (indicator === "none") return;

      if (indicator === "sma20" || indicator === "sma50" || indicator === "sma200") {
        const period = parseInt(indicator.replace("sma", ""));
        const smaData = calculateSMA(filteredData, period);
        const smaSeries = chart.addSeries(LineSeries, {
          color: indicator === "sma20" ? "#f59e0b" : indicator === "sma50" ? "#8b5cf6" : "#ec4899",
          lineWidth: 1,
          title: `SMA ${period}`,
        });
        smaSeries.setData(smaData);
      }

      if (indicator === "ema20" || indicator === "ema50") {
        const period = parseInt(indicator.replace("ema", ""));
        const emaData = calculateEMA(filteredData, period);
        const emaSeries = chart.addSeries(LineSeries, {
          color: indicator === "ema20" ? "#14b8a6" : "#06b6d4",
          lineWidth: 1,
          title: `EMA ${period}`,
        });
        emaSeries.setData(emaData);
      }

      if (indicator === "bb") {
        const bbData = calculateBollingerBands(filteredData, 20, 2);
        const upperSeries = chart.addSeries(LineSeries, {
          color: "#9ca3af",
          lineWidth: 1,
          lineStyle: 2,
          title: "BB Upper",
        });
        const middleSeries = chart.addSeries(LineSeries, {
          color: "#9ca3af",
          lineWidth: 1,
          title: "BB Middle",
        });
        const lowerSeries = chart.addSeries(LineSeries, {
          color: "#9ca3af",
          lineWidth: 1,
          lineStyle: 2,
          title: "BB Lower",
        });
        upperSeries.setData(bbData.upper);
        middleSeries.setData(bbData.middle);
        lowerSeries.setData(bbData.lower);
      }

      if (indicator === "psar") {
        const psarData = calculateParabolicSAR(filteredData);
        const psarSeries = chart.addSeries(LineSeries, {
          color: "#f97316",
          lineWidth: 1,
          lineStyle: 3, // Dotted line
          title: "Parabolic SAR",
        });
        psarSeries.setData(psarData);
      }
    });

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (error) {
          // Ignore errors from already disposed charts
          console.debug("Chart already disposed in cleanup:", error);
        }
        chartRef.current = null;
      }
    };
  }, [data, chartType, timeRange, selectedIndicators]);

  // Oscillator Panel (RSI, MACD, Stochastic)
  useEffect(() => {
    if (!oscillatorContainerRef.current || data.length === 0 || selectedOscillator === "none") {
      // Clean up oscillator chart if none selected
      if (oscillatorChartRef.current) {
        try {
          oscillatorChartRef.current.remove();
        } catch (error) {
          console.debug("Oscillator chart already disposed:", error);
        }
        oscillatorChartRef.current = null;
      }
      return;
    }

    // Clear previous oscillator chart
    if (oscillatorChartRef.current) {
      try {
        oscillatorChartRef.current.remove();
      } catch (error) {
        console.debug("Oscillator chart already disposed:", error);
      }
      oscillatorChartRef.current = null;
    }

    // Filter data by time range
    const filteredData = filterDataByRange(data, timeRange);

    // Create oscillator chart
    const oscillatorChart = createChart(oscillatorContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111827" },
        textColor: "#9CA3AF",
      },
      grid: {
        vertLines: { color: "#1F2937" },
        horzLines: { color: "#1F2937" },
      },
      rightPriceScale: {
        borderColor: "#374151",
      },
      timeScale: {
        borderColor: "#374151",
        visible: false, // Hide time scale on oscillator
      },
      width: oscillatorContainerRef.current.clientWidth,
      height: 150,
    });

    oscillatorChartRef.current = oscillatorChart;

    // Add selected oscillator
    if (selectedOscillator === "rsi") {
      const rsiData = calculateRSI(filteredData, 14);
      const rsiSeries = oscillatorChart.addSeries(LineSeries, {
        color: "#a855f7",
        lineWidth: 2,
        title: "RSI(14)",
      });
      rsiSeries.setData(rsiData);

      // Add reference lines for overbought (70) and oversold (30)
      const overboughtLine = oscillatorChart.addSeries(LineSeries, {
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: "Overbought (70)",
      });
      const oversoldLine = oscillatorChart.addSeries(LineSeries, {
        color: "#10b981",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: "Oversold (30)",
      });

      // Create constant lines at 70 and 30
      const refData70 = rsiData.map(d => ({ time: d.time, value: 70 }));
      const refData30 = rsiData.map(d => ({ time: d.time, value: 30 }));
      overboughtLine.setData(refData70);
      oversoldLine.setData(refData30);
    }

    if (selectedOscillator === "macd") {
      const { macd, signal, histogram } = calculateMACD(filteredData, 12, 26, 9);

      // MACD histogram
      const histSeries = oscillatorChart.addSeries(HistogramSeries, {
        title: "MACD Histogram",
      });
      histSeries.setData(histogram);

      // MACD line (blue)
      const macdSeries = oscillatorChart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 2,
        title: "MACD",
      });
      macdSeries.setData(macd);

      // Signal line (orange)
      const signalSeries = oscillatorChart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 1,
        title: "Signal",
      });
      signalSeries.setData(signal);

      // Zero line
      const zeroLine = oscillatorChart.addSeries(LineSeries, {
        color: "#6b7280",
        lineWidth: 1,
        lineStyle: 2,
        title: "Zero",
      });
      const refData = macd.map(d => ({ time: d.time, value: 0 }));
      zeroLine.setData(refData);
    }

    if (selectedOscillator === "stochastic") {
      const { k, d } = calculateStochastic(filteredData, 14, 3);

      // %K line (fast, blue)
      const kSeries = oscillatorChart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 2,
        title: "%K",
      });
      kSeries.setData(k);

      // %D line (slow, orange)
      const dSeries = oscillatorChart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 1,
        title: "%D",
      });
      dSeries.setData(d);

      // Add reference lines for overbought (80) and oversold (20)
      const overboughtLine = oscillatorChart.addSeries(LineSeries, {
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2,
        title: "Overbought (80)",
      });
      const oversoldLine = oscillatorChart.addSeries(LineSeries, {
        color: "#10b981",
        lineWidth: 1,
        lineStyle: 2,
        title: "Oversold (20)",
      });

      const refData80 = k.map(d => ({ time: d.time, value: 80 }));
      const refData20 = k.map(d => ({ time: d.time, value: 20 }));
      overboughtLine.setData(refData80);
      oversoldLine.setData(refData20);
    }

    if (selectedOscillator === "williams") {
      const williamsData = calculateWilliamsR(filteredData, 14);
      const williamsSeries = oscillatorChart.addSeries(LineSeries, {
        color: "#06b6d4",
        lineWidth: 2,
        title: "Williams %R(14)",
      });
      williamsSeries.setData(williamsData);

      // Add reference lines for overbought (-20) and oversold (-80)
      const overboughtLine = oscillatorChart.addSeries(LineSeries, {
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2,
        title: "Overbought (-20)",
      });
      const oversoldLine = oscillatorChart.addSeries(LineSeries, {
        color: "#10b981",
        lineWidth: 1,
        lineStyle: 2,
        title: "Oversold (-80)",
      });

      const refDataMinus20 = williamsData.map(d => ({ time: d.time, value: -20 }));
      const refDataMinus80 = williamsData.map(d => ({ time: d.time, value: -80 }));
      overboughtLine.setData(refDataMinus20);
      oversoldLine.setData(refDataMinus80);
    }

    if (selectedOscillator === "cci") {
      const cciData = calculateCCI(filteredData, 20);
      const cciSeries = oscillatorChart.addSeries(LineSeries, {
        color: "#8b5cf6",
        lineWidth: 2,
        title: "CCI(20)",
      });
      cciSeries.setData(cciData);

      // Add reference lines for overbought (+100) and oversold (-100)
      const overboughtLine = oscillatorChart.addSeries(LineSeries, {
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2,
        title: "Overbought (+100)",
      });
      const oversoldLine = oscillatorChart.addSeries(LineSeries, {
        color: "#10b981",
        lineWidth: 1,
        lineStyle: 2,
        title: "Oversold (-100)",
      });
      const zeroLine = oscillatorChart.addSeries(LineSeries, {
        color: "#6b7280",
        lineWidth: 1,
        lineStyle: 2,
        title: "Zero",
      });

      const refData100 = cciData.map(d => ({ time: d.time, value: 100 }));
      const refDataMinus100 = cciData.map(d => ({ time: d.time, value: -100 }));
      const refData0 = cciData.map(d => ({ time: d.time, value: 0 }));
      overboughtLine.setData(refData100);
      oversoldLine.setData(refDataMinus100);
      zeroLine.setData(refData0);
    }

    // Fit content
    oscillatorChart.timeScale().fitContent();

    // Handle resize
    const handleOscillatorResize = () => {
      if (oscillatorContainerRef.current) {
        oscillatorChart.applyOptions({ width: oscillatorContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleOscillatorResize);

    return () => {
      window.removeEventListener("resize", handleOscillatorResize);
      if (oscillatorChartRef.current) {
        try {
          oscillatorChartRef.current.remove();
        } catch (error) {
          console.debug("Oscillator chart already disposed in cleanup:", error);
        }
        oscillatorChartRef.current = null;
      }
    };
  }, [data, timeRange, selectedOscillator]);

  const toggleIndicator = (indicator: IndicatorType) => {
    setSelectedIndicators((prev) => {
      if (indicator === "none") {
        return ["none"];
      }
      const filtered = prev.filter((i) => i !== "none");
      if (filtered.includes(indicator)) {
        const newIndicators = filtered.filter((i) => i !== indicator);
        return newIndicators.length === 0 ? ["none"] : newIndicators;
      }
      return [...filtered, indicator];
    });
  };

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          <Button
            variant={chartType === "candlestick" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("candlestick")}
            className={chartType === "candlestick" ? "bg-blue-600" : "border-gray-700 text-gray-400"}
          >
            Candlestick
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
            className={chartType === "line" ? "bg-blue-600" : "border-gray-700 text-gray-400"}
          >
            Line
          </Button>
          <Button
            variant={chartType === "area" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("area")}
            className={chartType === "area" ? "bg-blue-600" : "border-gray-700 text-gray-400"}
          >
            Area
          </Button>
        </div>

        <div className="flex gap-1">
          {(["1M", "3M", "6M", "1Y", "ALL"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={timeRange === range ? "bg-blue-600" : "text-gray-400 hover:text-white"}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Indicators:</span>
        <Badge
          variant={selectedIndicators.includes("none") ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          onClick={() => toggleIndicator("none")}
        >
          None
        </Badge>
        <Badge
          variant={selectedIndicators.includes("sma20") ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedIndicators.includes("sma20") ? "#f59e0b" : undefined }}
          onClick={() => toggleIndicator("sma20")}
        >
          SMA 20
        </Badge>
        <Badge
          variant={selectedIndicators.includes("sma50") ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedIndicators.includes("sma50") ? "#8b5cf6" : undefined }}
          onClick={() => toggleIndicator("sma50")}
        >
          SMA 50
        </Badge>
        <Badge
          variant={selectedIndicators.includes("sma200") ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedIndicators.includes("sma200") ? "#ec4899" : undefined }}
          onClick={() => toggleIndicator("sma200")}
        >
          SMA 200
        </Badge>
        <Badge
          variant={selectedIndicators.includes("ema20") ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedIndicators.includes("ema20") ? "#14b8a6" : undefined }}
          onClick={() => toggleIndicator("ema20")}
        >
          EMA 20
        </Badge>
        <Badge
          variant={selectedIndicators.includes("ema50") ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedIndicators.includes("ema50") ? "#06b6d4" : undefined }}
          onClick={() => toggleIndicator("ema50")}
        >
          EMA 50
        </Badge>
        <Badge
          variant={selectedIndicators.includes("bb") ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedIndicators.includes("bb") ? "#9ca3af" : undefined }}
          onClick={() => toggleIndicator("bb")}
        >
          Bollinger Bands
        </Badge>
        <Badge
          variant={selectedIndicators.includes("psar") ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedIndicators.includes("psar") ? "#f97316" : undefined }}
          onClick={() => toggleIndicator("psar")}
        >
          Parabolic SAR
        </Badge>
      </div>

      {/* Oscillator Selection */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Oscillators:</span>
        <Badge
          variant={selectedOscillator === "none" ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          onClick={() => setSelectedOscillator("none")}
        >
          None
        </Badge>
        <Badge
          variant={selectedOscillator === "rsi" ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedOscillator === "rsi" ? "#a855f7" : undefined }}
          onClick={() => setSelectedOscillator("rsi")}
        >
          RSI
        </Badge>
        <Badge
          variant={selectedOscillator === "macd" ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedOscillator === "macd" ? "#3b82f6" : undefined }}
          onClick={() => setSelectedOscillator("macd")}
        >
          MACD
        </Badge>
        <Badge
          variant={selectedOscillator === "stochastic" ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedOscillator === "stochastic" ? "#f59e0b" : undefined }}
          onClick={() => setSelectedOscillator("stochastic")}
        >
          Stochastic
        </Badge>
        <Badge
          variant={selectedOscillator === "williams" ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedOscillator === "williams" ? "#06b6d4" : undefined }}
          onClick={() => setSelectedOscillator("williams")}
        >
          Williams %R
        </Badge>
        <Badge
          variant={selectedOscillator === "cci" ? "default" : "outline"}
          className="cursor-pointer hover:bg-secondary"
          style={{ backgroundColor: selectedOscillator === "cci" ? "#8b5cf6" : undefined }}
          onClick={() => setSelectedOscillator("cci")}
        >
          CCI
        </Badge>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="rounded-lg overflow-hidden" />

      {/* Oscillator Container */}
      {selectedOscillator !== "none" && (
        <div className="mt-2">
          <div ref={oscillatorContainerRef} className="rounded-lg overflow-hidden" />
        </div>
      )}
    </div>
  );
}

function filterDataByRange(data: ChartDataPoint[], range: TimeRange): ChartDataPoint[] {
  if (range === "ALL") return data;

  const now = new Date();
  let startDate: Date;

  switch (range) {
    case "1M":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "3M":
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case "6M":
      startDate = new Date(now.setMonth(now.getMonth() - 6));
      break;
    case "1Y":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      return data;
  }

  return data.filter((d) => new Date(d.time) >= startDate);
}
