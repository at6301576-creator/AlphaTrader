'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, CreditCard, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import { getTierDisplayName, isSubscriptionActive } from '@/lib/subscription';
import { UsageLimitBadge } from '@/components/subscription/UsageLimitBadge';

export default function SubscriptionSettingsPage() {
  const { subscription, loading, limits } = useSubscription();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-900 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-900 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-300">Unable to load subscription information</p>
        </CardContent>
      </Card>
    );
  }

  const isActive = isSubscriptionActive(subscription.status);
  const tierName = getTierDisplayName(subscription.tier);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Subscription</h1>
        <p className="text-gray-400">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <Card className="bg-gradient-to-br from-emerald-900/20 to-gray-900 border-emerald-700/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-900/40 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">{tierName} Plan</CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  {subscription.tier === 'STARTER' ? 'Free forever' : `$${limits?.price}/month`}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                isActive
                  ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600'
                  : 'bg-red-900/40 text-red-300 border-red-600'
              }
            >
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.currentPeriodEnd && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>
                {subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews'} on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}

          {subscription.tier !== 'ENTERPRISE' && (
            <Link href="/pricing">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-950/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Alerts</span>
                <UsageLimitBadge
                  usageType="alertsPerMonth"
                  currentUsage={subscription.alertsUsedThisMonth}
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {subscription.alertsUsedThisMonth}
                </span>
                <span className="text-gray-400 text-sm">
                  / {limits?.features.alertsPerMonth === -1 ? '∞' : limits?.features.alertsPerMonth}
                </span>
              </div>
              {limits && limits.features.alertsPerMonth !== -1 && (
                <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      subscription.alertsUsedThisMonth >= limits.features.alertsPerMonth
                        ? 'bg-red-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (subscription.alertsUsedThisMonth / limits.features.alertsPerMonth) * 100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-950/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">API Calls</span>
                <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700">
                  {subscription.apiCallsThisMonth}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {subscription.apiCallsThisMonth}
                </span>
                <span className="text-gray-400 text-sm">this month</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Usage resets on the 1st of each month
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      {limits && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Your Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FeatureItem
                label="Alerts per month"
                value={
                  limits.features.alertsPerMonth === -1
                    ? 'Unlimited'
                    : `${limits.features.alertsPerMonth}`
                }
              />
              <FeatureItem
                label="Technical Indicators"
                value={
                  limits.features.advancedTechnicalIndicators
                    ? 'Advanced'
                    : limits.features.basicTechnicalIndicators
                    ? 'Basic'
                    : 'None'
                }
              />
              <FeatureItem
                label="AI Insights"
                value={limits.features.aiInsights ? 'Enabled' : 'Disabled'}
              />
              <FeatureItem
                label="Portfolio Optimization"
                value={limits.features.portfolioOptimization ? 'Enabled' : 'Disabled'}
              />
              <FeatureItem
                label="Email Notifications"
                value={limits.features.emailNotifications ? 'Enabled' : 'Disabled'}
              />
              <FeatureItem
                label="Real-time Data"
                value={limits.features.realtimeData ? 'Enabled' : 'Delayed'}
              />
              <FeatureItem
                label="API Access"
                value={limits.features.apiAccess ? 'Enabled' : 'Disabled'}
              />
              <FeatureItem
                label="Priority Support"
                value={limits.features.prioritySupport ? 'Yes' : 'Standard'}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing */}
      {subscription.tier !== 'STARTER' && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400 text-sm">
              Payment processing will be available soon via Stripe
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="border-gray-700" disabled>
                Update Payment Method
              </Button>
              <Button variant="outline" className="border-gray-700" disabled>
                View Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeatureItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-950/50 rounded-lg">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
