"use client";

import dynamic from "next/dynamic";
import { type ChartDataPoint } from "@/types/stock";

// Loading component shown while chart is loading
function ChartLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-pulse">
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-gray-800 rounded" />
          <div className="h-8 w-16 bg-gray-800 rounded" />
          <div className="h-8 w-16 bg-gray-800 rounded" />
        </div>
        <div className="flex gap-1">
          <div className="h-8 w-12 bg-gray-800 rounded" />
          <div className="h-8 w-12 bg-gray-800 rounded" />
          <div className="h-8 w-12 bg-gray-800 rounded" />
          <div className="h-8 w-12 bg-gray-800 rounded" />
          <div className="h-8 w-12 bg-gray-800 rounded" />
        </div>
      </div>
      <div className="h-[400px] bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-600">Loading chart...</div>
      </div>
    </div>
  );
}

// Dynamically import the StockChart component
// This code-splits the lightweight-charts library (~250KB)
const StockChart = dynamic(
  () => import("./StockChart").then((mod) => ({ default: mod.StockChart })),
  {
    loading: () => <ChartLoading />,
    ssr: false, // Charts don't work with SSR
  }
);

interface StockChartLazyProps {
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

// Export the lazy-loaded component with the same API
export function StockChartLazy(props: StockChartLazyProps) {
  return <StockChart {...props} />;
}
