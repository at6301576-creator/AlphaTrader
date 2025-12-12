"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, TrendingUp, TrendingDown, AlertCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Alert {
  id: string;
  userId: string;
  symbol: string;
  companyName: string | null;
  alertType: string;
  condition: string;
  threshold: number | null;
  percentValue: number | null;
  message: string | null;
  notifyEmail: boolean;
  notifyInApp: boolean;
  isActive: boolean;
  triggeredAt: Date | null;
  lastChecked: Date | null;
  triggerCount: number;
  repeatAlert: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function AlertNotifications() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchAlerts();
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts");
      if (response.ok) {
        const data = await response.json();
        // Only show triggered alerts that are active and notify in-app
        const triggered = data.filter(
          (alert: Alert) =>
            alert.triggeredAt && alert.isActive && alert.notifyInApp
        );
        setAlerts(triggered);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: false }),
      });
      setAlerts(alerts.filter((alert) => alert.id !== id));
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "price_above":
      case "price_below":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "percent_change":
        return <TrendingDown className="h-4 w-4 text-purple-500" />;
      case "rsi_oversold":
      case "rsi_overbought":
      case "macd_cross":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "volume_spike":
        return <Bell className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertTitle = (alert: Alert) => {
    const typeLabels: Record<string, string> = {
      price_above: "Price Above",
      price_below: "Price Below",
      percent_change: "Percent Change",
      rsi_oversold: "RSI Oversold",
      rsi_overbought: "RSI Overbought",
      macd_cross: "MACD Crossover",
      volume_spike: "Volume Spike",
    };
    return `${alert.symbol} ${typeLabels[alert.alertType] || "Alert"}`;
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-white"
        >
          <Bell className="h-5 w-5" />
          {alerts.length > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-emerald-600 text-xs"
              variant="default"
            >
              {alerts.length > 9 ? "9+" : alerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 bg-gray-900 border-gray-800 p-0"
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">Alerts</h3>
          {alerts.length > 0 && (
            <Link href="/alerts">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-emerald-500 hover:text-emerald-400"
              >
                View All
              </Button>
            </Link>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No new alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getAlertIcon(alert.alertType)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-white text-sm truncate">
                          {getAlertTitle(alert)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0 ml-2"
                          onClick={() => handleDismiss(alert.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.message ||
                          `Alert triggered for ${alert.symbol}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(alert.triggeredAt!)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {alerts.length > 5 && (
          <div className="p-3 border-t border-gray-800 text-center">
            <Link href="/alerts">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-emerald-500 hover:text-emerald-400"
              >
                View {alerts.length - 5} more alerts
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
