/**
 * Lazy Loading Component
 * Delays rendering of heavy components until they're in viewport
 */

'use client';

import { Suspense, lazy as reactLazy, ComponentType } from 'react';

interface LazyLoadProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

/**
 * Lazy load a component with automatic code splitting
 * Usage:
 * <LazyLoad
 *   component={() => import('./HeavyComponent')}
 *   fallback={<LoadingSkeleton />}
 *   {...props}
 * />
 */
export function LazyLoad({ component, fallback = null, ...props }: LazyLoadProps) {
  const LazyComponent = reactLazy(component);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Hook to create a lazy loaded component
 * Usage:
 * const HeavyChart = useLazyComponent(() => import('./Chart'));
 */
export function useLazyComponent(
  importer: () => Promise<{ default: ComponentType<any> }>
) {
  return reactLazy(importer);
}
