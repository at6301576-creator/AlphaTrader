"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TechnicalAlertResponse } from "@/types/technical-alert";

type TechnicalAlert = TechnicalAlertResponse;

interface TechnicalAlertsListProps {
  symbol?: string; // Filter by symbol if provided
  onAlertUpdated?: () => void;
}

export function TechnicalAlertsList({ symbol, onAlertUpdated }: TechnicalAlertsListProps) {
  const [alerts, setAlerts] = useState<TechnicalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "triggered">("all");
  const [filterIndicator, setFilterIndicator] = useState<string>("all");

  useEffect(() => {
    fetchAlerts();
  }, [symbol]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const url = symbol
        ? `/api/technical-alerts?symbol=${symbol}`
        : "/api/technical-alerts";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async (alertId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/technical-alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchAlerts();
        onAlertUpdated?.();
      }
    } catch (error) {
      console.error("Error toggling alert:", error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;

    try {
      const response = await fetch(`/api/technical-alerts/${alertId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAlerts();
        onAlertUpdated?.();
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const getIndicatorIcon = (indicator: string) => {
    switch (indicator) {
      case "rsi":
        return <Activity className="h-4 w-4" />;
      case "macd":
        return <TrendingUp className="h-4 w-4" />;
      case "stochastic":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getConditionBadge = (condition: string, indicatorType: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      // RSI
      overbought: { label: "Overbought", color: "bg-red-600" },
      oversold: { label: "Oversold", color: "bg-green-600" },
      // MACD
      bullish_crossover: { label: "Bullish Cross", color: "bg-emerald-600" },
      bearish_crossover: { label: "Bearish Cross", color: "bg-red-600" },
      // Stochastic
      stoch_overbought: { label: "Overbought", color: "bg-red-600" },
      stoch_oversold: { label: "Oversold", color: "bg-green-600" },
      // MA Crossover
      golden_cross: { label: "Golden Cross", color: "bg-yellow-600" },
      death_cross: { label: "Death Cross", color: "bg-gray-600" },
      // Bollinger Bands
      above_upper: { label: "Above Upper", color: "bg-red-600" },
      below_lower: { label: "Below Lower", color: "bg-green-600" },
      band_squeeze: { label: "Squeeze", color: "bg-blue-600" },
    };

    const badge = badges[condition] || { label: condition, color: "bg-gray-600" };
    return (
      <Badge className={`${badge.color} text-white`}>
        {badge.label}
      </Badge>
    );
  };

  const getIndicatorLabel = (type: string) => {
    const labels: Record<string, string> = {
      rsi: "RSI",
      macd: "MACD",
      stochastic: "Stochastic",
      ma_crossover: "MA Crossover",
      bollinger_bands: "Bollinger Bands",
    };
    return labels[type] || type;
  };

  const filteredAlerts = alerts.filter((alert) => {
    // Filter by status
    if (filterStatus === "active" && !alert.isActive) return false;
    if (filterStatus === "triggered" && !alert.triggeredAt) return false;

    // Filter by indicator type
    if (filterIndicator !== "all" && alert.indicatorType !== filterIndicator) return false;

    return true;
  });

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading alerts...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Technical Alerts
              {symbol && <Badge variant="outline">{symbol}</Badge>}
            </CardTitle>
            <CardDescription>
              Manage your technical indicator alerts
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="triggered">Triggered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={filterIndicator} onValueChange={setFilterIndicator}>
            <SelectTrigger className="w-[160px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Indicator" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Indicators</SelectItem>
              <SelectItem value="rsi">RSI</SelectItem>
              <SelectItem value="macd">MACD</SelectItem>
              <SelectItem value="stochastic">Stochastic</SelectItem>
              <SelectItem value="ma_crossover">MA Crossover</SelectItem>
              <SelectItem value="bollinger_bands">Bollinger Bands</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 text-right text-sm text-gray-400">
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="h-12 w-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400">No alerts found</p>
            <p className="text-sm text-gray-500 mt-1">
              {filterStatus !== "all" || filterIndicator !== "all"
                ? "Try adjusting your filters"
                : "Create your first technical alert to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`bg-gray-800 border-gray-700 transition-all ${
                  alert.isActive ? "" : "opacity-60"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Alert Info */}
                    <div className="flex-1 space-y-2">
                      {/* Symbol & Indicator */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getIndicatorIcon(alert.indicatorType)}
                          <span className="font-semibold text-lg">
                            {alert.symbol}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getIndicatorLabel(alert.indicatorType)}
                        </Badge>
                        {getConditionBadge(alert.condition, alert.indicatorType)}
                      </div>

                      {/* Company Name */}
                      {alert.companyName && (
                        <p className="text-sm text-gray-400">
                          {alert.companyName}
                        </p>
                      )}

                      {/* Message */}
                      {alert.message && (
                        <p className="text-sm text-gray-300 italic">
                          "{alert.message}"
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>Triggers: {alert.triggerCount}</span>
                        {alert.triggeredAt && (
                          <span>
                            Last: {new Date(alert.triggeredAt).toLocaleDateString()}{" "}
                            {new Date(alert.triggeredAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {alert.repeatAlert && (
                          <span className="text-blue-400">Repeating</span>
                        )}
                      </div>

                      {/* Notification Methods */}
                      <div className="flex gap-2">
                        {alert.notifyPush && (
                          <Badge variant="secondary" className="text-xs">
                            Push
                          </Badge>
                        )}
                        {alert.notifyEmail && (
                          <Badge variant="secondary" className="text-xs">
                            Email
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-3">
                      {/* Active Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {alert.isActive ? "Active" : "Paused"}
                        </span>
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={() =>
                            toggleAlert(alert.id, alert.isActive)
                          }
                        />
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
