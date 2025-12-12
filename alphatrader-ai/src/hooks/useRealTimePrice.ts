import { useState, useEffect, useRef } from "react";

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  lastUpdated: Date;
}

interface UseRealTimePriceOptions {
  symbols: string[];
  interval?: number; // in milliseconds, default 30000 (30 seconds)
  enabled?: boolean;
}

export function useRealTimePrice({
  symbols,
  interval = 30000,
  enabled = true,
}: UseRealTimePriceOptions) {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrices = async () => {
    if (!symbols || symbols.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });

      if (response.ok) {
        const data = await response.json();
        const priceMap = new Map<string, PriceData>();

        data.quotes.forEach((quote: any) => {
          priceMap.set(quote.symbol, {
            symbol: quote.symbol,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            previousClose: quote.regularMarketPreviousClose,
            lastUpdated: new Date(),
          });
        });

        setPrices(priceMap);
        setError(null);
      } else {
        setError("Failed to fetch prices");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled || !symbols || symbols.length === 0) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchPrices();

    // Set up polling
    intervalRef.current = setInterval(fetchPrices, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbols.join(","), interval, enabled]);

  return { prices, loading, error, refetch: fetchPrices };
}
