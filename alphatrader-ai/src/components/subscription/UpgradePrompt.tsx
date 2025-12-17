'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import {
  SubscriptionTierType,
  getTierDisplayName,
  getTierPrice,
  getUpgradeBenefits,
  TIER_LIMITS,
  SubscriptionTier,
} from '@/lib/subscription';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradePromptProps {
  requiredTier: SubscriptionTierType;
  feature: keyof typeof TIER_LIMITS[typeof SubscriptionTier.STARTER]['features'];
  compact?: boolean;
}

export function UpgradePrompt({ requiredTier, feature, compact = false }: UpgradePromptProps) {
  const { subscription } = useSubscription();

  const tierName = getTierDisplayName(requiredTier);
  const price = getTierPrice(requiredTier, 'monthly');

  const benefits = subscription
    ? getUpgradeBenefits(subscription.tier, requiredTier)
    : [];

  const featureName = feature
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border border-emerald-700/30 rounded-lg">
        <div className="p-2 bg-emerald-900/40 rounded-full">
          <Lock className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-300">
            Upgrade to {tierName} to unlock {featureName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Starting at ${price}/month
          </p>
        </div>
        <Link href="/pricing">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Upgrade
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-emerald-950/30 to-gray-900 border-emerald-700/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-900/40 rounded-lg">
              <Lock className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                Premium Feature
                <Badge
                  variant="outline"
                  className="bg-emerald-900/40 text-emerald-300 border-emerald-600"
                >
                  {tierName}
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Unlock {featureName} with {tierName}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-gray-950/50 rounded-lg">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-white">${price}</span>
            <span className="text-gray-400">/month</span>
          </div>
          <p className="text-sm text-gray-400">
            Billed monthly • Cancel anytime
          </p>
        </div>

        {benefits.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              What you'll get:
            </p>
            <ul className="space-y-2">
              {benefits.slice(0, 5).map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                  <ArrowRight className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
              {benefits.length > 5 && (
                <li className="text-sm text-emerald-400">
                  +{benefits.length - 5} more features...
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Link href="/pricing" className="flex-1">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
            >
              Upgrade to {tierName}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button
              variant="outline"
              size="lg"
              className="border-gray-700 hover:bg-gray-800"
            >
              View All Plans
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
