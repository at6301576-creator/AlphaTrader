# Subscription Tier System - Implementation Guide

## Overview

The subscription tier system has been successfully implemented in your AlphaTrader AI application. This guide explains how the system works and how to use it.

## Subscription Tiers

### 1. **Starter (Free)**
- **Price:** $0/month
- **Features:**
  - 5 alerts per month
  - Basic technical indicators
  - Shariah compliance screening
  - 1 saved screener
  - Up to 10 portfolio holdings
  - 1 year historical data
  - Basic news access
  - Push notifications

### 2. **Professional ($29/month)**
- **Price:** $29/month ($290/year - save 17%)
- **Features:**
  - **Unlimited alerts per month**
  - Advanced technical indicators
  - AI-powered insights
  - Portfolio optimization
  - Email notifications
  - Custom screening criteria
  - Up to 100 portfolio holdings
  - 10 saved screeners
  - 10 years historical data
  - Real-time market data
  - Advanced news access
  - Custom reports

### 3. **Enterprise ($99/month)**
- **Price:** $99/month ($990/year - save 17%)
- **Features:**
  - All Professional features
  - **Unlimited everything**
  - API access
  - Priority support
  - White-label options
  - 20 years historical data
  - Premium news access

## Database Schema

The subscription system uses the following Prisma models:

```prisma
model Subscription {
  id                String    @id @default(cuid())
  userId            String    @unique
  tier              String    @default("STARTER") // STARTER, PROFESSIONAL, ENTERPRISE
  status            String    @default("ACTIVE")  // ACTIVE, CANCELED, PAST_DUE, etc.

  // Payment details (for future Stripe integration)
  stripeCustomerId      String?   @unique
  stripeSubscriptionId  String?   @unique
  stripePriceId         String?

  // Billing period
  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelAtPeriodEnd     Boolean   @default(false)

  // Usage tracking
  alertsUsedThisMonth   Int       @default(0)
  apiCallsThisMonth     Int       @default(0)
  lastResetAt           DateTime  @default(now())

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

## Implementation Files

### Core Files Created:

1. **`src/lib/subscription.ts`** - Subscription tier constants and utilities
2. **`src/hooks/useSubscription.ts`** - React hook for subscription access
3. **`src/components/subscription/FeatureGate.tsx`** - Component to gate features
4. **`src/components/subscription/UpgradePrompt.tsx`** - Upgrade UI component
5. **`src/components/subscription/UsageLimitBadge.tsx`** - Usage display component
6. **`src/app/api/subscription/route.ts`** - API endpoints for subscription
7. **`src/app/(dashboard)/pricing/page.tsx`** - Pricing page
8. **`src/app/(dashboard)/settings/subscription/page.tsx`** - Subscription settings

## How to Use

### 1. Gate Features with FeatureGate Component

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate';

function MyComponent() {
  return (
    <FeatureGate
      feature="aiInsights"
      showUpgradePrompt={true}
    >
      {/* This content only shows for Professional+ users */}
      <AIInsightsPanel />
    </FeatureGate>
  );
}
```

### 2. Check Features Programmatically

```tsx
import { useSubscription } from '@/hooks/useSubscription';

function MyComponent() {
  const { hasFeature, checkLimit, subscription } = useSubscription();

  // Check if user has a feature
  if (hasFeature('aiInsights')) {
    // Show AI insights
  }

  // Check usage limits
  const { allowed, limit, remaining } = checkLimit('alertsPerMonth', 3);
  if (!allowed) {
    // Show upgrade prompt
  }

  return <div>Tier: {subscription?.tier}</div>;
}
```

### 3. Display Usage Limits

```tsx
import { UsageLimitBadge } from '@/components/subscription/UsageLimitBadge';

function AlertsSection() {
  const { subscription } = useSubscription();

  return (
    <div>
      <h2>Alerts</h2>
      <UsageLimitBadge
        usageType="alertsPerMonth"
        currentUsage={subscription?.alertsUsedThisMonth || 0}
      />
    </div>
  );
}
```

### 4. Upgrade Users

Users can upgrade their subscription in two ways:

1. **Visit the Pricing Page:** `/pricing`
2. **Visit Subscription Settings:** `/settings/subscription`

When a user clicks "Upgrade", it currently updates their tier immediately (for testing). In production, you'll integrate with Stripe.

## Available Features for Gating

