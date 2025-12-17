'use client';

import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface UsageLimitBadgeProps {
  usageType: 'alertsPerMonth' | 'savedScreeners' | 'maxPortfolioHoldings';
  currentUsage: number;
  className?: string;
}

export function UsageLimitBadge({ usageType, currentUsage, className }: UsageLimitBadgeProps) {
  const { checkLimit } = useSubscription();
  const { allowed, limit, remaining } = checkLimit(usageType, currentUsage);

  if (limit === -1) {
    return (
      <Badge
        variant="outline"
        className={`bg-emerald-900/20 text-emerald-400 border-emerald-600/30 ${className}`}
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        Unlimited
      </Badge>
    );
  }

  const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = !allowed;

  return (
    <Badge
      variant="outline"
      className={`${
        isAtLimit
          ? 'bg-red-900/20 text-red-400 border-red-600/30'
          : isNearLimit
          ? 'bg-yellow-900/20 text-yellow-400 border-yellow-600/30'
          : 'bg-gray-800 text-gray-400 border-gray-700'
      } ${className}`}
    >
      {isAtLimit && <AlertCircle className="h-3 w-3 mr-1" />}
      {currentUsage} / {limit}
      {isNearLimit && ` (${remaining} left)`}
    </Badge>
  );
}
