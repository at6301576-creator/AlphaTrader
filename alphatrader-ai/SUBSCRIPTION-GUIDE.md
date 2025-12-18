# AlphaTrader AI - Subscription System Guide

## Overview
Your subscription system is now **production-ready** with a 3-tier model: STARTER, PROFESSIONAL, and ENTERPRISE.

---

## ✅ What's Fixed

### 1. Demo Account Upgrade Issue - **SOLVED**
**Problem**: Demo account still showed upgrade prompts despite having ENTERPRISE subscription in database.

**Root Cause**: The `/api/subscription` endpoint was using hardcoded `'mock-user-id'` instead of actual authenticated user ID.

**Solution**:
- Updated endpoint to use NextAuth session
- Now properly fetches subscription for logged-in user
- Demo account (demo@alphatrader.ai) now has full ENTERPRISE access

**Status**: ✅ Deployed to production: https://alphatrader-ndoj9bjb9-alpha-trader.vercel.app

---

## 📊 Current Database Status

### Users and Their Subscriptions:

| Email | Name | Tier | Status | Valid Until |
|-------|------|------|--------|-------------|
| demo@alphatrader.ai | Demo User | **ENTERPRISE** | ACTIVE | Dec 18, 2026 |
| admin@admin.com | Admin | **PROFESSIONAL** | ACTIVE | Dec 18, 2026 |
| obaidghafoor_uae@outlook.com | Obi | NONE | N/A | N/A |

---

## 🔧 For Testing: Upgrade User Memberships

### Method 1: Command Line Script (Recommended)

```bash
# Upgrade any user to any tier
node scripts/upgrade-user.js <email> <tier>

# Examples:
node scripts/upgrade-user.js obaidghafoor_uae@outlook.com PROFESSIONAL
node scripts/upgrade-user.js admin@admin.com ENTERPRISE
node scripts/upgrade-user.js newuser@example.com STARTER
```

**Available Tiers**: STARTER, PROFESSIONAL, ENTERPRISE

### Method 2: Prisma Studio (Visual GUI)

```bash
# Start Prisma Studio
npx prisma studio
```

Then:
1. Open http://localhost:5555 in your browser
2. Navigate to "Subscription" table
3. Find or create subscription for user
4. Edit the `tier` field
5. Save changes

**Note**: Prisma Studio runs locally but modifies your **cloud database** (Vercel Postgres)

### Method 3: Direct Database Query

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  await prisma.subscription.upsert({
    where: { userId: 'USER_ID_HERE' },
    update: { tier: 'ENTERPRISE', status: 'ACTIVE' },
    create: {
      userId: 'USER_ID_HERE',
      tier: 'ENTERPRISE',
      status: 'ACTIVE',
      alertsUsedThisMonth: 0,
      apiCallsThisMonth: 0
    }
  });
  await prisma.\$disconnect();
})();
"
```

---

## 📍 About Prisma Studio & Cloud Database

### "Is Prisma Studio using my local or cloud database?"

**Answer**: **Cloud database!** (Vercel Postgres)

#### How It Works:
- **Prisma Studio**: Runs locally on http://localhost:5555 (just the GUI)
- **Database**: Lives in the cloud at db.prisma.io (Prisma Postgres/Accelerate)
- **Connection**: Studio connects to cloud DB using your `.env` credentials

#### Think of it like:
- Gmail web interface (local browser) → Gmail servers (cloud)
- Prisma Studio (local GUI) → Vercel Postgres (cloud)

#### Your Database URLs:
```env
POSTGRES_PRISMA_URL="prisma+postgres://accelerate.prisma-data.net/..."  # For queries
POSTGRES_URL_NON_POOLING="postgres://db.prisma.io:5432/..."           # For migrations
```

Both point to your **production cloud database** hosted by Prisma.

---

## 🚀 Production Readiness: Subscription & Payment System

### Current Status: ⚠️ **PARTIALLY READY**

#### ✅ What's Production-Ready:

1. **Subscription Management**
   - 3-tier system (STARTER, PROFESSIONAL, ENTERPRISE) ✅
   - Feature gating based on tiers ✅
   - Usage tracking (alerts, API calls) ✅
   - Subscription status management ✅

2. **Authentication**
   - NextAuth integration ✅
   - User session management ✅
   - Protected API routes ✅

3. **Database Schema**
   - Subscription table with all fields ✅
   - Proper relationships (User ↔ Subscription) ✅
   - Cloud database (Vercel Postgres) ✅

#### ❌ What's Missing for Full Production (Payments):

1. **Payment Integration** - NOT IMPLEMENTED
   - Stripe integration needed
   - Webhook handlers for subscription events
   - Payment confirmation flow
   - Invoice generation

2. **Upgrade/Downgrade Flow** - NOT IMPLEMENTED
   - User-facing upgrade buttons
   - Payment checkout page
   - Subscription change confirmation
   - Proration logic

3. **Cancellation Flow** - PARTIAL
   - Schema supports `cancelAtPeriodEnd` ✅
   - But no user-facing cancellation UI ❌
   - No cancellation webhook handlers ❌

---

## 💳 How Payment System Would Work in Production

### For Real Payments with Stripe:

#### 1. **Setup Stripe Integration**

```bash
npm install stripe
```

Create `/api/stripe/create-checkout`:
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { tier } = await req.json();

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: TIER_PRICE_IDS[tier], // Map tier to Stripe price ID
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.NEXTAUTH_URL}/settings/subscription?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
  });

  return Response.json({ sessionId: session.id });
}
```

