/**
 * Simple in-memory cache with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private requestTracker: Map<string, number[]> = new Map();

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with TTL (time to live in milliseconds)
   */
  set<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if request should be throttled (rate limiting)
   * @param key - Unique identifier for the request
   * @param maxRequests - Maximum requests allowed in time window
   * @param timeWindow - Time window in milliseconds (default: 1 minute)
   * @returns true if request should be throttled, false otherwise
   */
  shouldThrottle(key: string, maxRequests: number = 60, timeWindow: number = 60000): boolean {
    const now = Date.now();
    const requests = this.requestTracker.get(key) || [];

    // Filter out requests outside the time window
    const recentRequests = requests.filter(timestamp => now - timestamp < timeWindow);

    if (recentRequests.length >= maxRequests) {
      return true;
    }

    // Add current request timestamp
    recentRequests.push(now);
    this.requestTracker.set(key, recentRequests);

    return false;
  }

  /**
   * Get time until next request is allowed (in milliseconds)
   */
  getThrottleDelay(key: string, maxRequests: number = 60, timeWindow: number = 60000): number {
    const now = Date.now();
    const requests = this.requestTracker.get(key) || [];

    if (requests.length < maxRequests) {
      return 0;
    }

    const oldestRequest = requests[0];
    const timeSinceOldest = now - oldestRequest;

    return Math.max(0, timeWindow - timeSinceOldest);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const apiCache = new Cache();

/**
 * Wrapper function for API calls with caching and throttling
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheOptions?: {
    ttl?: number;
    bypassCache?: boolean;
    throttleKey?: string;
    maxRequests?: number;
    timeWindow?: number;
  }
): Promise<T> {
  const {
    ttl = 300000, // 5 minutes default
    bypassCache = false,
    throttleKey,
    maxRequests = 60,
    timeWindow = 60000,
  } = cacheOptions || {};

  const cacheKey = `${url}:${JSON.stringify(options)}`;

  // Check cache first
  if (!bypassCache) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Check throttling
  if (throttleKey && apiCache.shouldThrottle(throttleKey, maxRequests, timeWindow)) {
    const delay = apiCache.getThrottleDelay(throttleKey, maxRequests, timeWindow);
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(delay / 1000)} seconds.`);
  }

  // Fetch data
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Cache the response
  apiCache.set(cacheKey, data, ttl);

  return data;
}

/**
 * Preload data into cache
 */
export function preloadCache<T>(key: string, data: T, ttl: number = 300000): void {
  apiCache.set(key, data, ttl);
}

/**
 * Clear specific cache entries by pattern
 */
export function clearCacheByPattern(pattern: string): void {
  const stats = apiCache.getStats();
  stats.keys.forEach(key => {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  });
}
