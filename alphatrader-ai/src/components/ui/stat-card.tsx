import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { PremiumCard } from "./premium-card"
import { CardContent } from "./card"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: "up" | "down" | "neutral"
  loading?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "text-primary",
  trend = "neutral",
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <PremiumCard className={className}>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="skeleton-premium h-4 w-24 rounded" />
            <div className="skeleton-premium h-8 w-32 rounded" />
            <div className="skeleton-premium h-4 w-20 rounded" />
          </div>
        </CardContent>
      </PremiumCard>
    )
  }

  const trendColor = {
    up: "text-profit",
    down: "text-loss",
    neutral: "text-neutral-change",
  }[trend]

  return (
    <PremiumCard className={cn("group", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{title}</span>
          {Icon && (
            <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", iconColor)} />
          )}
        </div>

        <div className="text-3xl font-bold mb-2">{value}</div>

        {change !== undefined && (
          <div className={cn("text-sm font-medium", trendColor)}>
            {change > 0 && "+"}
            {change}%
            {changeLabel && <span className="text-muted-foreground ml-1">({changeLabel})</span>}
          </div>
        )}
      </CardContent>
    </PremiumCard>
  )
}
