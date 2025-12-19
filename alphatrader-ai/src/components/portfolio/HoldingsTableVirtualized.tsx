"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";

interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  previousClose: number;
  value: number;
  costBasis: number;
  gain: number;
  gainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  sector?: string;
}

interface HoldingsTableVirtualizedProps {
  holdings: PortfolioHolding[];
  onEdit: (holding: PortfolioHolding) => void;
  onDelete: (holdingId: string) => void;
  onSold: (holding: PortfolioHolding) => void;
}

export function HoldingsTableVirtualized({
  holdings,
  onEdit,
  onDelete,
  onSold,
}: HoldingsTableVirtualizedProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Create virtualizer with fixed row height for optimal performance
  const rowVirtualizer = useVirtualizer({
    count: holdings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 73, // Estimated row height in pixels (includes padding)
    overscan: 10, // Render 10 extra rows above/below viewport for smooth scrolling
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-card z-10">
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">
              Symbol
            </th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">
              Shares
            </th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">
              Avg Cost
            </th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">
              Current Price
            </th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">
              Value
            </th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">
              Gain/Loss
            </th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">
              Day Change
            </th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium"></th>
          </tr>
        </thead>
      </table>

      {/* Virtualized tbody */}
      <div
        ref={parentRef}
        className="relative overflow-auto"
        style={{
          height: `${Math.min(holdings.length * 73, 600)}px`, // Max height of 600px
          contain: "strict", // Performance optimization
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const holding = holdings[virtualRow.index];

            return (
              <div
                key={holding.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full border-b border-border hover:bg-secondary/50"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="py-4 px-4 w-[180px]">
                        <div>
                          <Link
                            href={`/stock/${holding.symbol}`}
                            className="font-medium hover:text-blue-400 transition-colors"
                          >
                            {holding.symbol}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            {holding.name}
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-4 px-4 w-[100px]">
                        {holding.shares}
                      </td>
                      <td className="text-right py-4 px-4 w-[110px]">
                        ${holding.avgCost.toFixed(2)}
                      </td>
                      <td className="text-right py-4 px-4 w-[130px]">
                        ${holding.currentPrice.toFixed(2)}
                      </td>
                      <td className="text-right py-4 px-4 w-[130px]">
                        $
                        {holding.value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-right py-4 px-4 w-[130px]">
                        <div
                          className={
                            holding.gain >= 0 ? "text-green-500" : "text-red-500"
                          }
                        >
                          {holding.gain >= 0 ? "+" : ""}$
                          {holding.gain.toFixed(2)}
                        </div>
                        <div
                          className={`text-sm ${
                            holding.gainPercent >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {holding.gainPercent >= 0 ? "+" : ""}
                          {holding.gainPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="text-right py-4 px-4 w-[130px]">
                        <div
                          className={
                            holding.dayChange >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {holding.dayChange >= 0 ? "+" : ""}$
                          {holding.dayChange.toFixed(2)}
                        </div>
                        <div
                          className={`text-sm ${
                            holding.dayChangePercent >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {holding.dayChangePercent >= 0 ? "+" : ""}
                          {holding.dayChangePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="text-right py-4 px-4 w-[120px]">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(holding)}
                            className="text-blue-500 hover:text-blue-400 hover:bg-blue-900/20"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSold(holding)}
                            className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-900/20"
                          >
                            Sold
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(holding.id)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