```typescript
// All available features:
- alertsPerMonth
- technicalAlerts
- priceAlerts
- emailNotifications
- pushNotifications
- basicTechnicalIndicators
- advancedTechnicalIndicators
- aiInsights
- portfolioOptimization
- shariahCompliance
- customScreeningCriteria
- savedScreeners
- portfolioTracking
- maxPortfolioHoldings
- portfolioAnalytics
- realtimeData
- historicalDataYears
- newsAccess
- apiAccess
- prioritySupport
- customReports
- whiteLabel
```

## API Endpoints

### GET `/api/subscription`
Get current user's subscription details

**Response:**
```json
{
  "tier": "PROFESSIONAL",
  "status": "ACTIVE",
  "currentPeriodEnd": "2025-01-17T...",
  "alertsUsedThisMonth": 3,
  "apiCallsThisMonth": 45,
  "cancelAtPeriodEnd": false
}
```

### POST `/api/subscription`
Update user's subscription tier (for testing - will be Stripe in production)

**Request:**
```json
{
  "tier": "PROFESSIONAL"
}
```

## Usage Examples

### Example 1: Gate AI Insights Feature

```tsx
// In your AI insights component
import { FeatureGate } from '@/components/subscription/FeatureGate';

export function AIInsightsPanel() {
  return (
    <FeatureGate feature="aiInsights">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {/* AI insights content */}
        </CardContent>
      </Card>
    </FeatureGate>
  );
}
```

### Example 2: Check Alert Limits Before Creating

```tsx
import { useSubscription } from '@/hooks/useSubscription';

export function CreateAlertButton() {
  const { checkLimit, subscription } = useSubscription();

  const handleCreateAlert = async () => {
    const { allowed, remaining } = checkLimit(
      'alertsPerMonth',
      subscription?.alertsUsedThisMonth || 0
    );

    if (!allowed) {
      // Show upgrade prompt
      toast.error(`You've reached your alert limit. Upgrade to create more!`);
      return;
    }

    // Create alert...
  };

  return <Button onClick={handleCreateAlert}>Create Alert</Button>;
}
```

### Example 3: Show Different Content by Tier

```tsx
import { useSubscription } from '@/hooks/useSubscription';

export function TechnicalIndicators() {
  const { hasFeature } = useSubscription();

  const showAdvanced = hasFeature('advancedTechnicalIndicators');

  return (
    <div>
      {/* Basic indicators - always shown */}
      <BasicIndicators />

      {/* Advanced indicators - only for Pro+ */}
      {showAdvanced && <AdvancedIndicators />}

      {!showAdvanced && (
        <UpgradePrompt requiredTier="PROFESSIONAL" feature="advancedTechnicalIndicators" />
      )}
    </div>
  );
}
```

## Next Steps

### For Production:

1. **Add Authentication**
   - Replace the mock `userId` in `/api/subscription/route.ts` with your actual auth system
   - Update to use real user sessions (NextAuth, Clerk, etc.)

2. **Integrate Stripe**
   - Set up Stripe account
   - Add Stripe publishable and secret keys to `.env`
   - Implement checkout flow
   - Add webhooks for subscription events
   - See Stripe documentation: https://stripe.com/docs/billing/subscriptions/overview

3. **Add Usage Tracking**
   - Increment `alertsUsedThisMonth` when users create alerts
   - Increment `apiCallsThisMonth` when making API calls
   - Monthly reset happens automatically based on `lastResetAt`

4. **Update Existing Features**
   - Add `<FeatureGate>` components around premium features
   - Add limit checks before allowing actions
   - Display usage badges in relevant sections

## Testing

To test the subscription system:

1. Visit `/pricing` to see all pricing tiers
2. Click "Upgrade" to change your tier (currently instant for testing)
3. Visit `/settings/subscription` to see your current subscription
4. Try accessing gated features with different tiers

## Troubleshooting

**Q: Users not seeing their subscription**
- Check that the user ID is correctly passed to the API
- Verify the database has the subscription record
- Check browser console for API errors

**Q: Feature gates not working**
- Ensure you're using the correct feature name from `TIER_LIMITS`
- Check that `useSubscription` hook is being called
- Verify the API endpoint is returning subscription data

**Q: Build errors**
- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` to sync database
- Clear `.next` folder and rebuild

## Support

For questions or issues, please check:
- API responses in Network tab
- Console errors in browser
- Server logs for API errors

---

**Version:** 1.0.0
**Last Updated:** December 17, 2025
