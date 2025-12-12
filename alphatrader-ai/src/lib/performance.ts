/**
 * Performance Monitoring Utilities
 * Track and log performance metrics
 */

// ============= PERFORMANCE MARKERS =============

export function measurePerformance(label: string, fn: () => void | Promise<void>) {
  const start = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now();
      const duration = end - start;

      if (duration > 1000) {
        console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms (>1s)`);
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
      }
    });
  }

  const end = performance.now();
  const duration = end - start;

  if (duration > 100) {
    console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms (>100ms)`);
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

// ============= DEBOUNCE & THROTTLE =============

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============= MEMOIZATION =============

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getCacheKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getCacheKey ? getCacheKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
}

// ============= WEB VITALS =============

export function reportWebVitals(metric: any) {
  // Log web vitals in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }

  // You can send to analytics service here
  // Example: analytics.track('web-vital', metric);
}

// ============= REQUEST BATCHING =============

interface BatchRequest<T> {
  key: string;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

export class RequestBatcher<T> {
  private queue: BatchRequest<T>[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchFn: (keys: string[]) => Promise<Map<string, T>>;
  private wait: number;

  constructor(batchFn: (keys: string[]) => Promise<Map<string, T>>, wait: number = 50) {
    this.batchFn = batchFn;
    this.wait = wait;
  }

  async request(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.wait);
      }
    });
  }

  private async flush() {
    const batch = this.queue.splice(0);
    this.timeout = null;

    if (batch.length === 0) return;

    try {
      const keys = batch.map(r => r.key);
      const results = await this.batchFn(keys);

      for (const request of batch) {
        const result = results.get(request.key);
        if (result !== undefined) {
          request.resolve(result);
        } else {
          request.reject(new Error(`No result for key: ${request.key}`));
        }
      }
    } catch (error) {
      for (const request of batch) {
        request.reject(error);
      }
    }
  }
}

// ============= VIEWPORT UTILITIES =============

export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function onIntersection(
  element: HTMLElement,
  callback: () => void,
  options?: IntersectionObserverInit
) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  }, options);

  observer.observe(element);

  return () => observer.disconnect();
}
