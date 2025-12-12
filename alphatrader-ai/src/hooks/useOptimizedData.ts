/**
 * Optimized data fetching hooks using React Query
 * Provides automatic caching, deduplication, and background refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';

// ============= STOCK HOOKS =============

export function useStock(symbol: string) {
  return useQuery({
    queryKey: queryKeys.stock(symbol),
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${symbol}`);
      if (!res.ok) throw new Error('Failed to fetch stock');
      return res.json();
    },
    enabled: !!symbol,
  });
}

export function useStockQuote(symbol: string) {
  return useQuery({
    queryKey: queryKeys.stockQuote(symbol),
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${symbol}/quote`);
      if (!res.ok) throw new Error('Failed to fetch quote');
      return res.json();
    },
    enabled: !!symbol,
    staleTime: 1 * 60 * 1000, // 1 minute for real-time quotes
  });
}

export function useStockChart(symbol: string, period: string = '1y') {
  return useQuery({
    queryKey: queryKeys.stockChart(symbol, period),
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${symbol}/chart?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch chart');
      return res.json();
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes for chart data
  });
}

export function useStockNews(symbol: string) {
  return useQuery({
    queryKey: queryKeys.stockNews(symbol),
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${symbol}/news`);
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
    enabled: !!symbol,
    staleTime: 15 * 60 * 1000, // 15 minutes for news
  });
}

// ============= PORTFOLIO HOOKS =============

export function usePortfolio() {
  return useQuery({
    queryKey: queryKeys.portfolio(),
    queryFn: async () => {
      const res = await fetch('/api/portfolio');
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      return res.json();
    },
  });
}

export function usePortfolioAnalytics(period: string = '30d') {
  return useQuery({
    queryKey: queryKeys.portfolioAnalytics(period),
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/analytics?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePortfolioOptimization(period: string = '30d') {
  return useQuery({
    queryKey: queryKeys.portfolioOptimization(period),
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/optimization?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch optimization');
      return res.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (AI analysis is expensive)
  });
}

// Portfolio mutations with optimistic updates
export function useAddToPortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add to portfolio');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate portfolio queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio() });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

// ============= SCANNER HOOKS =============

export function useScanner(type: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.scanner(type, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any);
      const res = await fetch(`/api/scanner/${type}?${searchParams}`);
      if (!res.ok) throw new Error('Failed to fetch scanner results');
      return res.json();
    },
    enabled: !!type,
    staleTime: 10 * 60 * 1000, // 10 minutes for scanner results
  });
}

// ============= BENCHMARK HOOKS =============

export function useBenchmark(symbol?: string, period: string = '1y') {
  return useQuery({
    queryKey: queryKeys.benchmark(symbol, period),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (symbol) params.set('symbol', symbol);
      params.set('period', period);
      const res = await fetch(`/api/benchmarks?${params}`);
      if (!res.ok) throw new Error('Failed to fetch benchmark');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBenchmarks() {
  return useQuery({
    queryKey: queryKeys.benchmarks(),
    queryFn: async () => {
      const res = await fetch('/api/benchmarks?all=true');
      if (!res.ok) throw new Error('Failed to fetch benchmarks');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============= WATCHLIST HOOKS =============

export function useWatchlist() {
  return useQuery({
    queryKey: queryKeys.watchlist(),
    queryFn: async () => {
      const res = await fetch('/api/watchlist');
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      return res.json();
    },
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (symbol: string) => {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) throw new Error('Failed to add to watchlist');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist() });
    },
  });
}

// ============= ALERT HOOKS =============

export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts(),
    queryFn: async () => {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return res.json();
    },
  });
}

export function useTechnicalAlerts(symbol?: string) {
  return useQuery({
    queryKey: queryKeys.technicalAlerts(symbol),
    queryFn: async () => {
      const url = symbol ? `/api/technical-alerts?symbol=${symbol}` : '/api/technical-alerts';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch technical alerts');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============= PREFETCH UTILITIES =============

/**
 * Prefetch data for faster navigation
 * Call this on hover or when user shows intent to navigate
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetchStock: (symbol: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.stock(symbol),
        queryFn: async () => {
          const res = await fetch(`/api/stocks/${symbol}`);
          if (!res.ok) throw new Error('Failed to fetch stock');
          return res.json();
        },
      });
    },
    prefetchPortfolio: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.portfolio(),
        queryFn: async () => {
          const res = await fetch('/api/portfolio');
          if (!res.ok) throw new Error('Failed to fetch portfolio');
          return res.json();
        },
      });
    },
  };
}
