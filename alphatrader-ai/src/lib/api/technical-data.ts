/**
 * Technical Data Service
 * Fetches historical chart data for technical analysis calculations
 * Uses Yahoo Finance API (same as technical alert scanner)
 */

import yahooFinance from "yahoo-finance2";
import type { ChartDataPoint } from "@/types/stock";
import type { Time } from "lightweight-charts";

// In-memory cache for chart data (30-minute TTL)
interface CacheEntry {
  data: ChartDataPoint[];
  timestamp: number;
}

const chartDataCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch historical chart data for a symbol
 * Optimized for technical analysis (last 200 days of daily data)
 */
export async function fetchChartDataForTechnicalAnalysis(
  symbol: string
): Promise<ChartDataPoint[]> {
  try {
    // Check cache first
    const cached = chartDataCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Fetch 200 days of daily data (enough for 200-day MA)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 200);

    const result = (await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    })) as any;

    if (!result.quotes || result.quotes.length === 0) {
      console.warn(`No chart data available for ${symbol}`);
      return [];
    }

    // Transform to ChartDataPoint format
    const chartData: ChartDataPoint[] = result.quotes
      .filter(
        (quote: any) =>
          quote.open !== null &&
          quote.high !== null &&
          quote.low !== null &&
          quote.close !== null &&
          quote.volume !== null &&
          quote.date !== null
      )
      .map((quote: any) => ({
        time: (quote.date!.getTime() / 1000) as Time,
        open: quote.open!,
        high: quote.high!,
        low: quote.low!,
        close: quote.close!,
        volume: quote.volume!,
      }));

    // Cache the result
    chartDataCache.set(symbol, {
      data: chartData,
      timestamp: Date.now(),
    });

    return chartData;
  } catch (error) {
    console.error(`Error fetching chart data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Batch fetch chart data for multiple symbols
 * Processes in parallel with controlled concurrency
 */
export async function batchFetchChartData(
  symbols: string[],
  batchSize: number = 10
): Promise<Map<string, ChartDataPoint[]>> {
  const results = new Map<string, ChartDataPoint[]>();

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map((symbol) => fetchChartDataForTechnicalAnalysis(symbol))
    );

    batch.forEach((symbol, index) => {
      const result = batchResults[index];
      if (result.status === "fulfilled" && result.value.length > 0) {
        results.set(symbol, result.value);
      }
    });

    // Small delay between batches to respect rate limits
    if (i + batchSize < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Clear cache for a specific symbol or all symbols
 */
export function clearChartDataCache(symbol?: string): void {
  if (symbol) {
    chartDataCache.delete(symbol);
  } else {
    chartDataCache.clear();
  }
}

/**
 * Get cache statistics (for monitoring)
 */
export function getChartDataCacheStats(): {
  size: number;
  symbols: string[];
} {
  return {
    size: chartDataCache.size,
    symbols: Array.from(chartDataCache.keys()),
  };
}
