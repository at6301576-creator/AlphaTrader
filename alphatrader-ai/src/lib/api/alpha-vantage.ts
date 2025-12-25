/**
 * Alpha Vantage API Service
 * Provides fallback for technical data when Yahoo Finance fails
 * Free tier: 500 requests/day, 5 requests/minute
 */

import { apiConfig } from "@/lib/config";
import type { ChartDataPoint } from "@/types/stock";

// Lazy load API key to ensure env vars are loaded
function getApiKey(): string {
  const key = apiConfig.alphaVantageApiKey || process.env.ALPHA_VANTAGE_API_KEY || "";
  if (!key) {
    console.warn("[AlphaVantage] ⚠️  API key not configured. Set ALPHA_VANTAGE_API_KEY in .env");
  }
  return key;
}

const BASE_URL = "https://www.alphavantage.co/query";

// In-memory cache with 24-hour TTL (conserve API calls)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting: 5 requests per minute (free tier limit)
let requestQueue: Array<() => Promise<any>> = [];
let processingQueue = false;
const RATE_LIMIT_DELAY = 12000; // 12 seconds between requests (5 per minute)

/**
 * Rate-limited API request
 */
async function makeRequest<T>(
  params: Record<string, string>
): Promise<T | null> {
  return new Promise((resolve) => {
    requestQueue.push(async () => {
      try {
        const apiKey = getApiKey();
        if (!apiKey) {
          console.error("[AlphaVantage] Cannot make request: API key missing");
          resolve(null);
          return;
        }

        const url = new URL(BASE_URL);
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
        url.searchParams.append("apikey", apiKey);

        const response = await fetch(url.toString());
        const data = await response.json();

        // Check for API errors
        if (data["Error Message"]) {
          console.error("[AlphaVantage] API Error:", data["Error Message"]);
          resolve(null);
          return;
        }

        if (data["Note"]) {
          // Rate limit hit
          console.warn("[AlphaVantage] Rate limit:", data["Note"]);
          resolve(null);
          return;
        }

        resolve(data as T);
      } catch (error) {
        console.error("[AlphaVantage] Request failed:", error);
        resolve(null);
      }
    });

    if (!processingQueue) {
      processQueue();
    }
  });
}

/**
 * Process queued requests with rate limiting
 */
async function processQueue() {
  if (requestQueue.length === 0) {
    processingQueue = false;
    return;
  }

  processingQueue = true;
  const request = requestQueue.shift();

  if (request) {
    await request();
    // Wait before processing next request
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
  }

  processQueue();
}

/**
 * Fetch daily time series data for technical analysis
 * Returns last 200 days of OHLCV data
 */
export async function fetchDailyTimeSeries(
  symbol: string
): Promise<ChartDataPoint[]> {
  // Check cache first
  const cacheKey = `daily_${symbol}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  console.log(`[AlphaVantage] Fetching daily data for ${symbol}...`);

  const data = await makeRequest<any>({
    function: "TIME_SERIES_DAILY",
    symbol: symbol,
    outputsize: "compact", // Last 100 days (enough for most indicators)
  });

  if (!data || !data["Time Series (Daily)"]) {
    return [];
  }

  const timeSeries = data["Time Series (Daily)"];
  const chartData: ChartDataPoint[] = [];

  // Convert to ChartDataPoint format
  Object.entries(timeSeries)
    .slice(0, 200) // Take last 200 days
    .forEach(([date, values]: [string, any]) => {
      chartData.push({
        time: date, // Keep as ISO date string
        open: parseFloat(values["1. open"]),
        high: parseFloat(values["2. high"]),
        low: parseFloat(values["3. low"]),
        close: parseFloat(values["4. close"]),
        volume: parseFloat(values["5. volume"]),
      });
    });

  // Sort by time (oldest first)
  chartData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // Cache the result
  cache.set(cacheKey, { data: chartData, timestamp: Date.now() });

  return chartData;
}

/**
 * Fetch intraday data (for real-time charts)
 * Only for Professional+ tier (conserve API calls)
 */
export async function fetchIntradayTimeSeries(
  symbol: string,
  interval: "1min" | "5min" | "15min" | "30min" | "60min" = "5min"
): Promise<ChartDataPoint[]> {
  const cacheKey = `intraday_${symbol}_${interval}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    // 5-minute cache for intraday
    return cached.data;
  }

  console.log(`[AlphaVantage] Fetching ${interval} data for ${symbol}...`);

  const data = await makeRequest<any>({
    function: "TIME_SERIES_INTRADAY",
    symbol: symbol,
    interval: interval,
    outputsize: "compact",
  });

  if (!data || !data[`Time Series (${interval})`]) {
    return [];
  }

  const timeSeries = data[`Time Series (${interval})`];
  const chartData: ChartDataPoint[] = [];

  Object.entries(timeSeries)
    .slice(0, 100)
    .forEach(([datetime, values]: [string, any]) => {
      chartData.push({
        time: datetime, // Keep as ISO datetime string
        open: parseFloat(values["1. open"]),
        high: parseFloat(values["2. high"]),
        low: parseFloat(values["3. low"]),
        close: parseFloat(values["4. close"]),
        volume: parseFloat(values["5. volume"]),
      });
    });

  chartData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  cache.set(cacheKey, { data: chartData, timestamp: Date.now() });

  return chartData;
}

/**
 * Get pre-calculated technical indicator from Alpha Vantage
 * Useful for validation or when client-side calculation fails
 */
export async function getTechnicalIndicator(
  symbol: string,
  indicator: "RSI" | "MACD" | "SMA" | "EMA" | "BBANDS",
  interval: "daily" | "weekly" | "monthly" = "daily",
  timePeriod: number = 14
): Promise<any> {
  const cacheKey = `indicator_${symbol}_${indicator}_${interval}_${timePeriod}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const params: Record<string, string> = {
    function: indicator,
    symbol: symbol,
    interval: interval,
    time_period: timePeriod.toString(),
    series_type: "close",
  };

  const data = await makeRequest<any>(params);

  if (data) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  return data;
}

/**
 * Get stock quote (real-time or delayed)
 */
export async function getGlobalQuote(symbol: string): Promise<any> {
  const cacheKey = `quote_${symbol}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    // 5-minute cache for quotes
    return cached.data;
  }

  const data = await makeRequest<any>({
    function: "GLOBAL_QUOTE",
    symbol: symbol,
  });

  if (data && data["Global Quote"]) {
    cache.set(cacheKey, { data: data["Global Quote"], timestamp: Date.now() });
    return data["Global Quote"];
  }

  return null;
}

/**
 * Clear cache for a specific symbol or all cache
 */
export function clearCache(symbol?: string): void {
  if (symbol) {
    // Clear all entries for this symbol
    Array.from(cache.keys())
      .filter((key) => key.includes(symbol))
      .forEach((key) => cache.delete(key));
  } else {
    cache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
