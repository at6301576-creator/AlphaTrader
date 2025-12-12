"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Plus, Loader2 } from "lucide-react";
import type {
  IndicatorType,
  AlertCondition,
  CreateTechnicalAlertRequest,
} from "@/types/technical-alert";

interface CreateTechnicalAlertDialogProps {
  symbol?: string;
  companyName?: string;
  onAlertCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateTechnicalAlertDialog({
  symbol: initialSymbol = "",
  companyName: initialCompanyName = "",
  onAlertCreated,
  trigger,
}: CreateTechnicalAlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [symbol, setSymbol] = useState(initialSymbol);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [indicatorType, setIndicatorType] = useState<IndicatorType>("rsi");
  const [condition, setCondition] = useState<AlertCondition>("oversold");
  const [message, setMessage] = useState("");
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [repeatAlert, setRepeatAlert] = useState(false);
  const [cooldownMinutes, setCooldownMinutes] = useState("240");

  // Indicator-specific parameters
  const [rsiPeriod, setRsiPeriod] = useState("14");
  const [rsiOverbought, setRsiOverbought] = useState("70");
  const [rsiOversold, setRsiOversold] = useState("30");

  const [macdFast, setMacdFast] = useState("12");
  const [macdSlow, setMacdSlow] = useState("26");
  const [macdSignal, setMacdSignal] = useState("9");

  const [stochKPeriod, setStochKPeriod] = useState("14");
  const [stochDPeriod, setStochDPeriod] = useState("3");
  const [stochOverbought, setStochOverbought] = useState("80");
  const [stochOversold, setStochOversold] = useState("20");

  const [maFastPeriod, setMaFastPeriod] = useState("50");
  const [maSlowPeriod, setMaSlowPeriod] = useState("200");
  const [maType, setMaType] = useState<"sma" | "ema">("sma");

  const [bbPeriod, setBbPeriod] = useState("20");
  const [bbStdDev, setBbStdDev] = useState("2");
  const [bbCondition, setBbCondition] = useState<"price_above_upper" | "price_below_lower">("price_below_lower");

  // Get available conditions based on indicator type
  const getAvailableConditions = (): { value: AlertCondition; label: string }[] => {
    switch (indicatorType) {
      case "rsi":
        return [
          { value: "overbought", label: "Overbought (>70)" },
          { value: "oversold", label: "Oversold (<30)" },
        ];
      case "macd":
        return [
          { value: "bullish_crossover", label: "Bullish Crossover (Buy Signal)" },
          { value: "bearish_crossover", label: "Bearish Crossover (Sell Signal)" },
        ];
      case "stochastic":
        return [
          { value: "overbought", label: "Overbought (>80)" },
          { value: "oversold", label: "Oversold (<20)" },
          { value: "bullish_crossover", label: "Bullish Crossover (%K crosses above %D)" },
          { value: "bearish_crossover", label: "Bearish Crossover (%K crosses below %D)" },
        ];
      case "ma_crossover":
        return [
          { value: "crosses_above", label: "Golden Cross (Fast MA crosses above Slow MA)" },
          { value: "crosses_below", label: "Death Cross (Fast MA crosses below Slow MA)" },
        ];
      case "bollinger_bands":
        return [
          { value: "price_above_upper", label: "Price Above Upper Band (Overbought)" },
          { value: "price_below_lower", label: "Price Below Lower Band (Oversold)" },
        ];
      default:
        return [];
    }
  };

  // Build parameters object based on indicator type
  const buildParameters = () => {
    switch (indicatorType) {
      case "rsi":
        return {
          period: parseInt(rsiPeriod),
          overboughtLevel: parseInt(rsiOverbought),
          oversoldLevel: parseInt(rsiOversold),
        };
      case "macd":
        return {
          fastPeriod: parseInt(macdFast),
          slowPeriod: parseInt(macdSlow),
          signalPeriod: parseInt(macdSignal),
        };
      case "stochastic":
        return {
          kPeriod: parseInt(stochKPeriod),
          dPeriod: parseInt(stochDPeriod),
          overboughtLevel: parseInt(stochOverbought),
          oversoldLevel: parseInt(stochOversold),
        };
      case "ma_crossover":
        return {
          fastPeriod: parseInt(maFastPeriod),
          slowPeriod: parseInt(maSlowPeriod),
          type: maType,
        };
      case "bollinger_bands":
        return {
          period: parseInt(bbPeriod),
          stdDev: parseFloat(bbStdDev),
          condition: bbCondition,
        };
      default:
        return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const alertData: CreateTechnicalAlertRequest = {
        symbol: symbol.toUpperCase(),
        companyName: companyName || undefined,
        indicatorType,
        condition,
        parameters: buildParameters(),
        message: message || undefined,
        notifyPush,
        notifyEmail,
        repeatAlert,
        cooldownMinutes: parseInt(cooldownMinutes),
      };

      const response = await fetch("/api/technical-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error("Failed to create alert");
      }

      // Success
      setOpen(false);
      onAlertCreated?.();

      // Reset form
      setSymbol(initialSymbol);
      setCompanyName(initialCompanyName);
      setMessage("");
    } catch (error) {
      console.error("Error creating alert:", error);
      alert("Failed to create alert. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Bell className="mr-2 h-4 w-4" />
            Create Technical Alert
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Create Technical Alert
            </DialogTitle>
            <DialogDescription>
              Set up alerts based on technical indicator conditions. You'll be notified when conditions are met.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Stock Symbol */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Stock Symbol *</Label>
                <Input
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  className="bg-gray-800 border-gray-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (optional)</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Apple Inc."
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            {/* Indicator Type */}
            <div className="space-y-2">
              <Label htmlFor="indicatorType">Technical Indicator *</Label>
              <Select
                value={indicatorType}
                onValueChange={(v) => {
                  setIndicatorType(v as IndicatorType);
                  // Reset condition when indicator changes
                  const conditions = getAvailableConditions();
                  if (conditions.length > 0) {
                    setCondition(conditions[0].value);
                  }
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="rsi">RSI (Relative Strength Index)</SelectItem>
                  <SelectItem value="macd">MACD (Moving Average Convergence Divergence)</SelectItem>
                  <SelectItem value="stochastic">Stochastic Oscillator</SelectItem>
                  <SelectItem value="ma_crossover">Moving Average Crossover</SelectItem>
                  <SelectItem value="bollinger_bands">Bollinger Bands</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label htmlFor="condition">Alert Condition *</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as AlertCondition)}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {getAvailableConditions().map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Indicator-Specific Parameters */}
            <div className="border-t border-gray-800 pt-4">
              <Label className="text-sm text-gray-400 mb-2 block">Indicator Parameters</Label>

              {indicatorType === "rsi" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rsiPeriod" className="text-xs">Period</Label>
                    <Input
                      id="rsiPeriod"
                      type="number"
                      value={rsiPeriod}
                      onChange={(e) => setRsiPeriod(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="2"
                      max="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rsiOverbought" className="text-xs">Overbought Level</Label>
                    <Input
                      id="rsiOverbought"
                      type="number"
                      value={rsiOverbought}
                      onChange={(e) => setRsiOverbought(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="50"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rsiOversold" className="text-xs">Oversold Level</Label>
                    <Input
                      id="rsiOversold"
                      type="number"
                      value={rsiOversold}
                      onChange={(e) => setRsiOversold(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              )}

              {indicatorType === "macd" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="macdFast" className="text-xs">Fast Period</Label>
                    <Input
                      id="macdFast"
                      type="number"
                      value={macdFast}
                      onChange={(e) => setMacdFast(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="macdSlow" className="text-xs">Slow Period</Label>
                    <Input
                      id="macdSlow"
                      type="number"
                      value={macdSlow}
                      onChange={(e) => setMacdSlow(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="macdSignal" className="text-xs">Signal Period</Label>
                    <Input
                      id="macdSignal"
                      type="number"
                      value={macdSignal}
                      onChange={(e) => setMacdSignal(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="2"
                    />
                  </div>
                </div>
              )}

              {indicatorType === "stochastic" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stochKPeriod" className="text-xs">%K Period</Label>
                    <Input
                      id="stochKPeriod"
                      type="number"
                      value={stochKPeriod}
                      onChange={(e) => setStochKPeriod(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stochDPeriod" className="text-xs">%D Period</Label>
                    <Input
                      id="stochDPeriod"
                      type="number"
                      value={stochDPeriod}
                      onChange={(e) => setStochDPeriod(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stochOverbought" className="text-xs">Overbought</Label>
                    <Input
                      id="stochOverbought"
                      type="number"
                      value={stochOverbought}
                      onChange={(e) => setStochOverbought(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="50"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stochOversold" className="text-xs">Oversold</Label>
                    <Input
                      id="stochOversold"
                      type="number"
                      value={stochOversold}
                      onChange={(e) => setStochOversold(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              )}

              {indicatorType === "ma_crossover" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maFastPeriod" className="text-xs">Fast MA Period</Label>
                    <Input
                      id="maFastPeriod"
                      type="number"
                      value={maFastPeriod}
                      onChange={(e) => setMaFastPeriod(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maSlowPeriod" className="text-xs">Slow MA Period</Label>
                    <Input
                      id="maSlowPeriod"
                      type="number"
                      value={maSlowPeriod}
                      onChange={(e) => setMaSlowPeriod(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maType" className="text-xs">MA Type</Label>
                    <Select value={maType} onValueChange={(v) => setMaType(v as "sma" | "ema")}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="sma">SMA</SelectItem>
                        <SelectItem value="ema">EMA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {indicatorType === "bollinger_bands" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bbPeriod" className="text-xs">Period</Label>
                    <Input
                      id="bbPeriod"
                      type="number"
                      value={bbPeriod}
                      onChange={(e) => setBbPeriod(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bbStdDev" className="text-xs">Standard Deviation</Label>
                    <Input
                      id="bbStdDev"
                      type="number"
                      step="0.1"
                      value={bbStdDev}
                      onChange={(e) => setBbStdDev(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      min="0.5"
                      max="5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a custom note for this alert..."
                className="bg-gray-800 border-gray-700"
                rows={2}
              />
            </div>

            {/* Notification Settings */}
            <div className="border-t border-gray-800 pt-4 space-y-3">
              <Label className="text-sm text-gray-400">Notification Settings</Label>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifyPush" className="text-sm">Push Notifications</Label>
                  <p className="text-xs text-gray-500">Receive browser push notifications</p>
                </div>
                <Switch id="notifyPush" checked={notifyPush} onCheckedChange={setNotifyPush} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifyEmail" className="text-sm">Email Notifications</Label>
                  <p className="text-xs text-gray-500">Receive email alerts (coming soon)</p>
                </div>
                <Switch
                  id="notifyEmail"
                  checked={notifyEmail}
                  onCheckedChange={setNotifyEmail}
                  disabled
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="repeatAlert" className="text-sm">Repeat Alert</Label>
                  <p className="text-xs text-gray-500">Trigger alert multiple times</p>
                </div>
                <Switch id="repeatAlert" checked={repeatAlert} onCheckedChange={setRepeatAlert} />
              </div>

              {repeatAlert && (
                <div className="space-y-2">
                  <Label htmlFor="cooldownMinutes" className="text-sm">
                    Cooldown Period (minutes)
                  </Label>
                  <Input
                    id="cooldownMinutes"
                    type="number"
                    value={cooldownMinutes}
                    onChange={(e) => setCooldownMinutes(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                    min="1"
                    placeholder="240"
                  />
                  <p className="text-xs text-gray-500">
                    Minimum time between repeat alerts (default: 240 minutes / 4 hours)
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !symbol}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Create Alert
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
