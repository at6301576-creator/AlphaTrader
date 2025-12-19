"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Loading component shown while charts are loading
function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded" />
        <div className="h-10 w-40 bg-gray-800 rounded" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-gray-800 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border animate-pulse">
          <CardContent className="pt-6">
            <div className="h-[300px] bg-gray-800 rounded flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-pulse">
          <CardContent className="pt-6">
            <div className="h-[300px] bg-gray-800 rounded flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Dynamically import the PortfolioAnalytics component
// This code-splits the recharts library (~150KB)
const PortfolioAnalytics = dynamic(
  () =>
    import("./PortfolioAnalytics").then((mod) => ({
      default: mod.PortfolioAnalytics,
    })),
  {
    loading: () => <AnalyticsLoading />,
    ssr: false, // Charts don't work well with SSR
  }
);

// Export the lazy-loaded component
export function PortfolioAnalyticsLazy() {
  return <PortfolioAnalytics />;
}
