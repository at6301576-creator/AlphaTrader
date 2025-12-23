import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "./card"

export interface PremiumCardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "glass" | "gradient" | "glow"
  hover?: boolean
  shine?: boolean
}

const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, variant = "default", hover = true, shine = false, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "card-premium",
          hover && "hover-lift",
          variant === "glass" && "glass-strong border-0",
          variant === "gradient" && "bg-gradient-subtle",
          variant === "glow" && "shadow-2xl",
          shine && "shine overflow-hidden",
          className
        )}
        {...props}
      >
        {children}
      </Card>
    )
  }
)
PremiumCard.displayName = "PremiumCard"

export { PremiumCard }
