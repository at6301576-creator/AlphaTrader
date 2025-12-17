// Subscription tier constants and utilities

export const SubscriptionTier = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export type SubscriptionTierType = typeof SubscriptionTier[keyof typeof SubscriptionTier];

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  CANCELED: 'CANCELED',
  PAST_DUE: 'PAST_DUE',
  TRIALING: 'TRIALING',
  INCOMPLETE: 'INCOMPLETE',
  PAUSED: 'PAUSED',
} as const;

export type SubscriptionStatusType = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

// Feature limits per tier
export const TIER_LIMITS = {
  [SubscriptionTier.STARTER]: {
    name: 'Starter',
    price: 0,
    priceMonthly: 0,
    priceYearly: 0,
    features: {
      // Alerts
      alertsPerMonth: 5,
      technicalAlerts: false,
      priceAlerts: true,
      emailNotifications: false,
      pushNotifications: true,

      // Analysis
      basicTechnicalIndicators: true,
      advancedTechnicalIndicators: false,
      aiInsights: false,
      portfolioOptimization: false,

      // Screening
      shariahCompliance: true,
      customScreeningCriteria: false,
      savedScreeners: 1,

      // Portfolio
      portfolioTracking: true,
      maxPortfolioHoldings: 10,
      portfolioAnalytics: false,

      // Data
      realtimeData: false,
      historicalDataYears: 1,
      newsAccess: 'basic' as const,

      // API & Support
      apiAccess: false,
      prioritySupport: false,
      customReports: false,
      whiteLabel: false,
    },
  },
  [SubscriptionTier.PROFESSIONAL]: {
    name: 'Professional',
    price: 29,
    priceMonthly: 29,
    priceYearly: 290, // ~$24/month
    features: {
      // Alerts
      alertsPerMonth: -1, // unlimited
      technicalAlerts: true,
      priceAlerts: true,
      emailNotifications: true,
      pushNotifications: true,

      // Analysis
      basicTechnicalIndicators: true,
      advancedTechnicalIndicators: true,
      aiInsights: true,
      portfolioOptimization: true,

      // Screening
      shariahCompliance: true,
      customScreeningCriteria: true,
      savedScreeners: 10,

      // Portfolio
      portfolioTracking: true,
      maxPortfolioHoldings: 100,
      portfolioAnalytics: true,

      // Data
      realtimeData: true,
      historicalDataYears: 10,
      newsAccess: 'advanced' as const,

      // API & Support
      apiAccess: false,
      prioritySupport: false,
      customReports: true,
      whiteLabel: false,
    },
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: 'Enterprise',
    price: 99,
    priceMonthly: 99,
    priceYearly: 990, // ~$82.50/month
    features: {
      // Alerts
      alertsPerMonth: -1, // unlimited
      technicalAlerts: true,
      priceAlerts: true,
      emailNotifications: true,
      pushNotifications: true,

      // Analysis
      basicTechnicalIndicators: true,
      advancedTechnicalIndicators: true,
      aiInsights: true,
      portfolioOptimization: true,

      // Screening
      shariahCompliance: true,
      customScreeningCriteria: true,
      savedScreeners: -1, // unlimited

      // Portfolio
      portfolioTracking: true,
      maxPortfolioHoldings: -1, // unlimited
      portfolioAnalytics: true,

      // Data
      realtimeData: true,
      historicalDataYears: 20,
      newsAccess: 'premium' as const,

      // API & Support
      apiAccess: true,
      prioritySupport: true,
      customReports: true,
      whiteLabel: true,
    },
  },
} as const;

// Helper functions
export function getTierLimits(tier: SubscriptionTierType) {
  return TIER_LIMITS[tier];
}

export function canAccessFeature(
  userTier: SubscriptionTierType,
  feature: keyof typeof TIER_LIMITS[typeof SubscriptionTier.STARTER]['features']
): boolean {
  const limits = TIER_LIMITS[userTier];
  const featureValue = limits.features[feature];

  // If the feature is a boolean, return it directly
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }

  // If it's a number, -1 means unlimited (true), positive means available
  if (typeof featureValue === 'number') {
    return featureValue > 0 || featureValue === -1;
  }

  // For string values (like newsAccess), any non-empty value is true
  return !!featureValue;
}

