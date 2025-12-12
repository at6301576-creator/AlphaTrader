export interface BenchmarkData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  historicalData: Array<{
    date: string;
    close: number;
  }>;
}

export const BENCHMARKS = {
  SP500: { symbol: "^GSPC", name: "S&P 500", multiplier: 1 }, // S&P 500 Index
  NASDAQ: { symbol: "^IXIC", name: "NASDAQ", multiplier: 1 }, // NASDAQ Composite Index
  DOW: { symbol: "^DJI", name: "DOW", multiplier: 1 }, // Dow Jones Industrial Average
  FTSE: { symbol: "^FTSE", name: "FTSE 100", multiplier: 1 }, // FTSE 100 Index
} as const;

// Simple in-memory cache
const quoteCache = new Map<string, { data: BenchmarkData; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1 hour (60 * 60 * 1000)

/**
 * Fetch current benchmark data with caching using Yahoo Finance API
 *
 * Legal Notice: Data provided for informational purposes only.
 * Not affiliated with or endorsed by Yahoo Inc.
 */
export async function getBenchmarkQuote(symbol: string): Promise<BenchmarkData | null> {
  try {
    // Check cache first
    const cached = quoteCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[getBenchmarkQuote] Using cached data for ${symbol} (age: ${Math.round((Date.now() - cached.timestamp) / 60000)}min)`);
      return cached.data;
    }

    console.log(`[getBenchmarkQuote] Fetching fresh quote for ${symbol} from Yahoo Finance`);

    // Use yahoo-finance2 library
    const yahooFinance = (await import("yahoo-finance2")).default;

    const quote = await yahooFinance.quote(symbol);

    console.log(`[getBenchmarkQuote] Yahoo Finance data for ${symbol}:`, {
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
    });

    if (!quote || !quote.regularMarketPrice) {
      console.warn(`[getBenchmarkQuote] No valid price data for ${symbol}`);
      return null;
    }

    const data: BenchmarkData = {
      symbol: symbol,
      name: BENCHMARKS[Object.keys(BENCHMARKS).find(key => BENCHMARKS[key as keyof typeof BENCHMARKS].symbol === symbol) as keyof typeof BENCHMARKS]?.name || symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      historicalData: [],
    };

    // Cache the result
    quoteCache.set(symbol, { data, timestamp: Date.now() });
    console.log(`[getBenchmarkQuote] Cached ${symbol} for 1 hour`);

    return data;
  } catch (error) {
    console.error(`[getBenchmarkQuote] Error fetching benchmark quote for ${symbol}:`, error);
    // Return cached data even if expired, rather than null
    const cached = quoteCache.get(symbol);
    if (cached) {
      console.log(`[getBenchmarkQuote] Using stale cached data for ${symbol} (age: ${Math.round((Date.now() - cached.timestamp) / 60000)}min)`);
      return cached.data;
    }
    return null;
  }
}

/**
 * Fetch historical benchmark data for performance comparison using Yahoo Finance
 *
 * Legal Notice: Data provided for informational purposes only.
 * Not affiliated with or endorsed by Yahoo Inc.
 */
export async function getBenchmarkHistory(
  symbol: string,
  period: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" = "1y"
): Promise<Array<{ date: string; close: number }>> {
  try {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "1d":
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "5d":
        startDate.setDate(startDate.getDate() - 7); // 7 days to ensure 5 trading days
        break;
      case "1mo":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3mo":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6mo":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "2y":
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
      case "5y":
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
    }

    console.log(`[getBenchmarkHistory] Fetching ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Use yahoo-finance2 library
    const yahooFinance = (await import("yahoo-finance2")).default;

    const queryOptions = {
      period1: startDate,
      period2: endDate,
      interval: "1d" as const,
    };

    const result = await yahooFinance.historical(symbol, queryOptions);

    if (!result || result.length === 0) {
      console.warn(`No historical data available for ${symbol}`);
      return [];
    }

    console.log(`[getBenchmarkHistory] Fetched ${result.length} data points for ${symbol}`);

    return result.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      close: item.close || 0,
    }));
  } catch (error) {
    console.error(`Error fetching benchmark history for ${symbol}:`, error);
    return [];
  }
}

/**
 * Calculate portfolio return vs benchmark return
 */
export function calculateRelativePerformance(
  portfolioReturn: number,
  benchmarkReturn: number
): {
  alpha: number;
  outperformance: number;
  outperformancePercent: number;
} {
  const alpha = portfolioReturn - benchmarkReturn;
  const outperformance = alpha;
  const outperformancePercent = benchmarkReturn !== 0
    ? (alpha / Math.abs(benchmarkReturn)) * 100
    : 0;

  return {
    alpha,
    outperformance,
    outperformancePercent,
  };
}

/**
 * Normalize time series data to start at 100 (for visual comparison)
 */
export function normalizeTimeSeries(
  data: Array<{ date: string; value: number }>
): Array<{ date: string; normalizedValue: number }> {
  if (data.length === 0) return [];

  const firstValue = data[0].value;
  if (firstValue === 0) return [];

  return data.map((point) => ({
    date: point.date,
    normalizedValue: (point.value / firstValue) * 100,
  }));
}
