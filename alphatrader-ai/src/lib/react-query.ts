/**
 * React Query Configuration
 * Optimized for performance with caching and deduplication
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes (data considered fresh for 5 min)
      staleTime: 5 * 60 * 1000,

      // Cache time: 10 minutes (keep unused data in cache for 10 min)
      gcTime: 10 * 60 * 1000,

      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,

      // Network mode - fail if offline
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // Stock queries
  stock: (symbol: string) => ['stock', symbol] as const,
  stockQuote: (symbol: string) => ['stock', symbol, 'quote'] as const,
  stockChart: (symbol: string, period: string) => ['stock', symbol, 'chart', period] as const,
  stockNews: (symbol: string) => ['stock', symbol, 'news'] as const,

  // Portfolio queries
  portfolio: () => ['portfolio'] as const,
  portfolioAnalytics: (period: string) => ['portfolio', 'analytics', period] as const,
  portfolioOptimization: (period: string) => ['portfolio', 'optimization', period] as const,

  // Scanner queries
  scanner: (type: string, params?: Record<string, any>) => ['scanner', type, params] as const,

  // Benchmark queries
  benchmark: (symbol?: string, period?: string) => ['benchmark', symbol, period] as const,
  benchmarks: () => ['benchmarks'] as const,

  // Watchlist queries
  watchlist: () => ['watchlist'] as const,

  // Alert queries
  alerts: () => ['alerts'] as const,
  technicalAlerts: (symbol?: string) => ['technical-alerts', symbol] as const,
};