export function checkUsageLimit(
  userTier: SubscriptionTierType,
  usageType: 'alertsPerMonth' | 'savedScreeners' | 'maxPortfolioHoldings',
  currentUsage: number
): { allowed: boolean; limit: number; remaining: number } {
  const limits = TIER_LIMITS[userTier];
  const limit = limits.features[usageType] as number;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 };
  }

  const remaining = Math.max(0, limit - currentUsage);
  const allowed = currentUsage < limit;

  return { allowed, limit, remaining };
}

export function getTierDisplayName(tier: SubscriptionTierType): string {
  return TIER_LIMITS[tier].name;
}

export function getTierPrice(tier: SubscriptionTierType, billing: 'monthly' | 'yearly' = 'monthly'): number {
  return billing === 'yearly'
    ? TIER_LIMITS[tier].priceYearly
    : TIER_LIMITS[tier].priceMonthly;
}

export function getUpgradeBenefits(currentTier: SubscriptionTierType, targetTier: SubscriptionTierType): string[] {
  const current = TIER_LIMITS[currentTier].features;
  const target = TIER_LIMITS[targetTier].features;
  const benefits: string[] = [];

  // Compare features
  if (target.alertsPerMonth === -1 && current.alertsPerMonth !== -1) {
    benefits.push('Unlimited alerts per month');
  } else if (target.alertsPerMonth > current.alertsPerMonth) {
    benefits.push(`${target.alertsPerMonth} alerts per month (up from ${current.alertsPerMonth})`);
  }

  if (target.aiInsights && !current.aiInsights) {
    benefits.push('AI-powered insights and analysis');
  }

  if (target.advancedTechnicalIndicators && !current.advancedTechnicalIndicators) {
    benefits.push('Advanced technical indicators');
  }

  if (target.portfolioOptimization && !current.portfolioOptimization) {
    benefits.push('AI portfolio optimization');
  }

  if (target.emailNotifications && !current.emailNotifications) {
    benefits.push('Email notifications');
  }

  if (target.customScreeningCriteria && !current.customScreeningCriteria) {
    benefits.push('Custom screening criteria');
  }

  if (target.portfolioAnalytics && !current.portfolioAnalytics) {
    benefits.push('Advanced portfolio analytics');
  }

  if (target.realtimeData && !current.realtimeData) {
    benefits.push('Real-time market data');
  }

  if (target.apiAccess && !current.apiAccess) {
    benefits.push('API access');
  }

  if (target.prioritySupport && !current.prioritySupport) {
    benefits.push('Priority customer support');
  }

  if (target.customReports && !current.customReports) {
    benefits.push('Custom reports and exports');
  }

  if (target.whiteLabel && !current.whiteLabel) {
    benefits.push('White-label options');
  }

  return benefits;
}

export function isSubscriptionActive(status: SubscriptionStatusType): boolean {
  return status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING;
}

export function isTrialing(status: SubscriptionStatusType): boolean {
  return status === SubscriptionStatus.TRIALING;
}

export function shouldShowUpgradePrompt(
  userTier: SubscriptionTierType,
  feature: keyof typeof TIER_LIMITS[typeof SubscriptionTier.STARTER]['features']
): { shouldShow: boolean; requiredTier?: SubscriptionTierType } {
  // If user already has access, don't show prompt
  if (canAccessFeature(userTier, feature)) {
    return { shouldShow: false };
  }

  // Find the minimum tier that provides this feature
  const tiers: SubscriptionTierType[] = [
    SubscriptionTier.STARTER,
    SubscriptionTier.PROFESSIONAL,
    SubscriptionTier.ENTERPRISE,
  ];

  for (const tier of tiers) {
    if (canAccessFeature(tier, feature)) {
      return { shouldShow: true, requiredTier: tier };
    }
  }

  return { shouldShow: false };
}
