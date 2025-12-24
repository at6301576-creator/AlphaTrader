import { PremiumCard } from "./premium-card"
import { CardContent, CardHeader } from "./card"
import { cn } from "@/lib/utils"

interface LoadingCardProps {
  rows?: number
  hasHeader?: boolean
  className?: string
}

export function LoadingCard({ rows = 3, hasHeader = true, className }: LoadingCardProps) {
  return (
    <PremiumCard className={className} hover={false}>
      {hasHeader && (
        <CardHeader>
          <div className="skeleton-premium h-6 w-3/4 rounded" />
        </CardHeader>
      )}
      <CardContent className={cn("space-y-4", hasHeader ? "pt-0" : "p-6")}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-premium h-4 w-full rounded" style={{ width: `${100 - i * 10}%` }} />
        ))}
      </CardContent>
    </PremiumCard>
  )
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-premium h-16 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function LoadingChart() {
  return (
    <PremiumCard hover={false}>
      <CardContent className="p-6">
        <div className="skeleton-premium h-64 w-full rounded-lg" />
      </CardContent>
    </PremiumCard>
  )
}
