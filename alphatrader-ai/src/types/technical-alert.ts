/**
 * Technical Alert Types
 * Types for technical indicator alerts system
 */

// Indicator types
export type IndicatorType =
  | "rsi"
  | "macd"
  | "stochastic"
  | "ma_crossover"
  | "bollinger_bands";

// Alert conditions
export type AlertCondition =
  | "overbought"
  | "oversold"
  | "bullish_crossover"
  | "bearish_crossover"
  | "crosses_above"
  | "crosses_below"
  | "price_above_upper"
  | "price_below_lower";

// RSI Parameters
export interface RSIParameters {
  period: number;
  overboughtLevel?: number; // Default 70
  oversoldLevel?: number; // Default 30
}

// MACD Parameters
export interface MACDParameters {
  fastPeriod?: number; // Default 12
  slowPeriod?: number; // Default 26
  signalPeriod?: number; // Default 9
}

// Stochastic Parameters
export interface StochasticParameters {
  kPeriod?: number; // Default 14
  dPeriod?: number; // Default 3
  overboughtLevel?: number; // Default 80
  oversoldLevel?: number; // Default 20
}

// Moving Average Crossover Parameters
export interface MACrossoverParameters {
  fastPeriod: number; // e.g., 50
  slowPeriod: number; // e.g., 200
  type: "sma" | "ema";
}

// Bollinger Bands Parameters
export interface BollingerBandsParameters {
  period?: number; // Default 20
  stdDev?: number; // Default 2
  condition: "price_above_upper" | "price_below_lower";
}

// Union type for all parameters
export type IndicatorParameters =
  | RSIParameters
  | MACDParameters
  | StochasticParameters
  | MACrossoverParameters
  | BollingerBandsParameters;

// Technical Alert creation request
export interface CreateTechnicalAlertRequest {
  symbol: string;
  companyName?: string;
  indicatorType: IndicatorType;
  condition: AlertCondition;
  parameters: IndicatorParameters;
  threshold?: number;
  message?: string;
  notifyEmail?: boolean;
  notifyPush?: boolean;
  notifyInApp?: boolean;
  repeatAlert?: boolean;
  cooldownMinutes?: number;
}

// Technical Alert update request
export interface UpdateTechnicalAlertRequest {
  isActive?: boolean;
  message?: string;
  notifyEmail?: boolean;
  notifyPush?: boolean;
  notifyInApp?: boolean;
  repeatAlert?: boolean;
  cooldownMinutes?: number;
}

// Technical Alert response
export interface TechnicalAlertResponse {
  id: string;
  userId: string;
  symbol: string;
  companyName?: string;
  indicatorType: IndicatorType;
  condition: AlertCondition;
  parameters: IndicatorParameters;
  threshold?: number;
  lastValue?: number;
  message?: string;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyInApp: boolean;
  isActive: boolean;
  triggeredAt?: string;
  lastChecked?: string;
  triggerCount: number;
  repeatAlert: boolean;
  cooldownMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// Alert trigger event
export interface AlertTriggerEvent {
  alertId: string;
  symbol: string;
  indicatorType: IndicatorType;
  condition: AlertCondition;
  currentValue: number;
  previousValue?: number;
  threshold?: number;
  message?: string;
  triggeredAt: Date;
}
