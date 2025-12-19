"use client";

import dynamic from "next/dynamic";

// Loading component shown while chart is loading
function ChartLoading() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4 animate-pulse">
        <div>
          <div className="h-6 w-48 bg-gray-800 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-800 rounded" />
        </div>
        <div className="text-right">
          <div className="h-8 w-32 bg-gray-800 rounded mb-2" />
          <div className="h-5 w-24 bg-gray-800 rounded ml-auto" />
        </div>
      </div>
      <div className="h-[400px] bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-600">Loading performance chart...</div>
      </div>
    </div>
  );
}

// Dynamically import the PortfolioPerformanceChart component
// This code-splits the lightweight-charts library (~250KB)
const PortfolioPerformanceChart = dynamic(
  () =>
    import("./PortfolioPerformanceChart").then((mod) => ({
      default: mod.PortfolioPerformanceChart,
    })),
  {
    loading: () => <ChartLoading />,
    ssr: false, // Charts don't work with SSR
  }
);

interface PerformanceDataPoint {
  date: Date;
  value: number;
  cost: number;
  gainLoss: number;
  gainLossPerc: number;
}

interface PortfolioPerformanceChartLazyProps {
  data: PerformanceDataPoint[];
  currentValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPerc: number;
}

// Export the lazy-loaded component with the same API
export function PortfolioPerformanceChartLazy(
  props: PortfolioPerformanceChartLazyProps
) {
  return <PortfolioPerformanceChart {...props} />;
}
