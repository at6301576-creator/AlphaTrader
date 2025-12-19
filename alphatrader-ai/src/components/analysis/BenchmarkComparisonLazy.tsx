"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Loading component shown while benchmark comparison is loading
function BenchmarkLoading() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="h-[400px] bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading benchmark comparison...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Dynamically import the BenchmarkComparison component
// This code-splits the recharts library (~150KB)
const BenchmarkComparison = dynamic(
  () =>
    import("./BenchmarkComparison").then((mod) => ({
      default: mod.BenchmarkComparison,
    })),
  {
    loading: () => <BenchmarkLoading />,
    ssr: false,
  }
);

interface BenchmarkComparisonLazyProps {
  portfolioData: Array<{
    date: Date;
    value: number;
  }>;
  period: string;
}

// Export the lazy-loaded component with the same API
export function BenchmarkComparisonLazy(props: BenchmarkComparisonLazyProps) {
  return <BenchmarkComparison {...props} />;
}
