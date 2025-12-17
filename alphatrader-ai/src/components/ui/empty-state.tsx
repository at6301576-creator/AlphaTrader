import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center space-y-4", className)}>
      {Icon && (
        <div className="p-4 bg-gray-800 rounded-full">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
        {description && (
          <p className="text-sm text-gray-400 max-w-md">{description}</p>
        )}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          variant="default"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
