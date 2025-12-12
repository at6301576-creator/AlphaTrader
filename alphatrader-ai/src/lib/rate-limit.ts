/**
 * Rate Limiting Utility
 *
 * Provides in-memory rate limiting with optional Redis support for production.
 * Supports both IP-based and user-based rate limiting.
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  /**
   * Unique identifier for this rate limiter
   */
  id: string;

  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number;

  /**
   * Time window in seconds
   */
  window: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store for rate limiting (use Redis in production)
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || existing.resetTime < now) {
      // Create new entry
      const entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.store.set(key, entry);
      return entry;
    }

    // Increment existing entry
    existing.count++;
    this.store.set(key, existing);
    return existing;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Global store instance
const store = new RateLimitStore();

/**
 * Rate limiter factory
 */
export function rateLimit(config: RateLimitConfig) {
  const windowMs = config.window * 1000;

  return {
    /**
     * Check rate limit for a given identifier (IP or user ID)
     */
    check: async (identifier: string): Promise<RateLimitResult> => {
      const key = `${config.id}:${identifier}`;
      const result = await store.increment(key, windowMs);

      const success = result.count <= config.limit;
      const remaining = Math.max(0, config.limit - result.count);
      const reset = Math.ceil(result.resetTime / 1000);

      return {
        success,
        limit: config.limit,
        remaining,
        reset,
      };
    },

    /**
     * Reset rate limit for a given identifier
     */
    reset: async (identifier: string): Promise<void> => {
      const key = `${config.id}:${identifier}`;
      await store.reset(key);
    },
  };
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try various headers for IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    return `ip:${forwarded.split(",")[0].trim()}`;
  }
  if (realIp) {
    return `ip:${realIp}`;
  }
  if (cfConnectingIp) {
    return `ip:${cfConnectingIp}`;
  }

  return "ip:unknown";
}

/**
 * Middleware to apply rate limiting to API routes
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): Promise<NextResponse | null> {
  const limiter = rateLimit(config);
  const identifier = getIdentifier(request, userId);
  const result = await limiter.check(identifier);

  // Add rate limit headers
  const headers = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };

  if (!result.success) {
    // Rate limit exceeded
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Please try again in ${result.reset - Math.floor(Date.now() / 1000)} seconds.`,
        retryAfter: result.reset - Math.floor(Date.now() / 1000),
      },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": (result.reset - Math.floor(Date.now() / 1000)).toString(),
        },
      }
    );
  }

  // Rate limit check passed, return null to continue
  return null;
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Strict rate limit for external API calls (to protect API quotas)
   * 30 requests per minute
   */
  api: rateLimit({
    id: "api",
    limit: 30,
    window: 60,
  }),

  /**
   * Standard rate limit for authenticated users
   * 100 requests per minute
   */
  authenticated: rateLimit({
    id: "authenticated",
    limit: 100,
    window: 60,
  }),

  /**
   * Lenient rate limit for public endpoints
   * 20 requests per minute
   */
  public: rateLimit({
    id: "public",
    limit: 20,
    window: 60,
  }),

  /**
   * Strict rate limit for mutation operations
   * 10 requests per minute
   */
  mutations: rateLimit({
    id: "mutations",
    limit: 10,
    window: 60,
  }),

  /**
   * Very strict rate limit for sensitive operations
   * 5 requests per minute
   */
  sensitive: rateLimit({
    id: "sensitive",
    limit: 5,
    window: 60,
  }),
};
