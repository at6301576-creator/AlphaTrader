'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon, ArrowDownIcon, Loader2 } from 'lucide-react';

interface MarketMover {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketMoversCardProps {
  initialStocks: MarketMover[];
  initialHasMore: boolean;
}

export function MarketMoversCard({ initialStocks, initialHasMore }: MarketMoversCardProps) {
  const [stocks, setStocks] = useState<MarketMover[]>(initialStocks);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/market/movers?offset=${stocks.length}&limit=10`);
      const data = await response.json();

      if (response.ok) {
        setStocks((prev) => [...prev, ...data.stocks]);
        setHasMore(data.hasMore);
      } else {
        console.error('Failed to load more stocks:', data.error);
      }
    } catch (error) {
      console.error('Error loading more stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate gainers and losers
  const gainers = stocks
    .filter((stock) => stock.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);

  const losers = stocks
    .filter((stock) => stock.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Movers</CardTitle>
        <CardDescription>
          Top gainers and losers from {stocks.length} stocks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Gainers */}
        <div>
          <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
            <ArrowUpIcon className="h-4 w-4" />
            Top Gainers
          </h3>
          <div className="space-y-2">
            {gainers.length > 0 ? (
              gainers.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30"
                >
                  <div>
                    <span className="font-semibold text-sm">{stock.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ${stock.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      +{stock.changePercent.toFixed(2)}%
                    </div>
                    <div className="text-xs text-green-600/70 dark:text-green-400/70">
                      +${stock.change.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No gainers found</p>
            )}
          </div>
        </div>

        {/* Top Losers */}
        <div>
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
            <ArrowDownIcon className="h-4 w-4" />
            Top Losers
          </h3>
          <div className="space-y-2">
            {losers.length > 0 ? (
              losers.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30"
                >
                  <div>
                    <span className="font-semibold text-sm">{stock.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ${stock.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {stock.changePercent.toFixed(2)}%
                    </div>
                    <div className="text-xs text-red-600/70 dark:text-red-400/70">
                      ${stock.change.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No losers found</p>
            )}
          </div>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <Button
            variant="outline"
            className="w-full"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Stocks'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
