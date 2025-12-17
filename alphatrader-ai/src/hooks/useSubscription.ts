'use client';

import { useEffect, useState } from 'react';
import {
  SubscriptionTier,
  SubscriptionTierType,
  SubscriptionStatusType,
  canAccessFeature,
  checkUsageLimit,
  getTierLimits,
  TIER_LIMITS,
  shouldShowUpgradePrompt,
  isSubscriptionActive,
} from '@/lib/subscription';

export interface SubscriptionData {
  tier: SubscriptionTierType;
  status: SubscriptionStatusType;
  currentPeriodEnd?: Date;
  alertsUsedThisMonth: number;
  apiCallsThisMonth: number;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch subscription data from API
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscription');
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        } else {
          // If no subscription found, default to STARTER
          setSubscription({
            tier: SubscriptionTier.STARTER,
            status: 'ACTIVE',
            alertsUsedThisMonth: 0,
            apiCallsThisMonth: 0,
            cancelAtPeriodEnd: false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        // Default to STARTER on error
        setSubscription({
          tier: SubscriptionTier.STARTER,
          status: 'ACTIVE',
          alertsUsedThisMonth: 0,
          apiCallsThisMonth: 0,
          cancelAtPeriodEnd: false,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  const hasFeature = (feature: keyof typeof TIER_LIMITS[typeof SubscriptionTier.STARTER]['features']) => {
    if (!subscription) return false;
    return canAccessFeature(subscription.tier, feature);
  };

  const checkLimit = (
    usageType: 'alertsPerMonth' | 'savedScreeners' | 'maxPortfolioHoldings',
    currentUsage?: number
  ) => {
    if (!subscription) {
      return { allowed: false, limit: 0, remaining: 0 };
    }

    const usage =
      currentUsage ??
      (usageType === 'alertsPerMonth' ? subscription.alertsUsedThisMonth : 0);

    return checkUsageLimit(subscription.tier, usageType, usage);
  };

  const getUpgradePrompt = (feature: keyof typeof TIER_LIMITS[typeof SubscriptionTier.STARTER]['features']) => {
    if (!subscription) return { shouldShow: false };
    return shouldShowUpgradePrompt(subscription.tier, feature);
  };

  return {
    subscription,
    loading,
    hasFeature,
    checkLimit,
    getUpgradePrompt,
    isActive: subscription ? isSubscriptionActive(subscription.status) : false,
    limits: subscription ? getTierLimits(subscription.tier) : null,
  };
}