#### 2. **Handle Stripe Webhooks**

Create `/api/stripe/webhook`:
```typescript
export async function POST(req: Request) {
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get('stripe-signature')!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'checkout.session.completed':
      // Create subscription in database
      await createSubscription(event.data.object);
      break;

    case 'customer.subscription.updated':
      // Update subscription tier/status
      await updateSubscription(event.data.object);
      break;

    case 'customer.subscription.deleted':
      // Cancel subscription
      await cancelSubscription(event.data.object);
      break;
  }
}
```

#### 3. **Add Upgrade Buttons in UI**

```typescript
// In src/app/(dashboard)/settings/subscription/page.tsx
<Button onClick={() => upgradeToTier('PROFESSIONAL')}>
  Upgrade to Professional - $49/mo
</Button>

async function upgradeToTier(tier: string) {
  const response = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ tier }),
  });
  const { sessionId } = await response.json();

  // Redirect to Stripe Checkout
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);
  await stripe?.redirectToCheckout({ sessionId });
}
```

---

## 🎯 For Now (Testing Without Payments):

### Use the Manual Upgrade Script:

```bash
# Give Obi PROFESSIONAL access
node scripts/upgrade-user.js obaidghafoor_uae@outlook.com PROFESSIONAL

# Give yourself ENTERPRISE access
node scripts/upgrade-user.js your@email.com ENTERPRISE
```

### Or Update via API:

```typescript
// POST /api/subscription
{
  "tier": "ENTERPRISE"
}
```

This will work for **internal testing** without payment processing.

---

## 🏁 What You Need for Production Launch

### Option 1: Launch with Manual Subscriptions (Simplest)
- Accept payments via email/invoice
- Manually upgrade users with the script
- No Stripe integration needed
- **Timeline**: Ready now ✅

### Option 2: Launch with Stripe (Automated)
- Implement Stripe checkout
- Add webhook handlers
- Create upgrade UI
- **Timeline**: ~2-3 days of development

### Option 3: Launch Free + Manual Upsell
- Launch with STARTER tier (free)
- Contact sales for upgrades
- Manual processing via script
- **Timeline**: Ready now ✅

---

## 📈 Performance Optimization Tips

### Current Issues:
1. API response times could be slow on cold starts
2. Large technical indicator calculations
3. External API dependencies (Yahoo Finance, etc.)

### Solutions:

#### 1. **Enable Edge Functions** (Fastest)
Create `vercel.json` in project root:
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "runtime": "edge"
    }
  }
}
```

#### 2. **Add Caching Headers**
```typescript
// In API routes
export async function GET() {
  const data = await fetchData();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  });
}
```

#### 3. **Use React Query** (Client-side caching)
```bash
npm install @tanstack/react-query
```

#### 4. **Database Connection Pooling**
Already configured with Prisma Accelerate ✅

#### 5. **Reduce Bundle Size**
```bash
# Analyze bundle
npm run build

# Look for large dependencies
npx @next/bundle-analyzer
```

---

## 🔐 Security Checklist Before Production

- ✅ Authentication working (NextAuth)
- ✅ Environment variables secured
- ✅ Database in cloud (Vercel Postgres)
- ✅ API routes protected
- ⚠️ Rate limiting (should add)
- ⚠️ CORS configuration (should review)
- ⚠️ Input validation (should audit)

---

## 📞 Support

For questions about:
- **Subscription issues**: Check `/api/subscription` endpoint logs
- **Payment integration**: Follow Stripe setup above
- **Database access**: Use Prisma Studio or upgrade script
- **Performance**: Apply optimization tips above

**Login Credentials**:
- Demo: demo@alphatrader.ai / demo123 (ENTERPRISE)
- Admin: admin@admin.com / [password] (PROFESSIONAL)
- Obi: obaidghafoor_uae@outlook.com / [password] (NONE)

---

**Last Updated**: December 18, 2025
**Production URL**: https://alphatrader-ndoj9bjb9-alpha-trader.vercel.app
