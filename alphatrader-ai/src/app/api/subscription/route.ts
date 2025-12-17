import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubscriptionTier } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with your actual auth implementation
    // For now, we'll use a mock user ID
    // In production, get this from your auth session (e.g., NextAuth, Clerk, etc.)
    const userId = 'mock-user-id';

    // Fetch user's subscription
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    // If no subscription exists, create a default STARTER subscription
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          tier: SubscriptionTier.STARTER,
          status: 'ACTIVE',
          lastResetAt: new Date(),
        },
      });
    }

    // Check if we need to reset monthly usage counters
    const now = new Date();
    const lastReset = new Date(subscription.lastResetAt);
    const daysSinceReset = Math.floor(
      (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Reset counters if it's been more than 30 days
    if (daysSinceReset >= 30) {
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          alertsUsedThisMonth: 0,
          apiCallsThisMonth: 0,
          lastResetAt: now,
        },
      });
    }

    return NextResponse.json({
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      alertsUsedThisMonth: subscription.alertsUsedThisMonth,
      apiCallsThisMonth: subscription.apiCallsThisMonth,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with your actual auth implementation
    const userId = 'mock-user-id';

    const body = await request.json();
    const { tier } = body;

    // Validate tier
    if (!Object.values(SubscriptionTier).includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        tier,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      create: {
        userId,
        tier,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastResetAt: new Date(),
      },
    });

    return NextResponse.json({
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
