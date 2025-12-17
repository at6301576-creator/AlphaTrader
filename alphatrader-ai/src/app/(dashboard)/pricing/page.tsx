'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { SubscriptionTier, TIER_LIMITS, getTierPrice } from '@/lib/subscription';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const { subscription, loading } = useSubscription();
  const router = useRouter();

  const handleUpgrade = async (tier: string) => {
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (response.ok) {
        // Refresh the page to update subscription status
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
    }
  };

  const tiers = [
    {
      id: SubscriptionTier.STARTER,
      name: 'Starter',
      icon: Sparkles,
      color: 'text-gray-400',
      bgColor: 'bg-gray-900',
      borderColor: 'border-gray-800',
      popular: false,
    },
    {
      id: SubscriptionTier.PROFESSIONAL,
      name: 'Professional',
      icon: Zap,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20',
      borderColor: 'border-emerald-600',
      popular: true,
    },
    {
      id: SubscriptionTier.ENTERPRISE,
      name: 'Enterprise',
      icon: Crown,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-600',
      popular: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Unlock powerful features to supercharge your Shariah-compliant investment journey
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-2 p-1 bg-gray-900 rounded-lg border border-gray-800">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billing === 'monthly'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billing === 'yearly'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Yearly
            <Badge variant="outline" className="ml-2 bg-emerald-900/40 text-emerald-300 border-emerald-600">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const limits = TIER_LIMITS[tier.id];
          const price = getTierPrice(tier.id, billing);
          const isCurrentTier = subscription?.tier === tier.id;
          const Icon = tier.icon;

          return (
            <Card
              key={tier.id}
              className={`${tier.bgColor} ${tier.borderColor} ${
                tier.popular ? 'ring-2 ring-emerald-600' : ''
              } relative`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-600 text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 bg-gray-950/50 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${tier.color}`} />
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      ${price}
                    </span>
                    <span className="text-gray-400">
                      /{billing === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {billing === 'yearly' && price > 0 && (
                    <p className="text-sm text-gray-400">
                      ${(price / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={isCurrentTier || loading}
                  className={`w-full ${
                    tier.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {isCurrentTier ? 'Current Plan' : 'Upgrade'}
                </Button>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-300">Features:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>
                        {limits.features.alertsPerMonth === -1
                          ? 'Unlimited'
                          : limits.features.alertsPerMonth}{' '}
                        alerts per month
                      </span>
                    </li>

                    {limits.features.basicTechnicalIndicators && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Basic technical indicators</span>
                      </li>
                    )}

                    {limits.features.advancedTechnicalIndicators && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Advanced technical indicators</span>
                      </li>
                    )}

                    {limits.features.aiInsights && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>AI-powered insights</span>
                      </li>
                    )}

                    {limits.features.portfolioOptimization && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Portfolio optimization</span>
                      </li>
                    )}

                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Shariah compliance screening</span>
                    </li>

                    {limits.features.emailNotifications && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Email notifications</span>
                      </li>
                    )}

                    {limits.features.customScreeningCriteria && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Custom screening criteria</span>
                      </li>
                    )}

                    {limits.features.portfolioAnalytics && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Advanced portfolio analytics</span>
                      </li>
                    )}

                    {limits.features.realtimeData && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Real-time market data</span>
                      </li>
                    )}

                    {limits.features.apiAccess && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>API access</span>
                      </li>
                    )}

                    {limits.features.prioritySupport && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Priority support</span>
                      </li>
                    )}

                    {limits.features.customReports && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Custom reports</span>
                      </li>
                    )}

                    {limits.features.whiteLabel && (
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>White-label options</span>
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-8">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-white">All plans include:</h3>
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-gray-300">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Shariah-compliant screening
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Technical analysis tools
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Portfolio tracking
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
