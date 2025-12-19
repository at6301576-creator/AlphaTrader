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
      </div>
      <div className="h-[350px] bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-600">Loading sector allocation...</div>
      </div>
    </div>
  );
}

// Dynamically import the SectorAllocationChart component
// This code-splits the lightweight-charts library (~250KB)
const SectorAllocationChart = dynamic(
  () =>
    import("./SectorAllocationChart").then((mod) => ({
      default: mod.SectorAllocationChart,
    })),
  {
    loading: () => <ChartLoading />,
    ssr: false, // Charts don't work with SSR
  }
);

interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  holdings: number;
}

interface SectorAllocationChartLazyProps {
  data: SectorAllocation[];
}

// Export the lazy-loaded component with the same API
export function SectorAllocationChartLazy(
  props: SectorAllocationChartLazyProps
) {
  return <SectorAllocationChart {...props} />;
}
