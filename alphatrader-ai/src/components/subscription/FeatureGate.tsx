'use client';

import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from './UpgradePrompt';
import { TIER_LIMITS, SubscriptionTier } from '@/lib/subscription';

interface FeatureGateProps {
  feature: keyof typeof TIER_LIMITS[typeof SubscriptionTier.STARTER]['features'];
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true
}: FeatureGateProps) {
  const { hasFeature, getUpgradePrompt, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse bg-gray-800 h-20 rounded-lg" />;
  }

  const hasAccess = hasFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showUpgradePrompt) {
    const prompt = getUpgradePrompt(feature);
    if (prompt.shouldShow && prompt.requiredTier) {
      return <UpgradePrompt requiredTier={prompt.requiredTier} feature={feature} />;
    }
  }

  return <>{fallback || null}</>;
}
