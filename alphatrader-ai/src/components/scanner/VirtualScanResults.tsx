"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import Link from "next/link";
import type { ScanResult } from "@/types/scanner";

interface VirtualScanResultsProps {
  results: ScanResult[];
  isLoading?: boolean;
}

export function VirtualScanResults({ results, isLoading }: VirtualScanResultsProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling for optimal performance with large datasets
  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated row height
    overscan: 10, // Render 10 extra items above/below viewport
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="bg-card border-border p-8 text-center">
        <p className="text-muted-foreground">No stocks found matching your criteria.</p>
      </Card>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-300px)] overflow-auto"
      style={{
        contain: "strict",
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const result = results[virtualRow.index];
          const stock = result.stock;
          const isPositive = result.stock.currentPrice && result.stock.previousClose
            ? result.stock.currentPrice > result.stock.previousClose
            : false;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <Link href={`/stock/${stock.symbol}`}>
                <Card className="bg-card border-border hover:border-blue-500/50 transition-colors p-4 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{stock.symbol}</h3>
                        <Badge variant={
                          result.recommendation === "strong_buy" ? "default" :
                          result.recommendation === "buy" ? "secondary" :
                          result.recommendation === "hold" ? "outline" :
                          "destructive"
                        }>
                          {result.recommendation.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Score: {result.score.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{stock.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{result.reasonSummary}</p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-semibold">
                          {stock.currentPrice?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                      {stock.previousClose && stock.currentPrice && (
                        <div className={`flex items-center gap-1 text-sm mt-1 justify-end ${
                          isPositive ? "text-green-500" : "text-red-500"
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span>
                            {((stock.currentPrice - stock.previousClose) / stock.previousClose * 100).toFixed(2)}%
                          </span>
                        </div>
                      )}
                      {stock.sector && (
                        <p className="text-xs text-muted-foreground mt-1">{stock.sector}</p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
