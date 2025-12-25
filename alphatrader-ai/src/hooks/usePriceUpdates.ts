import { useEffect, useState, useCallback, useRef } from 'react';

export interface PriceUpdate {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  previousPrice?: number;
  direction?: 'up' | 'down' | 'neutral';
}

export interface UsePriceUpdatesOptions {
  symbols: string[];
  interval?: number; // milliseconds, default 10000 (10 seconds)
  enabled?: boolean; // default true
  onUpdate?: (updates: PriceUpdate[]) => void;
}

/**
 * Custom hook for real-time price updates
 * Polls the API at regular intervals and provides price change animations
 */
export function usePriceUpdates({
  symbols,
  interval = 10000,
  enabled = true,
  onUpdate,
}: UsePriceUpdatesOptions) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousPricesRef = useRef<Map<string, number>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrices = useCallback(async () => {
    if (symbols.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch updated prices from API
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }

      const data = await response.json();
      const quotes = data.data?.quotes || [];

      // Create new price map with change detection
      const newPrices = new Map<string, PriceUpdate>();

      quotes.forEach((quote: any) => {
        const previousPrice = previousPricesRef.current.get(quote.symbol);
        const currentPrice = quote.regularMarketPrice || quote.currentPrice || 0;

        let direction: 'up' | 'down' | 'neutral' = 'neutral';
        if (previousPrice !== undefined && currentPrice !== previousPrice) {
          direction = currentPrice > previousPrice ? 'up' : 'down';
        }

        const priceUpdate: PriceUpdate = {
          symbol: quote.symbol,
          currentPrice,
          change: quote.regularMarketChange || quote.change || 0,
          changePercent: quote.regularMarketChangePercent || quote.changePercent || 0,
          previousPrice,
          direction,
        };

        newPrices.set(quote.symbol, priceUpdate);

        // Update previous price for next comparison
        previousPricesRef.current.set(quote.symbol, currentPrice);
      });

      setPrices(newPrices);

      // Call optional callback
      if (onUpdate) {
        onUpdate(Array.from(newPrices.values()));
      }
    } catch (err) {
      console.error('[usePriceUpdates] Error fetching prices:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [symbols, onUpdate]);

  // Start/stop polling based on enabled flag and tab visibility
  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      return;
    }

    // Initial fetch
    fetchPrices();

    // Set up polling interval
    intervalRef.current = setInterval(fetchPrices, interval);

    // Pause polling when tab is not visible (save API calls)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume polling when tab becomes visible
        fetchPrices();
        intervalRef.current = setInterval(fetchPrices, interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, symbols, interval, fetchPrices]);

  return {
    prices,
    isLoading,
    error,
    refresh: fetchPrices,
  };
}

/**
 * Helper hook to get price for a specific symbol
 */
export function useSymbolPrice(symbol: string, options?: Omit<UsePriceUpdatesOptions, 'symbols'>) {
  const { prices, isLoading, error } = usePriceUpdates({
    symbols: [symbol],
    ...options,
  });

  return {
    price: prices.get(symbol),
    isLoading,
    error,
  };
}
