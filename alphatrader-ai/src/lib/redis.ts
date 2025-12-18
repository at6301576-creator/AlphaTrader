/**
 * Redis Cache Configuration using Upstash
 * Provides server-side caching for stock quotes, technical indicators, and scanner results
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client (only if environment variables are set)
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('[Redis] ✓ Connected to Upstash Redis');
} else {
  console.warn('[Redis] ⚠️  Redis not configured - caching disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.');
}

/**
 * Cache TTL (Time To Live) configurations in seconds
 */
export const CACHE_TTL = {
  STOCK_QUOTE: 60, // 1 minute - stock quotes change frequently
  STOCK_INFO: 3600, // 1 hour - company info rarely changes
  TECHNICAL_INDICATORS: 900, // 15 minutes - technical indicators
  SCANNER_RESULTS: 600, // 10 minutes - scanner results
  NEWS: 1800, // 30 minutes - news articles
  PORTFOLIO_ANALYTICS: 300, // 5 minutes - portfolio calculations
  WATCHLIST: 120, // 2 minutes - watchlist data
} as const;

/**
 * Cache key prefixes for organization
 */
export const CACHE_KEYS = {
  stockQuote: (symbol: string) => `stock:quote:${symbol}`,
  stockInfo: (symbol: string) => `stock:info:${symbol}`,
  stockChart: (symbol: string, period: string) => `stock:chart:${symbol}:${period}`,
  technicalIndicators: (symbol: string) => `stock:technical:${symbol}`,
  scannerResults: (type: string, hash: string) => `scanner:${type}:${hash}`,
  news: (symbol: string) => `news:${symbol}`,
  portfolioAnalytics: (userId: string) => `portfolio:analytics:${userId}`,
  watchlist: (userId: string) => `watchlist:${userId}`,
} as const;

/**
 * Get data from cache
 * Returns null if Redis is not configured or key doesn't exist
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const startTime = Date.now();
    const data = await redis.get<T>(key);
    const duration = Date.now() - startTime;

    if (data) {
      console.log(`[Redis] ✓ Cache HIT: ${key} (${duration}ms)`);
    } else {
      console.log(`[Redis] ✗ Cache MISS: ${key} (${duration}ms)`);
    }

    return data;
  } catch (error) {
    console.error(`[Redis] Error getting cache key ${key}:`, error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 * Silently fails if Redis is not configured
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL.STOCK_QUOTE
): Promise<void> {
  if (!redis) return;

  try {
    const startTime = Date.now();
    await redis.setex(key, ttl, JSON.stringify(data));
    const duration = Date.now() - startTime;
    console.log(`[Redis] ✓ Cache SET: ${key} (TTL: ${ttl}s, ${duration}ms)`);
  } catch (error) {
    console.error(`[Redis] Error setting cache key ${key}:`, error);
  }
}

/**
 * Delete data from cache
 */
export async function deleteCache(key: string): Promise<void> {
  if (!redis) return;

  try {
    await redis.del(key);
    console.log(`[Redis] ✓ Cache DELETE: ${key}`);
  } catch (error) {
    console.error(`[Redis] Error deleting cache key ${key}:`, error);
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    // Note: Upstash Redis doesn't support SCAN, so we need to track keys manually
    // For now, we'll just log the pattern
    console.log(`[Redis] ⚠️  Pattern delete not implemented: ${pattern}`);
  } catch (error) {
    console.error(`[Redis] Error deleting cache pattern ${pattern}:`, error);
  }
}

/**
 * Wrapper for cached API calls
 * Automatically handles cache get/set with proper error handling
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch fresh data
  const data = await fetchFn();

  // Cache the result (fire and forget - don't block response)
  setCache(key, data, ttl).catch((error) => {
    console.error('[Redis] Error caching data:', error);
  });

  return data;
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('[Redis] Health check failed:', error);
    return false;
  }
}

// Export redis instance for advanced usage
export { redis };
